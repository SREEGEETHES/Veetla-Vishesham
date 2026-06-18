import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Initialize DB (side-effect: creates tables)
import * as db from "./src/server/db.js";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "familyos-dev-secret-change-in-production";

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadsDir = path.join(process.cwd(), "uploads", "vault");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (_req.method === "OPTIONS") return _req.res?.end();
  next();
});

// Auth middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = user;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Admin middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// --- AUTH ENDPOINTS ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { id, role, approved } = db.createUser(name, email, passwordHash);
    const token = jwt.sign({ id, name, email, role, approved }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id, name, email, role, approved } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.approved) {
      return res.status(403).json({ error: "Account pending approval", approved: false });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, approved: user.approved }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = db.getUserById((req as any).user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

// --- ADMIN ENDPOINTS ---

app.get("/api/admin/pending-users", authenticateToken, requireAdmin, (_req, res) => {
  res.json(db.getPendingUsers());
});

app.post("/api/admin/approve/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.approveUser(id);
  res.json({ success: true });
});

app.post("/api/admin/reject/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  db.deleteUser(id);
  res.json({ success: true });
});

app.get("/api/admin/users", authenticateToken, requireAdmin, (_req, res) => {
  res.json(db.getApprovedUsers());
});

app.get("/api/members", authenticateToken, (_req, res) => {
  res.json(db.getApprovedUsers());
});

// --- DATA ENDPOINT ---

app.get("/api/data", authenticateToken, (req, res) => {
  const userId = (req as any).user?.id;
  const isAdmin = (req as any).user?.role === "admin";

  res.json({
    tasks: db.getTasks(),
    events: db.getEvents(),
    reminders: db.getReminders(),
    vaultItems: db.getVaultItems(),
    vaultFiles: db.getVaultFiles(),
    notifications: db.getNotifications(userId),
    calls: db.getActiveCalls(userId),
    members: db.getApprovedUsers()
  });
});

// --- TASKS ---

app.post("/api/tasks", authenticateToken, (req, res) => {
  const { title, description, assignee_id, due_date, points, category } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const id = db.createTask(
    title,
    description || "",
    assignee_id || null,
    (req as any).user.id,
    due_date || null,
    points || 10,
    category || "general"
  );
  res.json({ id, success: true });
});

app.get("/api/tasks", authenticateToken, (_req, res) => {
  res.json(db.getTasks());
});

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, assignee_id, due_date, completed, points, category } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (assignee_id !== undefined) updates.assignee_id = assignee_id;
  if (due_date !== undefined) updates.due_date = due_date;
  if (completed !== undefined) updates.completed = completed ? 1 : 0;
  if (points !== undefined) updates.points = points;
  if (category !== undefined) updates.category = category;

  db.updateTask(id, updates);
  res.json({ success: true });
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.deleteTask(id);
  res.json({ success: true });
});

// --- EVENTS ---

app.post("/api/events", authenticateToken, (req, res) => {
  const { title, date, time, member_id, category } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const id = db.createEvent(
    title,
    date || "",
    time || "",
    member_id || null,
    category || "family",
    (req as any).user.id
  );
  res.json({ id, success: true });
});

app.get("/api/events", authenticateToken, (_req, res) => {
  res.json(db.getEvents());
});

app.delete("/api/events/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.deleteEvent(id);
  res.json({ success: true });
});

// --- REMINDERS ---

app.post("/api/reminders", authenticateToken, (req, res) => {
  const { text, time, member_id, category } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const id = db.createReminder(
    text,
    time || "",
    member_id || null,
    category || "general",
    (req as any).user.id
  );
  res.json({ id, success: true });
});

app.get("/api/reminders", authenticateToken, (_req, res) => {
  res.json(db.getReminders());
});

app.put("/api/reminders/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { text, time, member_id, completed, category } = req.body;
  const updates: Record<string, any> = {};
  if (text !== undefined) updates.text = text;
  if (time !== undefined) updates.time = time;
  if (member_id !== undefined) updates.member_id = member_id;
  if (completed !== undefined) updates.completed = completed ? 1 : 0;
  if (category !== undefined) updates.category = category;

  db.updateReminder(id, updates);
  res.json({ success: true });
});

app.delete("/api/reminders/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.deleteReminder(id);
  res.json({ success: true });
});

// --- VAULT ITEMS ---

app.post("/api/vault/items", authenticateToken, (req, res) => {
  const { title, type, secret, note } = req.body;
  if (!title || !secret) return res.status(400).json({ error: "Title and secret are required" });

  const id = db.createVaultItem(
    title,
    type || "other",
    secret,
    note || "",
    (req as any).user.id
  );
  res.json({ id, success: true });
});

