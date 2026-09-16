import fs from "node:fs";
import path from "node:path";
import { experimental_generateVideo, generateImage } from "ai";
import type { User } from "./auth";
import { getImageModel, getVideoModel, xaiKey } from "./ai";
import { ensureDb, execute, query } from "./db";
import { extForMime, mediaDir } from "./paths";
import { now } from "./text";

export type MediaRow = {
  id: string;
  user_id: string;
  kind: string;
  prompt: string;
  mime: string;
  data: string | null;
  path: string | null;
  created_at: number;
};

export async function saveMedia(input: {
  userId: string;
  kind: "image" | "video" | "audio";
  prompt: string;
  mime: string;
  base64: string;
}) {
  await ensureDb();
  const id = crypto.randomUUID();
  const ext = extForMime(input.mime);
  const filePath = path.join(mediaDir(), `${id}.${ext}`);
  fs.writeFileSync(filePath, Buffer.from(input.base64, "base64"));
  await execute(
    "INSERT INTO media (id, user_id, kind, prompt, mime, data, path, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)",
    [id, input.userId, input.kind, input.prompt, input.mime, filePath, now()],
  );
  return {
    id,
    kind: input.kind,
    prompt: input.prompt,
    mime: input.mime,
    url: `/api/media/${id}`,
    path: filePath,
  };
}

export async function getMedia(id: string, userId?: string) {
  await ensureDb();
  const rows = await query<MediaRow>(
    userId
      ? "SELECT * FROM media WHERE id = ? AND user_id = ?"
      : "SELECT * FROM media WHERE id = ?",
    userId ? [id, userId] : [id],
  );
  return rows[0] ?? null;
}

export function readMediaBytes(row: MediaRow) {
  if (row.path && fs.existsSync(row.path)) {
    return fs.readFileSync(row.path);
  }
  if (row.data) return Buffer.from(row.data, "base64");
  return null;
}

export async function listMedia(userId: string, kind?: string) {
  await ensureDb();
  if (kind) {
    return query<Omit<MediaRow, "data">>(
      "SELECT id, user_id, kind, prompt, mime, created_at FROM media WHERE user_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 80",
      [userId, kind],
    );
  }
  return query<Omit<MediaRow, "data">>(
    "SELECT id, user_id, kind, prompt, mime, created_at FROM media WHERE user_id = ? ORDER BY created_at DESC LIMIT 80",
    [userId],
  );
}

export async function generateUserImage(
  user: User,
  prompt: string,
  aspectRatio = "1:1",
) {
  const ratio = aspectRatio as `${number}:${number}`;
  const { image } = await generateImage({
    model: getImageModel(user),
    prompt,
    aspectRatio: ratio,
    providerOptions: { xai: { aspect_ratio: aspectRatio } },
  });
  return saveMedia({
    userId: user.id,
    kind: "image",
    prompt,
    mime: image.mediaType || "image/png",
    base64: image.base64,
  });
}

export async function editUserImage(
  user: User,
  prompt: string,
  imageBase64: string,
) {
  const raw = imageBase64.replace(/^data:[^;]+;base64,/, "");
  const { image } = await generateImage({
    model: getImageModel(user),
    prompt: {
      text: prompt,
      images: [raw],
    },
  });
  return saveMedia({
    userId: user.id,
    kind: "image",
    prompt,
    mime: image.mediaType || "image/png",
    base64: image.base64,
  });
}

export async function generateUserVideo(
  user: User,
  prompt: string,
  imageBase64: string,
  duration = 6,
) {
  const raw = imageBase64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(raw, "base64");
  const { video } = await experimental_generateVideo({
    model: getVideoModel(user),
    prompt: { image: bytes, text: prompt },
    duration,
  });
  return saveMedia({
    userId: user.id,
    kind: "video",
    prompt,
    mime: video.mediaType || "video/mp4",
    base64: video.base64,
  });
}

export async function generateSpeech(
  user: User,
  text: string,
  voiceId = "eve",
  language = "en",
) {
  const apiKey = xaiKey(user);
  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      language,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.slice(0, 400) || `TTS failed (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return saveMedia({
    userId: user.id,
    kind: "audio",
    prompt: text,
    mime: res.headers.get("content-type") || "audio/mpeg",
    base64: buf.toString("base64"),
  });
}
