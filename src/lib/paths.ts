import fs from "node:fs";
import path from "node:path";

const E_HOME = "E:\\learning-agent";

export function projectRoot() {
  if (process.env.INAI_HOME && fs.existsSync(process.env.INAI_HOME)) {
    return process.env.INAI_HOME;
  }
  if (fs.existsSync(E_HOME)) return E_HOME;
  return process.cwd();
}

export function dataDir() {
  const dir = path.join(projectRoot(), "data");
  fs.mkdirSync(path.join(dir, "media"), { recursive: true });
  fs.mkdirSync(path.join(dir, "knowledge"), { recursive: true });
  fs.mkdirSync(path.join(dir, "notes"), { recursive: true });
  return dir;
}

export function mediaDir() {
  dataDir();
  return path.join(dataDir(), "media");
}

export function knowledgeDir() {
  dataDir();
  return path.join(dataDir(), "knowledge");
}

export function notesDir() {
  dataDir();
  return path.join(dataDir(), "notes");
}

export function dbFile() {
  return path.join(dataDir(), "in-ai.db").replace(/\\/g, "/");
}

export function extForMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("markdown") || mime.includes("md")) return "md";
  if (mime.includes("json")) return "json";
  if (mime.includes("csv")) return "csv";
  if (mime.includes("html")) return "html";
  return "bin";
}

export function safeName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 80) || "file";
}
