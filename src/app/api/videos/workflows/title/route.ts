import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";

interface InputType {
  videoId: string;
  userId: string;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a Youtube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

const openai = new OpenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;

  const { videoId, userId } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo) {
      throw new Error("Not found");
    }

    return existingVideo;
  });

  const transcript = await context.run("get-transcript", async () => {
    const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response = await fetch(trackUrl);
    const text = response.text();

    if (!text) {
      throw new Error("Bad request");
    }

    return text;
  });

  const response = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      { role: "system", content: TITLE_SYSTEM_PROMPT },
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  const videoTitle = response.choices[0].message.content;

  if (!videoTitle) {
    throw new Error("Bad request");
  }

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        title: videoTitle || video.title,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));

    return videoTitle;
  });
});