app.get("/api/vault/items", authenticateToken, (_req, res) => {
  res.json(db.getVaultItems());
});

app.delete("/api/vault/items/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.deleteVaultItem(id);
  res.json({ success: true });
});

// --- VAULT FILES ---

app.post("/api/vault/upload", authenticateToken, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const id = db.createVaultFile(
    (req as any).user.id,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    req.file.path
  );
  res.json({ id, filename: req.file.filename, original_name: req.file.originalname, success: true });
});

app.get("/api/vault/files", authenticateToken, (_req, res) => {
  res.json(db.getVaultFiles());
});

app.delete("/api/vault/files/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const file = db.getVaultFileById(id);
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
  db.deleteVaultFile(id);
  res.json({ success: true });
});

app.get("/api/vault/files/:id/download", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const file = db.getVaultFileById(id);
  if (!file) return res.status(404).json({ error: "File not found" });

  res.download(file.path, file.original_name);
});

// --- NOTIFICATIONS ---

app.get("/api/notifications", authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  res.json(db.getNotifications(userId));
});

app.post("/api/notifications/:id/read", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.markNotificationRead(id);
  res.json({ success: true });
});

app.delete("/api/notifications", authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  const readOnly = req.query.read_only === "true";
  db.deleteNotifications(userId, readOnly);
  res.json({ success: true });
});

app.post("/api/notifications", authenticateToken, (req, res) => {
  const { user_id, text, level } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const id = db.createNotification(user_id, text, level || "info");
  res.json({ id, success: true });
});

// --- CALLS / WEBRTC SIGNALING ---

app.post("/api/calls/initiate", authenticateToken, (req, res) => {
  const { callee_id } = req.body;
  if (!callee_id) return res.status(400).json({ error: "Callee ID is required" });

  const id = db.createCall((req as any).user.id, callee_id);
  res.json({ id, success: true });
});

app.post("/api/calls/:id/signal", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const { signal_data } = req.body;
  if (!signal_data) return res.status(400).json({ error: "Signal data required" });

  const existing = db.getCallById(id);
  let updatedData = { signal_data };
  if (existing?.signaling_data) {
    try {
      const existingSignals = JSON.parse(existing.signaling_data);
      updatedData = { signal_data: JSON.stringify([...existingSignals, { signal_data, timestamp: Date.now() }]) };
    } catch {
      updatedData = { signal_data: JSON.stringify([{ signal_data, timestamp: Date.now() }]) };
    }
  } else {
    updatedData = { signal_data: JSON.stringify([{ signal_data, timestamp: Date.now() }]) };
  }
  db.updateCallSignaling(id, updatedData.signal_data);
  res.json({ success: true });
});

app.get("/api/calls/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const call = db.getCallById(id);
  if (!call) return res.status(404).json({ error: "Call not found" });
  res.json(call);
});

app.post("/api/calls/:id/accept", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.acceptCall(id);
  res.json({ success: true });
});

app.post("/api/calls/:id/end", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  db.endCall(id);
  res.json({ success: true });
});

app.get("/api/calls/active", authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  res.json(db.getActiveCalls(userId));
});

// --- AI ENDPOINTS (preserved from original) ---

// Initialize Lazy Gemini SDK Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is missing. App will use local parser fallback.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Deterministic local parsing logic
function parseCommandFallback(prompt: string) {
  const lower = prompt.toLowerCase();
  
  if (lower.includes("vitamin") || lower.includes("medication") || lower.includes("pill") || lower.includes("take")) {
    return {
      type: "reminder",
      data: {
        text: prompt.replace(/remind me to |add reminder to /i, "").trim(),
        time: "9:00 AM",
        category: "medication",
        member: lower.includes("dad") ? "Dad" : "Mom"
      },
      explanation: `I've registered a medicine reminder: "${prompt}" scheduled for the morning.`
    };
  }

  if (lower.includes("buy") || lower.includes("grocery") || lower.includes("milk") || lower.includes("shopping") || lower.includes("store")) {
    return {
      type: "reminder",
      data: {
        text: prompt.replace(/remind me to buy |add to shopping |grocery /i, "").trim(),
        time: "5:00 PM",
        category: "shopping",
        member: lower.includes("dad") ? "Dad" : "Mom"
      },
      explanation: `Added to the joint weekly shopping list: "${prompt}"`
    };
  }

  if (lower.includes("chore") || lower.includes("clean") || lower.includes("wash") || lower.includes("rake") || lower.includes("trash")) {
    return {
      type: "chore",
      data: {
        title: prompt.replace(/add chore |assign chore /i, "").trim(),
        assignee: lower.includes("dad") ? "Dad" : "Mom",
        points: 15,
        dueDate: "2026-06-18"
      },
      explanation: `Assigned a new domestic duty task on the scoreboard: "${prompt}"`
    };
  }

  if (lower.includes("appointment") || lower.includes(" dentist ") || lower.includes("party") || lower.includes("birthday") || lower.includes("dinner") || lower.includes("schedule")) {
    return {
      type: "calendar",
      data: {
        title: prompt.replace(/schedule |add to calendar |book /i, "").trim(),
        date: "2026-06-20",
        time: "6:30 PM",
        member: "Everyone",
        category: "family"
      },
      explanation: `Integrated this celebration into our Shared Calendar: "${prompt}" (June 20, 2026).`
    };
  }

  return {
    type: "reminder",
    data: {
      text: prompt,
      time: "12:00 PM",
      category: "general",
      member: "Everyone"
    },
    explanation: `Logged general family card: "${prompt}"`
  };
}

