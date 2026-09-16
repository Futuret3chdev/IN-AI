import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getModel } from "@/lib/ai";
import {
  dueFlashcards,
  listTopics,
  reviewFlashcard,
  upsertTopic,
} from "@/lib/agent/store";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const [topics, cards] = await Promise.all([
    listTopics(user.id),
    dueFlashcards(user.id),
  ]);
  return NextResponse.json({ topics, due: cards });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "");

  if (action === "review") {
    const grade = body?.grade as "again" | "hard" | "good" | "easy";
    const id = String(body?.id ?? "");
    if (!id || !grade) {
      return NextResponse.json({ error: "id and grade required" }, { status: 400 });
    }
    const result = await reviewFlashcard(user.id, id, grade);
    return NextResponse.json(result ?? { error: "not found" }, { status: result ? 200 : 404 });
  }

  if (action === "topic") {
    const name = String(body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const topic = await upsertTopic({
      userId: user.id,
      name,
      description: body?.description,
      mastery: Number(body?.mastery ?? 0),
    });
    return NextResponse.json(topic);
  }

  if (action === "quiz") {
    const topic = String(body?.topic ?? "").trim();
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });
    try {
      const { object } = await generateObject({
        model: getModel(user),
        schema: z.object({
          questions: z.array(
            z.object({
              prompt: z.string(),
              choices: z.array(z.string()).length(4),
              answer: z.number().min(0).max(3),
              why: z.string(),
            }),
          ),
        }),
        prompt: `Write 4 multiple-choice questions to test a learner on: ${topic}. One clearly correct answer. Plausible distractors. Intermediate difficulty.`,
      });
      return NextResponse.json(object);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Quiz failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
