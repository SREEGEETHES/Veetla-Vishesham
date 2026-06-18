import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "familyos.db");

let db: SqlJsDatabase;
let initPromise: Promise<void>;

async function ensureInit() {
  if (initPromise) return initPromise;
  initPromise = init().catch(console.error);
  return initPromise;
}

async function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", "vault");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
      approved INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      due_date TEXT,
      completed INTEGER DEFAULT 0,
      points INTEGER DEFAULT 10,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT,
      time TEXT,
      member_id INTEGER REFERENCES users(id),
      category TEXT DEFAULT 'family',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      time TEXT,
      member_id INTEGER REFERENCES users(id),
      completed INTEGER DEFAULT 0,
      category TEXT DEFAULT 'general',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS vault_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'other',
      secret TEXT NOT NULL,
      note TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS vault_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      text TEXT NOT NULL,
      level TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('safe','assistance')),
      message TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caller_id INTEGER REFERENCES users(id),
      callee_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      signaling_data TEXT,
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  save();
}

function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function queryOne(sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function queryAll(sql: string, params: any[] = []): any[] {
  const results: any[] = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function run(sql: string, params: any[] = []) {
  db.run(sql, params);
  const res = db.exec("SELECT last_insert_rowid()");
  const lastInsertRowid = res[0]?.values[0]?.[0];
  save();
  return { lastInsertRowid };
}

// User helpers
export function getUserByEmail(email: string) {
  return queryOne("SELECT * FROM users WHERE email = ?", [email]);
}

export function getUserById(id: number) {
  return queryOne("SELECT id, name, email, role, approved, avatar, created_at FROM users WHERE id = ?", [id]);
}

export function createUser(name: string, email: string, passwordHash: string) {
  const isFirst = countUsers() === 0;
  const role = isFirst ? "admin" : "member";
  const approved = isFirst ? 1 : 0;
  const result = run(
    "INSERT INTO users (name, email, password_hash, role, approved) VALUES (?, ?, ?, ?, ?)",
    [name, email, passwordHash, role, approved]
  );
  return { id: result.lastInsertRowid, role, approved };
}

export function countUsers() {
  const row = queryOne("SELECT COUNT(*) as count FROM users");
  return row?.count ?? 0;
}

export function getApprovedUsers() {
  return queryAll("SELECT id, name, email, role, approved, avatar, created_at FROM users WHERE approved = 1");
}

export function getPendingUsers() {
  return queryAll("SELECT id, name, email, role, created_at FROM users WHERE approved = 0");
}

export function approveUser(id: number) {
  run("UPDATE users SET approved = 1 WHERE id = ?", [id]);
}

export function deleteUser(id: number) {
  run("DELETE FROM users WHERE id = ?", [id]);
}

// Task helpers
export function getTasks() {
  return queryAll(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.created_by = c.id
    ORDER BY t.created_at DESC
  `);
}

export function getTaskById(id: number) {
  return queryOne(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `, [id]);
}

export function createTask(title: string, description: string, assigneeId: number | null, createdBy: number, dueDate: string | null, points: number, category: string) {
  const r = run(
    "INSERT INTO tasks (title, description, assignee_id, created_by, due_date, points, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, description, assigneeId, createdBy, dueDate, points, category]
  );
  return r.lastInsertRowid;
}

export function updateTask(id: number, updates: Record<string, any>) {
  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => updates[f]);
  run(`UPDATE tasks SET ${setClause} WHERE id = ?`, [...values, id]);
}

export function deleteTask(id: number) {
  run("DELETE FROM tasks WHERE id = ?", [id]);
}

// Event helpers
export function getEvents() {
  return queryAll(`
    SELECT e.*, u.name as member_name, c.name as creator_name
    FROM events e
    LEFT JOIN users u ON e.member_id = u.id
    LEFT JOIN users c ON e.created_by = c.id
    ORDER BY e.date ASC
  `);
}

export function createEvent(title: string, date: string, time: string, memberId: number | null, category: string, createdBy: number) {
  const r = run(
    "INSERT INTO events (title, date, time, member_id, category, created_by) VALUES (?, ?, ?, ?, ?, ?)",
    [title, date, time, memberId, category, createdBy]
  );
  return r.lastInsertRowid;
}

export function deleteEvent(id: number) {
  run("DELETE FROM events WHERE id = ?", [id]);
}

// Reminder helpers
export function getReminders() {
  return queryAll(`
    SELECT r.*, u.name as member_name, c.name as creator_name
    FROM reminders r
    LEFT JOIN users u ON r.member_id = u.id
    LEFT JOIN users c ON r.created_by = c.id
    ORDER BY r.created_at DESC
  `);
}

export function createReminder(text: string, time: string, memberId: number | null, category: string, createdBy: number) {
  const r = run(
    "INSERT INTO reminders (text, time, member_id, category, created_by) VALUES (?, ?, ?, ?, ?)",
    [text, time, memberId, category, createdBy]
  );
  return r.lastInsertRowid;
}

export function updateReminder(id: number, updates: Record<string, any>) {
  const fields = Object.keys(updates);
  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => updates[f]);
  run(`UPDATE reminders SET ${setClause} WHERE id = ?`, [...values, id]);
}

