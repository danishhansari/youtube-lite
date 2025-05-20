import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

interface InputType {
  videoId: string;
  userId: string;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

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

  await context.run("update-video", async () => {
    const videoTitle = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: TITLE_SYSTEM_PROMPT,
    });
    await db
      .update(videos)
      .set({
        title: videoTitle.text || video.title,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
