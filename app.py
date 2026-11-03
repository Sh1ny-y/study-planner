
from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from datetime import date
app = Flask(__name__)


def init_db():
    with sqlite3.connect("tasks.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                deadline TEXT,
                completed INTEGER DEFAULT 0
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        """)

        default_subjects = [
            "ICT", "Math", "English",
            "Science", "Other"
        ]

        for subject in default_subjects:
            conn.execute(
                "INSERT OR IGNORE INTO subjects (name) VALUES (?)",
                (subject,)
            )


@app.route("/")

@app.route("/")
def home():
    task_filter = request.args.get("filter", "all")

    if task_filter not in ["all", "pending", "completed"]:
        task_filter = "all"

    with sqlite3.connect("tasks.db") as conn:
        conn.row_factory = sqlite3.Row

        all_tasks = conn.execute(
            "SELECT * FROM tasks ORDER BY completed, deadline"
        ).fetchall()
        subjects = conn.execute(
            "SELECT name FROM subjects ORDER BY name"
        ).fetchall()

    if task_filter == "completed":
        filtered_tasks = [
            task for task in all_tasks if task["completed"]
        ]
    elif task_filter == "pending":
        filtered_tasks = [
            task for task in all_tasks if not task["completed"]
        ]
    else:
        filtered_tasks = all_tasks

    return render_template(
    "index.html",
    tasks=all_tasks,
    filtered_tasks=filtered_tasks,
    subjects=subjects,
    current_filter=task_filter,
    today=date.today().isoformat()
)


@app.route("/add", methods=["POST"])
def add_task():
    title = request.form.get("title", "").strip()
    subject = request.form.get("subject", "Other")
    deadline = request.form.get("deadline", "")

    if title:
        with sqlite3.connect("tasks.db") as conn:
            conn.execute(
                "INSERT INTO tasks (title, subject, deadline) VALUES (?, ?, ?)",
                (title, subject, deadline)
            )

    return redirect(url_for("home"))

@app.route("/complete/<int:task_id>", methods=["POST"])
def complete(task_id):
    with sqlite3.connect("tasks.db") as conn:
        conn.execute(
            "UPDATE tasks SET completed = 1 - completed WHERE id = ?",
            (task_id,)
        )
    return redirect(url_for("home"))

@app.route("/delete/<int:task_id>", methods=["POST"])
def delete(task_id):
    with sqlite3.connect("tasks.db") as conn:
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return redirect(url_for("home"))


@app.route("/add_subject", methods=["POST"])
def add_subject():
    name = request.form.get("subject_name", "").strip()

    if name and len(name) <= 50:
        with sqlite3.connect("tasks.db") as conn:
            conn.execute(
                "INSERT OR IGNORE INTO subjects (name) VALUES (?)",
                (name,)
            )

    return redirect(url_for("home"))

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
