import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In-memory storage for todos
let todos = [];

// GET all todos
export async function GET() {
  return new Response(JSON.stringify(todos), { status: 200 });
}

// Add new todo
export async function POST(req) {
  const formData = await req.formData();
  const text = formData.get("text");
  const files = formData.getAll("files");

  if (!text) {
    return new Response("Text is required", { status: 400 });
  }

  const attachments = [];

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return new Response("File too large (max 5MB)", { status: 400 });
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64, {
        resource_type: "auto",
        folder: "todos",
        public_id: `${Date.now()}_${file.name}`,
      });

      attachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.secure_url,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return new Response("File upload failed", { status: 500 });
    }
  }

  const newTodo = { id: Date.now(), text, attachments };
  todos.push(newTodo);

  return new Response(JSON.stringify(newTodo), { status: 201 });
}

// Delete a todo
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    todos = todos.filter((todo) => todo.id !== id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Delete error:", err);
    return new Response("Failed to delete todo", { status: 500 });
  }
}
