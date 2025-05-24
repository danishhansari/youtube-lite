import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";
import { UTApi } from "uploadthing/server";

interface InputType {
  videoId: string;
  userId: string;
  prompt: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
const utapi = new UTApi();

export const { POST } = serve(async (context) => {
  const input = context.requestPayload as InputType;

  const { videoId, userId, prompt } = input;

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

  const getThumbnail = await context.run("get-thumbnail", async () => {
    let imagePath = "";
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    for (const part of response?.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData?.data;
        const imageName = crypto.randomUUID();
        imagePath = `${imageName}.webp`;
        if (imageData) {
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync(imagePath, buffer);
          const fileBuffer = fs.readFileSync(imagePath);
          const url = await utapi.uploadFiles(
            new File([fileBuffer], imagePath, { type: "image/webp" })
          );
          fs.unlinkSync(imagePath);
          const updatedVideo = await db
            .update(videos)
            .set({
              thumbnailUrl: url.data?.ufsUrl,
              thumbnailKey: url.data?.key,
            })
            .where(
              and(eq(videos.id, video.id), eq(videos.userId, video.userId))
            )
            .returning();
          return updatedVideo;
        }
      }
    }
  });
});