app.post("/api/ai/parse", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt query string" });
  }

  const ai = getGemini();

  if (!ai) {
    const fallbackResponse = parseCommandFallback(prompt);
    return res.json(fallbackResponse);
  }

  try {
    const formattedPrompt = `You are the central parsing core of FamilyOS. Your mission is to analyze the voice transcription or typed text of a family member's request, and determine if it represents a 'reminder', a 'chore', or a 'calendar' event. 
Input: "${prompt}"

Current date reference is 2026-06-17. Today is Wednesday. Mom's birthday is Saturday June 20, 2026.
Output MUST be structured as a JSON object matching this schema:
{
  "type": "reminder" | "chore" | "calendar" | "none",
  "data": {
    "text": { type: Type.STRING },
    "time": { type: Type.STRING },
    "category": { type: Type.STRING },
    "title": { type: Type.STRING },
    "assignee": { type: Type.STRING },
    "points": { type: Type.INTEGER },
    "dueDate": { type: Type.STRING },
    "date": { type: Type.STRING },
    "member": { type: Type.STRING }
  },
  "explanation": "A friendly human notification stating what action got completed."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            explanation: { type: Type.STRING },
            data: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                time: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                assignee: { type: Type.STRING },
                points: { type: Type.INTEGER },
                dueDate: { type: Type.STRING },
                date: { type: Type.STRING },
                member: { type: Type.STRING }
              }
            }
          },
          required: ["type", "explanation"]
        }
      }
    });

    const textOutput = response.text || "{}";
    const resultObj = JSON.parse(textOutput.trim());
    res.json(resultObj);
  } catch (error) {
    console.error("AI Parse failed, executing local parser fallback:", error);
    res.json(parseCommandFallback(prompt));
  }
});

app.post("/api/ai/gift", async (req, res) => {
  const { query, recipient } = req.body;
  const ai = getGemini();

  if (!ai) {
    return res.json({
      recipient: recipient || "Mom",
      ideas: [
        "🌸 Handcrafted Lavender Bath Bombs Set & Botanical Body Scrub",
        "📓 Elegant Custom Leather Journal & Calligraphy Pen set",
        "🌿 Artisan Olive oil tasting and balsamic syrup gourmet basket",
        "🧁 Private Scone and High Tea Baking Masterclass package",
        "🎟️ Tickets to the local botanical garden concert series"
      ]
    });
  }

  try {
    const formattedPrompt = `Generates exactly 5 unique, thoughtful, high-contrast, specific gift ideas for a recipient. 
Recipient: ${recipient || "Mom"}
Context or extra notes: ${query || "loves cozy gardens, botanical design, premium high contrast lifestyle, high-quality family time"}

Output MUST be a JSON array of strings, each string should be a gift idea with brief description and a relevant emoji prefix.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const parsedIdeas = JSON.parse((response.text || "[]").trim());
    res.json({ recipient: recipient || "Mom", ideas: parsedIdeas });
  } catch (err) {
    console.error("Gift planner generation failed, fallback values returned:", err);
    res.json({
      recipient: recipient || "Mom",
      ideas: [
        "🌸 Lavender fields high-scent therapeutic set",
        "📓 Organic linen notebook with gold trim embossing",
        "🌿 Copper spray watering can and indoor herb collection",
        "🧁 Premium afternoon tea and pastry experience",
        "🎟️ Intimate acoustical live garden performance ticket"
      ]
    });
  }
});

// --- SERVER START ---

async function startServer() {
  await db.initDb();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();