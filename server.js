const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API 1: Get all tasks
app.get("/api/tasks", (req, res) => {
    try {
        const tasks = db.prepare(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).all();

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);

        res.status(500).json({
            error: "Unable to fetch tasks."
        });
    }
});

// API 2: Create a task
app.post("/api/tasks", (req, res) => {
    try {
        const title =
            typeof req.body.title === "string"
                ? req.body.title.trim()
                : "";

        if (!title || title.length > 200) {
            return res.status(400).json({
                error: "Task title must contain 1–200 characters."
            });
        }

        const result = db.prepare(
            "INSERT INTO tasks (title) VALUES (?)"
        ).run(title);

        const task = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json(task);
    } catch (error) {
        console.error("Error creating task:", error);

        res.status(500).json({
            error: "Unable to create task."
        });
    }
});

// API 3: Update task completion status
app.patch("/api/tasks/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid task ID."
            });
        }

        if (typeof req.body.completed !== "boolean") {
            return res.status(400).json({
                error: "Completion status must be true or false."
            });
        }

        const result = db.prepare(
            "UPDATE tasks SET completed = ? WHERE id = ?"
        ).run(req.body.completed ? 1 : 0, id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Task not found."
            });
        }

        const task = db.prepare(
            "SELECT * FROM tasks WHERE id = ?"
        ).get(id);

        res.json(task);
    } catch (error) {
        console.error("Error updating task:", error);

        res.status(500).json({
            error: "Unable to update task."
        });
    }
});

// API 4: Delete a task
app.delete("/api/tasks/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid task ID."
            });
        }

        const result = db.prepare(
            "DELETE FROM tasks WHERE id = ?"
        ).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Task not found."
            });
        }

        res.json({
            message: "Task deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting task:", error);

        res.status(500).json({
            error: "Unable to delete task."
        });
    }
});

// Start the server
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Task Manager running on http://localhost:${PORT}`);
});

// Close connections gracefully when the process is stopped
function shutdown() {
    server.close(() => {
        db.close();
        process.exit(0);
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);