export function deleteReminder(id: number) {
  run("DELETE FROM reminders WHERE id = ?", [id]);
}

// Vault item helpers
export function getVaultItems() {
  return queryAll(`
    SELECT v.*, u.name as owner_name
    FROM vault_items v
    LEFT JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC
  `);
}

export function createVaultItem(title: string, type: string, secret: string, note: string, userId: number) {
  const r = run(
    "INSERT INTO vault_items (title, type, secret, note, user_id) VALUES (?, ?, ?, ?, ?)",
    [title, type, secret, note, userId]
  );
  return r.lastInsertRowid;
}

export function deleteVaultItem(id: number) {
  run("DELETE FROM vault_items WHERE id = ?", [id]);
}

// Vault file helpers
export function getVaultFiles() {
  return queryAll(`
    SELECT v.*, u.name as uploader_name
    FROM vault_files v
    LEFT JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC
  `);
}

export function createVaultFile(userId: number, filename: string, originalName: string, mimeType: string, size: number, filePath: string) {
  const r = run(
    "INSERT INTO vault_files (user_id, filename, original_name, mime_type, size, path) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, filename, originalName, mimeType, size, filePath]
  );
  return r.lastInsertRowid;
}

export function getVaultFileById(id: number) {
  return queryOne("SELECT * FROM vault_files WHERE id = ?", [id]);
}

export function deleteVaultFile(id: number) {
  run("DELETE FROM vault_files WHERE id = ?", [id]);
}

// Notification helpers
export function getNotifications(userId: number) {
  return queryAll("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

export function createNotification(userId: number, text: string, level: string) {
  const r = run(
    "INSERT INTO notifications (user_id, text, level) VALUES (?, ?, ?)",
    [userId, text, level]
  );
  return r.lastInsertRowid;
}

export function markNotificationRead(id: number) {
  run("UPDATE notifications SET read = 1 WHERE id = ?", [id]);
}

export function deleteNotifications(userId: number, readOnly?: boolean) {
  if (readOnly) {
    run("DELETE FROM notifications WHERE user_id = ? AND read = 1", [userId]);
  } else {
    run("DELETE FROM notifications WHERE user_id = ?", [userId]);
  }
}

// Call helpers
export function createCall(callerId: number, calleeId: number) {
  const r = run(
    "INSERT INTO calls (caller_id, callee_id) VALUES (?, ?)",
    [callerId, calleeId]
  );
  return r.lastInsertRowid;
}

export function getCallById(id: number) {
  return queryOne(`
    SELECT c.*, caller.name as caller_name, callee.name as callee_name
    FROM calls c
    LEFT JOIN users caller ON c.caller_id = caller.id
    LEFT JOIN users callee ON c.callee_id = callee.id
    WHERE c.id = ?
  `, [id]);
}

export function updateCallSignaling(id: number, signalingData: string) {
  run("UPDATE calls SET signaling_data = ? WHERE id = ?", [signalingData, id]);
}

export function acceptCall(id: number) {
  run("UPDATE calls SET status = 'active', started_at = datetime('now') WHERE id = ?", [id]);
}

export function endCall(id: number) {
  run("UPDATE calls SET status = 'ended', ended_at = datetime('now') WHERE id = ?", [id]);
}

export function getActiveCalls(userId: number) {
  return queryAll(`
    SELECT c.*, caller.name as caller_name, callee.name as callee_name
    FROM calls c
    LEFT JOIN users caller ON c.caller_id = caller.id
    LEFT JOIN users callee ON c.callee_id = callee.id
    WHERE (c.caller_id = ? OR c.callee_id = ?) AND c.status IN ('pending', 'active')
    ORDER BY c.created_at DESC
  `, [userId, userId]);
}

// SOS alert helpers
export function getSosAlerts() {
  return queryAll("SELECT * FROM sos_alerts ORDER BY created_at DESC");
}

export function createSosAlert(name: string, status: string, message: string, latitude: number | null, longitude: number | null) {
  const r = run(
    "INSERT INTO sos_alerts (name, status, message, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
    [name, status, message, latitude, longitude]
  );
  return r.lastInsertRowid;
}

export function clearSosAlerts() {
  run("DELETE FROM sos_alerts");
}

// Event update helper
export function updateEvent(id: number, updates: Record<string, any>) {
  const fields = Object.keys(updates);
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const values = fields.map(f => updates[f]);
  run(`UPDATE events SET ${setClause} WHERE id = ?`, [...values, id]);
}

// Export init for server startup
export async function initDb() {
  await ensureInit();
}