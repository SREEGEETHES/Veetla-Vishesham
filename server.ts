import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

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

// Initial Family State
const initialFamilyState = {
  reminders: [
    { id: "rem-1", text: "Vitamins (Dad)", time: "8:00 AM", member: "Dad", completed: false, category: "medication" },
    { id: "rem-2", text: "Grocery Pickup (3 items)", time: "5:30 PM", member: "Mom", completed: false, category: "shopping" }
  ],
  chores: [
    { id: "cho-1", title: "Rake the garden leaves", assignee: "Dad", points: 15, completed: false, dueDate: "2026-06-19" },
    { id: "cho-2", title: "Empty the recycling bin", assignee: "Dad", points: 10, completed: true, dueDate: "2026-06-17" },
    { id: "cho-3", title: "Walk Buster the dog", assignee: "Dad", points: 15, completed: false, dueDate: "2026-06-18" }
  ],
  vaultSecrets: [
    { id: "sec-1", title: "Home WiFi Secret", type: "wifi", secret: "MillersRock2026!", note: "SSID: Millers_Family_5G", lastUpdated: "Updated 2 days ago" },
    { id: "sec-2", title: "Family Travel Policy", type: "policy", secret: "POL-7729-XJ9", note: "Allianz Global Travel Corp. Call: 1-800-555-0199", lastUpdated: "Updated 1 week ago" }
  ],
  calendarEvents: [
    { id: "cal-1", title: "Mom's Birthday Celebration", date: "2026-06-20", time: "6:00 PM", member: "Everyone", category: "family" },
    { id: "cal-2", title: "Dad's Dentist visit", date: "2026-06-22", time: "11:15 AM", member: "Dad", category: "medical" },
    { id: "cal-3", title: "Weekly Family Meeting", date: "2026-06-21", time: "4:00 PM", member: "Everyone", category: "family" }
  ],
  sosStatuses: [],
  notifications: [
    { id: "not-1", text: "Mom's birthday is in 3 days! Plan gift ideas.", timestamp: "8:30 AM", read: false, level: "info" }
  ]
};

// State Store Loader / Saver
let familyState = { ...initialFamilyState };

function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // merge default structures to ensure integrity
      familyState = {
        reminders: parsed.reminders || [],
        chores: parsed.chores || [],
        vaultSecrets: parsed.vaultSecrets || [],
        calendarEvents: parsed.calendarEvents || [],
        sosStatuses: parsed.sosStatuses || [],
        notifications: parsed.notifications || []
      };
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialFamilyState, null, 2));
    }
  } catch (error) {
    console.error("Failed to load local DB, fallback in memory state", error);
  }
}

function saveState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(familyState, null, 2));
  } catch (error) {
    console.error("Failed to write to local DB", error);
  }
}

// Initial Loading
loadState();

// --- API ENDPOINTS ---

// Load current board
app.get("/api/data", (req, res) => {
  res.json(familyState);
});

// Update state directly from client
app.post("/api/data", (req, res) => {
  familyState = req.body;
  saveState();
  res.json({ success: true, count: Object.keys(familyState).length });
});

// AI Parsing of Speech / text commands
app.post("/api/ai/parse", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt query string" });
  }

  const ai = getGemini();

  if (!ai) {
    // Fallback deterministic local parser if NO GEMINI KEY is set
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
    // fields for reminder: text (string), time (string representation like '4:00 PM'), category ('medication' | 'shopping' | 'general' | 'appointment')
    // fields for chore: title (string), assignee (string like 'Dad', 'Mom' or name), points (number, default to 10), dueDate (string date like '2026-06-18')
    // fields for calendar: title (string), date (string as 'YYYY-MM-DD'), time (string), member (string like 'Dad', 'Everyone'), category ('family' | 'school' | 'medical' | 'social')
  },
  "explanation": "A friendly human notification stating what action got completed. E.g.: 'I've added dry cleaning to Mom's schedule for tomorrow!'"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Type of entity parsed" },
            explanation: { type: Type.STRING, description: "System explanation to the user" },
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

// AI Gift idea recommendations generator
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

  // Default fallback if we cannot guess
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

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
