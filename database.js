const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Create the database directory if it doesn't exist
const dataDirectory = path.join(__dirname, "data");

fs.mkdirSync(dataDirectory, { recursive: true });

// Connect to the SQLite database
const databasePath = path.join(dataDirectory, "tasks.db");
const db = new Database(databasePath);

// Create the tasks table
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("Database connected successfully!");

module.exports = db;