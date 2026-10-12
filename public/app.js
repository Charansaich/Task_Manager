const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const addButton = document.getElementById("add-button");

const taskList = document.getElementById("task-list");
const statusMessage = document.getElementById("status");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

let tasks = [];

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

function showStatus(message = "") {
    statusMessage.textContent = message;
}

function updateStats() {
    totalCount.textContent = tasks.length;

    pendingCount.textContent = tasks.filter(
        task => !task.completed
    ).length;

    completedCount.textContent = tasks.filter(
        task => Boolean(task.completed)
    ).length;
}

function renderTasks() {
    taskList.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement("li");

        empty.className = "empty-state";
        empty.textContent = "No tasks yet. Add your first task!";

        taskList.appendChild(empty);
    }

    tasks.forEach(task => {
        const item = document.createElement("li");
        item.className = "task-item";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.completed);

        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as completed`
        );

        checkbox.addEventListener("change", async () => {
            checkbox.disabled = true;

            try {
                await apiRequest(`/api/tasks/${task.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        completed: checkbox.checked
                    })
                });

                await loadTasks();
                showStatus("");
            } catch (error) {
                showStatus(error.message);
                await loadTasks();
            }
        });

        const title = document.createElement("span");

        title.className = "task-title";
        title.textContent = task.title;

        if (task.completed) {
            title.classList.add("completed");
        }

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            deleteButton.disabled = true;

            try {
                await apiRequest(`/api/tasks/${task.id}`, {
                    method: "DELETE"
                });

                showStatus("");
                await loadTasks();
            } catch (error) {
                showStatus(error.message);
                deleteButton.disabled = false;
            }
        });

        item.append(checkbox, title, deleteButton);
        taskList.appendChild(item);
    });

    updateStats();
}

async function loadTasks() {
    tasks = await apiRequest("/api/tasks");
    renderTasks();
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const title = input.value.trim();

    if (!title) {
        showStatus("Please enter a task.");
        return;
    }

    addButton.disabled = true;

    try {
        await apiRequest("/api/tasks", {
            method: "POST",
            body: JSON.stringify({ title })
        });

        input.value = "";
        showStatus("");

        await loadTasks();
        input.focus();
    } catch (error) {
        showStatus(error.message);
    } finally {
        addButton.disabled = false;
    }
});

loadTasks().catch(error => {
    showStatus(`Could not load tasks: ${error.message}`);
});