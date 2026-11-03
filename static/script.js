
const defaultSubjects = [
    "ICT", "Math", "English", "Science", "Other"
];

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let tasks = loadData("studyPlannerTasks", []);
let subjects = loadData(
    "studyPlannerSubjects", defaultSubjects
);
let currentFilter = "all";

if (!Array.isArray(tasks)) tasks = [];
if (!Array.isArray(subjects)) {
    subjects = [...defaultSubjects];
}

function saveData() {
    try {
        localStorage.setItem(
            "studyPlannerTasks", JSON.stringify(tasks)
        );
        localStorage.setItem(
            "studyPlannerSubjects", JSON.stringify(subjects)
        );
    } catch {
        alert("Unable to save data in this browser.");
    }
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function renderSubjects() {
    const list = document.getElementById("subject-list");
    const select = document.getElementById("task-subject");
    const previous = select.value;

    list.replaceChildren();
    select.replaceChildren();

    subjects.forEach(subject => {
        list.appendChild(
            makeElement("span", "subject-tag", subject)
        );

        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        select.appendChild(option);
    });

    if (subjects.includes(previous)) {
        select.value = previous;
    }
}

document.getElementById("subject-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const input = document.getElementById("subject-name");
        const name = input.value.trim();

        if (!name || name.length > 50) return;

        const exists = subjects.some(
            s => s.toLowerCase() === name.toLowerCase()
        );

        if (exists) {
            alert("This subject already exists!");
            return;
        }

        subjects.push(name);
        saveData();
        renderSubjects();

        document.getElementById("task-subject").value = name;
        input.value = "";
    });

document.getElementById("task-form")
    .addEventListener("submit", function(event) {
        event.preventDefault();

        const titleInput = document.getElementById("task-title");
        const title = titleInput.value.trim();
        const subject = document.getElementById("task-subject").value;
        const deadline = document.getElementById("task-deadline").value;

        if (!title || title.length > 150) return;

        tasks.push({
            id: crypto.randomUUID(),
            title: title,
            subject: subject,
            deadline: deadline,
            completed: false
        });

        saveData();
        renderTasks();
        titleInput.value = "";
        document.getElementById("task-deadline").value = "";
    });

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? {...task, completed: !task.completed}
            : task
    );

    saveData();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveData();
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("task-list");
    list.replaceChildren();

    const completed = tasks.filter(t => t.completed).length;
    const remaining = tasks.length - completed;

    document.getElementById("total").textContent = tasks.length;
    document.getElementById("completed").textContent = completed;
    document.getElementById("remaining").textContent = remaining;

    const progress = tasks.length
        ? Math.round(completed / tasks.length * 100)
        : 0;

    document.getElementById("progress-text").textContent =
        progress + "% Completed";

    document.getElementById("progress-fill").style.width =
        progress + "%";

    const filtered = tasks.filter(task => {
        if (currentFilter === "completed") return task.completed;
        if (currentFilter === "pending") return !task.completed;
        return true;
    });

    if (filtered.length === 0) {
        list.appendChild(
            makeElement("p", "empty", "No tasks to show")
        );
        return;
    }

    filtered.forEach(task => {
        const card = makeElement(
            "div", task.completed ? "task done" : "task"
        );
        const info = makeElement("div", "task-info");

        info.appendChild(makeElement("h3", "", task.title));
        info.appendChild(
            makeElement("p", "", "📖 " + task.subject)
        );

        if (task.deadline) {
            info.appendChild(
                makeElement("p", "", "📅 " + task.deadline)
            );

            if (!task.completed) {
                const today = getToday();
                let label, status;

                if (task.deadline < today) {
                    label = "⚠️ Overdue!";
                    status = "overdue";
                } else if (task.deadline === today) {
                    label = "⏰ Due Today!";
                    status = "today";
                } else {
                    label = "📅 Upcoming";
                    status = "upcoming";
                }

                info.appendChild(
                    makeElement("span", "deadline " + status, label)
                );
            }
        }

        const actions = makeElement("div", "actions");

        const completeButton = makeElement(
            "button", "complete-btn",
            task.completed ? "↩" : "✓"
        );
        completeButton.type = "button";
        completeButton.addEventListener(
            "click", () => toggleTask(task.id)
        );

        const deleteButton = makeElement(
            "button", "delete-btn", "✕"
        );
        deleteButton.type = "button";
        deleteButton.addEventListener(
            "click", () => deleteTask(task.id)
        );

        actions.append(completeButton, deleteButton);
        card.append(info, actions);
        list.appendChild(card);
    });
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function() {
        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter-btn")
            .forEach(btn => btn.classList.remove("active"));

        this.classList.add("active");
        renderTasks();
    });
});

renderSubjects();
renderTasks();

/* Light and Dark Mode */

const themeButton = document.getElementById("theme-toggle");

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    themeButton.textContent = isDark
        ? "☀️"
        : "🌙";
}

let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("studyPlannerTheme")
        || "light";
} catch {
    // Use light mode if browser storage is unavailable.
}

applyTheme(savedTheme);

themeButton.addEventListener("click", function() {
    const newTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";

    applyTheme(newTheme);

    try {
        localStorage.setItem("studyPlannerTheme", newTheme);
    } catch {
        // Theme still changes for the current page.
    }
});
