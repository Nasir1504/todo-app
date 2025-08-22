import { promises as fs } from "fs";
import path from "path";

let todos = []; // in-memory storage

const uploadDir = path.join(process.cwd(), "public", "uploads");

async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {}
}

export async function GET() {
  return Response.json(todos);
}

export async function POST(req) {
  await ensureUploadDir();
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, file.name);

    await fs.writeFile(filePath, buffer);

    attachments.push({
      name: file.name,
      size: file.size,
      type: file.type,
      path: `/uploads/${file.name}`,
    });
  }

  const newTodo = { id: Date.now(), text, attachments };
  todos.push(newTodo);

  return Response.json(newTodo);
}

export async function DELETE(req) {
  const { id } = await req.json();
  todos = todos.filter((todo) => todo.id !== id);
  return Response.json({ success: true });
}
