import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";

interface GenerateRequest {
  characterId: string;
  scenePrompt: string;
  mood: "noir" | "crime" | "suspenseful" | "cinematic" | "neon";
  durationSec?: number;
  colorPreset?: string;
}

interface GenerateResponse {
  success: boolean;
  jobId: string;
  videoUrl?: string;
  status: "completed" | "processing" | "failed";
  udecScore?: number;
  cost?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * POST /api/generate
 * Generate a cinematic video from character + scene prompt.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      jobId: "",
      status: "failed",
      error: "Method not allowed",
    });
  }

  try {
    const body = req.body as Partial<GenerateRequest>;
    if (
      !body.characterId ||
      !body.scenePrompt ||
      typeof body.scenePrompt !== "string" ||
      body.scenePrompt.length < 10
    ) {
      return res.status(400).json({
        success: false,
        jobId: "",
        status: "failed",
        error: "Validation error: invalid request body",
      });
    }

    const durationSec = typeof body.durationSec === "number" ? body.durationSec : 20;
    const colorPreset = body.colorPreset || "Reservoir Dogs";
    const mood = body.mood || "cinematic";
    const jobId = `job-${randomUUID()}`;

    return res.status(200).json({
      success: true,
      jobId,
      videoUrl: `https://cdn.pauli-universe.com/videos/${jobId}.mp4`,
      status: "processing",
      udecScore: 0,
      cost: 0,
      metadata: {
        characterId: body.characterId,
        scenePrompt: body.scenePrompt,
        mood,
        durationSec,
        colorPreset,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      jobId: "",
      status: "failed",
      error: String(error),
    });
  }
}
