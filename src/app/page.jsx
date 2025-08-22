"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => res.json())
      .then(setTodos)
      .catch((err) => console.error("Failed to fetch todos:", err));
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("text", text);
    [...files].forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/todos", { method: "POST", body: formData });
      if (!res.ok) {
        alert("Error adding todo");
        setLoading(false);
        return;
      }
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setText("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.error("Add todo error:", err);
      alert("Failed to add todo");
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const res = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        alert("Failed to delete todo");
        return;
      }
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Delete todo error:", err);
      alert("Failed to delete todo");
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Todo App</h1>

      <form onSubmit={addTodo} className="flex flex-col gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter todo"
          className="border p-2 rounded"
        />
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => setFiles(e.target.files)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          disabled={loading || !text.trim()}
        >
          {loading ? "Adding..." : "Add Todo"}
        </button>
      </form>

      <ul className="space-y-4">
        {todos.map((todo) => (
          <li key={todo.id} className="border p-3 rounded">
            <div className="flex justify-between items-center">
              <span>{todo.text}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {(todo.attachments || []).map((file, idx) => (
                <div key={idx}>
                  {file.type.startsWith("image/") ? (
                    <img src={file.url} alt={file.name} className="w-32 rounded" />
                  ) : (
                    <p className="text-sm">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
