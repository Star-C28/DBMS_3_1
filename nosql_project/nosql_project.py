import customtkinter as ctk
from tkinter import ttk, messagebox
from pymongo import MongoClient
from bson.objectid import ObjectId

# MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["student_management_db"]
students = db["students"]

selected_id = None

ctk.set_appearance_mode("light")
ctk.set_default_color_theme("blue")


# ---------- FUNCTIONS ----------

def clear_form():
    global selected_id
    selected_id = None
    name_entry.delete(0, "end")
    id_entry.delete(0, "end")
    dept_entry.delete(0, "end")
    session_entry.delete(0, "end")
    age_entry.delete(0, "end")


def load_students(search=""):
    for row in table.get_children():
        table.delete(row)

    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"student_id": {"$regex": search, "$options": "i"}},
                {"department": {"$regex": search, "$options": "i"}},
                {"session": {"$regex": search, "$options": "i"}},
            ]
        }

    data = list(students.find(query))
    total_label.configure(text=f"Total Students: {len(data)}")

    for student in data:
        table.insert(
            "",
            "end",
            values=(
                str(student["_id"]),
                student.get("name", ""),
                student.get("student_id", ""),
                student.get("department", ""),
                student.get("session", ""),
                student.get("age", "")
            )
        )


def add_student():
    name = name_entry.get().strip()
    student_id = id_entry.get().strip()
    department = dept_entry.get().strip()
    session = session_entry.get().strip()
    age = age_entry.get().strip()

    if not all([name, student_id, department, session, age]):
        messagebox.showwarning("Warning", "Fill all fields")
        return

    if students.find_one({"student_id": student_id}):
        messagebox.showerror("Error", "Student ID already exists")
        return

    students.insert_one({
        "name": name,
        "student_id": student_id,
        "department": department,
        "session": session,
        "age": age
    })

    clear_form()
    load_students()
    messagebox.showinfo("Success", "Student Added")


def select_student(event):
    global selected_id

    selected = table.focus()
    data = table.item(selected)

    if not data["values"]:
        return

    selected_id = data["values"][0]

    name_entry.delete(0, "end")
    id_entry.delete(0, "end")
    dept_entry.delete(0, "end")
    session_entry.delete(0, "end")
    age_entry.delete(0, "end")

    name_entry.insert(0, data["values"][1])
    id_entry.insert(0, data["values"][2])
    dept_entry.insert(0, data["values"][3])
    session_entry.insert(0, data["values"][4])
    age_entry.insert(0, data["values"][5])


def update_student():
    if selected_id is None:
        messagebox.showwarning("Warning", "Select a student first")
        return

    students.update_one(
        {"_id": ObjectId(selected_id)},
        {"$set": {
            "name": name_entry.get().strip(),
            "student_id": id_entry.get().strip(),
            "department": dept_entry.get().strip(),
            "session": session_entry.get().strip(),
            "age": age_entry.get().strip()
        }}
    )

    clear_form()
    load_students()
    messagebox.showinfo("Updated", "Student Updated")


def delete_student():
    if selected_id is None:
        messagebox.showwarning("Warning", "Select a student first")
        return

    confirm = messagebox.askyesno("Confirm", "Delete this student?")
    if confirm:
        students.delete_one({"_id": ObjectId(selected_id)})
        clear_form()
        load_students()
        messagebox.showinfo("Deleted", "Student Deleted")


def search_student():
    load_students(search_entry.get().strip())


def refresh():
    search_entry.delete(0, "end")
    load_students()


# ---------- UI ----------

app = ctk.CTk()
app.title("Student Management System")
app.geometry("1100x650")
app.configure(fg_color="#eef2f7")

# Header
header = ctk.CTkFrame(app, height=80, fg_color="#1e293b", corner_radius=0)
header.pack(fill="x")

ctk.CTkLabel(
    header,
    text="Student Management System",
    font=("Segoe UI", 26, "bold"),
    text_color="white"
).pack(side="left", padx=30, pady=20)

# Body
body = ctk.CTkFrame(app, fg_color="#eef2f7")
body.pack(fill="both", expand=True, padx=20, pady=15)

# LEFT FORM
form = ctk.CTkFrame(body, width=300, fg_color="white", corner_radius=15)
form.pack(side="left", fill="y", padx=(0, 15))

ctk.CTkLabel(form, text="Student Info", font=("Segoe UI", 20, "bold")).pack(pady=15)

name_entry = ctk.CTkEntry(form, placeholder_text="Name")
name_entry.pack(padx=20, pady=6, fill="x")

id_entry = ctk.CTkEntry(form, placeholder_text="Student ID")
id_entry.pack(padx=20, pady=6, fill="x")

dept_entry = ctk.CTkEntry(form, placeholder_text="Department")
dept_entry.pack(padx=20, pady=6, fill="x")

session_entry = ctk.CTkEntry(form, placeholder_text="Session")
session_entry.pack(padx=20, pady=6, fill="x")

age_entry = ctk.CTkEntry(form, placeholder_text="Age")
age_entry.pack(padx=20, pady=6, fill="x")

ctk.CTkButton(form, text="Add", command=add_student).pack(padx=20, pady=8, fill="x")
ctk.CTkButton(form, text="Update", command=update_student, fg_color="#111827").pack(padx=20, pady=8, fill="x")
ctk.CTkButton(form, text="Delete", command=delete_student, fg_color="#dc2626").pack(padx=20, pady=8, fill="x")
ctk.CTkButton(form, text="Clear", command=clear_form, fg_color="#64748b").pack(padx=20, pady=8, fill="x")

# RIGHT SIDE
right = ctk.CTkFrame(body, fg_color="white", corner_radius=15)
right.pack(side="right", fill="both", expand=True)

top = ctk.CTkFrame(right, fg_color="white")
top.pack(fill="x", padx=15, pady=10)

search_entry = ctk.CTkEntry(top, width=200, placeholder_text="Search...")
search_entry.pack(side="right", padx=5)

ctk.CTkButton(top, text="Search", width=70, command=search_student).pack(side="right", padx=5)
ctk.CTkButton(top, text="Refresh", width=70, fg_color="#16a34a", command=refresh).pack(side="right", padx=5)

total_label = ctk.CTkLabel(right, text="Total Students: 0", font=("Segoe UI", 13, "bold"))
total_label.pack(anchor="w", padx=20)

# Table
style = ttk.Style()
style.theme_use("default")

style.configure("Treeview", rowheight=30, font=("Segoe UI", 10))
style.configure("Treeview.Heading", font=("Segoe UI", 10, "bold"))

table = ttk.Treeview(
    right,
    columns=("id", "name", "sid", "dept", "session", "age"),
    show="headings"
)

table.heading("id", text="MongoID")
table.heading("name", text="Name")
table.heading("sid", text="Student ID")
table.heading("dept", text="Dept")
table.heading("session", text="Session")
table.heading("age", text="Age")

table.pack(fill="both", expand=True, padx=15, pady=10)

table.bind("<ButtonRelease-1>", select_student)

load_students()

app.mainloop()