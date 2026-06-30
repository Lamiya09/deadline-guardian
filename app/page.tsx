"use client";

import { useState,useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Task = {
  id: number;
  title: string;
  priority: string;
  deadline: string;
  completed: boolean;
};

export default function Home() {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("");
  const [deadline, setDeadline] = useState("");
  const [aiPlan, setAiPlan] = useState("");
  const [todayFocus, setTodayFocus] = useState("");

  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  


  useEffect(() => {
  const savedTasks = localStorage.getItem("tasks");

  if (savedTasks) {
    setTasks(JSON.parse(savedTasks));
  }
}, []);
const completedTasks = tasks.filter(
  (task) => task.completed
).length;

const progress =
  tasks.length === 0
    ? 0
    : (completedTasks / tasks.length) * 100;
    const filteredTasks = tasks.filter((task) => {
  const matchesSearch = task.title
    .toLowerCase()
    .includes(search.toLowerCase());

  if (!matchesSearch) {
    return false;
  }

  if (filter === "Completed") {
    return task.completed;
  }

  if (filter === "Pending") {
    return !task.completed;
  }

  return true;
});
useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);
  const deleteTask = (id: number) => {
  setTasks(tasks.filter((task) => task.id !== id));
};

const toggleComplete = (id: number) => {
  setTasks(
    tasks.map((task) =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    )
  );
};
const suggestPriority = async () => {
  if (!title.trim()) return;

  try {
    const prompt = `
Suggest the priority (High, Medium or Low) for this task:

"${title}"

Reply with ONLY one word:
High
Medium
Low
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiPriority = response.text().trim();

    console.log("Gemini Response:", aiPriority);

    if (
      aiPriority === "High" ||
      aiPriority === "Medium" ||
      aiPriority === "Low"
    ) {
      setPriority(aiPriority);
    } else {
      alert("Gemini replied: " + aiPriority);
    }
  } catch (error) {
    console.error(error);
    alert("Gemini Error. Check the browser console.");
  }
};
const generateAIPlan = async () => {
  if (tasks.length === 0) {
    setAiPlan("Please add some tasks first.");
    return;
  }

  try {
    setLoadingAI(true);
   const prompt = `
You are Deadline Guardian, an AI productivity assistant.

Analyze all the tasks below.

${tasks
  .map(
    (task) =>
      `Task: ${task.title}
Priority: ${task.priority}
Deadline: ${task.deadline}
Completed: ${task.completed ? "Yes" : "No"}`
  )
  .join("\n\n")}

Generate your response in EXACTLY this format:

📅 AI Daily Plan

1.
2.
3.

Explain briefly why this order is best.

----------------------

⚠️ Deadline Risks

List only tasks that appear urgent, overdue, due soon, or high priority but incomplete.

For every risky task include:

• Task Name
• Risk Level (High / Medium / Low)
• Reason

----------------------

💡 Productivity Tip

Give ONE useful productivity tip based on these tasks.

Keep the response concise, friendly and easy to read.
`;

   const result = await model.generateContent(prompt);
   const response = await result.response;
   const text = response.text();
    setAiPlan(text);
    const firstLine = text
  .split("\n")
  .find((line) => line.trim().startsWith("1."));

if (firstLine) {
  setTodayFocus(firstLine.replace("1.", "").trim());
}
    setLoadingAI(false);
  } catch (error) {
    console.error(error);
    setLoadingAI(false);
    setAiPlan("❌ Failed to generate AI plan.");
  }
};
  const addTask = () => {
    if (!title.trim() || !priority || !deadline) {
  setError("⚠️ Please fill in all required fields before adding your task.");
  return;
}

    const newTask: Task = {
      id: Date.now(),
      title,
      priority,
      deadline,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setError("");

    setTitle("");
    setDeadline("");
    setPriority("Medium");
  };

  return (
    <div
  style={{
    maxWidth: "700px",
    margin: "40px auto",
    backgroundColor: "#f8fafc",
    padding: "30px",
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
  }}
>
  
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
  <h1
    style={{
      fontSize: "42px",
      marginBottom: "10px",
    }}
  >
    🛡️ 𝙳𝙴𝙰𝙳𝙻𝙸𝙽𝙴 𝙶𝚄𝙰𝚁𝙳𝙸𝙰𝙽 

  </h1>

  <p
    style={{
      color: "gray",
      fontSize: "18px",
    }}
  >
    Stay ahead of your deadlines
  </p>
</div>

      <br />

      <input
        type="text"
        placeholder="Enter Task"
        value={title}
        onChange={(e) => {
  setTitle(e.target.value);
}}
        style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "16px",
  marginBottom: "15px",
  boxSizing: "border-box",
}}
      />
      <button
  onClick={suggestPriority}
  style={{
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
    marginBottom: "15px",
  }}
>
  ✨ AI Suggest Priority
</button>

      <br />
      <br />

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
       style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "16px",
  marginBottom: "15px",
  boxSizing: "border-box",
}}
      >
        <option value=""
        disabled>
        Priority
        </option>

        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <br />
      <br />

      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
       style={{
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  fontSize: "16px",
  marginBottom: "20px",
  boxSizing: "border-box",
}}
      />

      <br />
      <br />

      <button
        onClick={addTask}
        
      >
        ➕ Add Task
      </button>
      <button
  onClick={generateAIPlan}
  style={{
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    marginTop: "12px",
  }}
>
  🧠 AI Plan My Day
</button>
      {error && (
  <p
    style={{
      color: "#dc2626",
      backgroundColor: "#fee2e2",
      border: "1px solid #fca5a5",
      padding: "10px",
      borderRadius: "8px",
      marginTop: "12px",
      textAlign: "center",
      fontWeight: "bold",
    }}
  >
    {error}
  </p>
)}

      <hr style={{
  width: "180px",
  padding: "14px",
  backgroundColor: "#4b46e5b0",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "25px",
  display: "block",
  margin: "20px auto",
  outline: "none",
  boxShadow: "none"
}} />

      <h2>Progress</h2>

<div
  style={{
    width: "100%",
    maxWidth: "500px",
    height: "25px",
    border: "1px solid gray",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "10px",
  }}
>
  <div
    style={{
      width: `${progress}%`,
      height: "100%",
      backgroundColor: "green",
    }}
  />
</div>

<p>
  Completed: {completedTasks} / {tasks.length}
</p>

<p>
  {Math.round(progress)}% Finished
</p>

<hr style={{ margin: "30px 0" }} />
<div style={{ marginBottom: "15px" }}>
  <button
  onClick={() => setFilter("All")}
  style={{
    padding: "8px 16px",
    marginRight: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    backgroundColor: filter === "All" ? "#2563eb" : "white",
    color: filter === "All" ? "white" : "#374151",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
    All
  </button>

  <button
  onClick={() => setFilter("Pending")}
  style={{
    padding: "8px 16px",
    marginRight: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    backgroundColor: filter === "Pending" ? "#2563eb" : "white",
    color: filter === "Pending" ? "white" : "#374151",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
    Pending
  </button>

  <button
  onClick={() => setFilter("Completed")}
  style={{
    padding: "8px 16px",
    marginRight: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    backgroundColor: filter === "Completed" ? "#2563eb" : "white",
    color: filter === "Completed" ? "white" : "#374151",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
    Completed
  </button>
</div>
<p>
  Total Tasks: {tasks.length}
</p>

<p>
  Pending: {tasks.length - completedTasks}
</p>

<p>
  Completed: {completedTasks}
</p>
<input
  type="text"
  placeholder="Search tasks..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    padding: "8px",
    marginBottom: "15px",
    width: "250px",
  }}
/>
<h2
  style={{
    fontSize: "28px",
    marginTop: "30px",
    marginBottom: "20px",
    color: "#1f2937",
  }}
>
  📋 Your Tasks
</h2>
{filteredTasks.map((task) => (
        <div
  key={task.id}
  style={{
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "16px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
}}
>
         <h3
  style={{
    textDecoration: task.completed
      ? "line-through"
      : "none",
    opacity: task.completed ? 0.6 : 1,
  }}
>
  {task.completed ? "✅ " : ""}
  {task.title}
</h3>

<p>
  Priority:
  <span
    style={{
  marginLeft: "8px",
  fontWeight: "bold",
  color:
    task.priority === "High"
      ? "red"
      : task.priority === "Medium"
      ? "orange"
      : "green",

  backgroundColor:
    task.priority === "High"
      ? "#fee2e2"
      : task.priority === "Medium"
      ? "#fef3c7"
      : "#dcfce7",

  padding: "4px 10px",
  borderRadius: "20px",
  display: "inline-block",
  fontSize: "12px",
letterSpacing: "0.5px",
textTransform: "uppercase",

border:
  task.priority === "High"
    ? "1px solid #ef4444"
    : task.priority === "Medium"
    ? "1px solid #f59e0b"
    : "1px solid #22c55e",
}}
  >
    {task.priority}
  </span>
</p>
{(() => {
  const today = new Date();
  const deadlineDate = new Date(task.deadline);

  const diffTime =
    deadlineDate.getTime() - today.getTime();

  const diffDays = Math.ceil(
    diffTime / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 1) {
    return <p>🔥 Due Tomorrow</p>;
  }

  if (diffDays > 1 && diffDays <= 3) {
    return <p>⚠️ Due Soon</p>;
  }

  return null;
})()}
<p>Deadline: {task.deadline}</p>

<button
  onClick={() => toggleComplete(task.id)}
  style={{
  marginRight: "10px",
  padding: "6px 12px",
  backgroundColor: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
}}
>
  {task.completed ? "Undo" : "Complete"}
</button>

<button
  onClick={() => deleteTask(task.id)}
  style={{
  padding: "6px 12px",
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
}}
>
  Delete
</button>
        </div>
      ))}
      {aiPlan && (
  <div
    style={{
      marginTop: "25px",
      padding: "24px",
      background: "linear-gradient(135deg, #f3e8ff, #ffffff)",
      border: "2px solid #7c3aed",
      borderRadius: "16px",
      whiteSpace: "pre-wrap",
      lineHeight: "1.8",
      boxShadow: "0 8px 20px rgba(124,58,237,0.15)",
    }}
  >
    <h2
      style={{
        color: "#7c3aed",
        marginBottom: "16px",
        textAlign: "center",
      }}
    >
      🧠 AI Daily Planner
    </h2>

    <div
      style={{
        fontSize: "16px",
        color: "#333",
      }}
    >
      {aiPlan}
    </div>
  </div>
)}
    </div>
  );
  <footer
  style={{
    marginTop: "40px",
    textAlign: "center",
    color: "#777",
    fontSize: "14px",
    padding: "20px",
  }}
>
  🚀 Deadline Guardian • Built with Next.js + Gemini AI
</footer>
}