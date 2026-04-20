import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { GenerateRequest } from "@pauli/shared";

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
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        jobId: "",
        status: "failed",
        error: "Unauthorized: missing or invalid Bearer token",
      });
    }

    const requestBody = req.body as Record<string, unknown>;
    const normalizedPayload = {
      characterId: requestBody.characterId,
      prompt:
        typeof requestBody.prompt === "string" ? requestBody.prompt : requestBody.scenePrompt,
      duration:
        typeof requestBody.duration === "number" ? requestBody.duration : requestBody.durationSec,
    };

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(String(normalizedPayload.characterId))) {
      return res.status(400).json({
        success: false,
        jobId: "",
        status: "failed",
        error: "Validation error: characterId must be a valid UUID",
      });
    }

    if (
      typeof normalizedPayload.prompt !== "string" ||
      normalizedPayload.prompt.trim().length < 10
    ) {
      return res.status(400).json({
        success: false,
        jobId: "",
        status: "failed",
        error: "Validation error: prompt must be at least 10 characters",
      });
    }

    if (
      typeof normalizedPayload.duration !== "number" ||
      !Number.isFinite(normalizedPayload.duration) ||
      normalizedPayload.duration < 5 ||
      normalizedPayload.duration > 600
    ) {
      return res.status(400).json({
        success: false,
        jobId: "",
        status: "failed",
        error: "Validation error: duration must be between 5 and 600 seconds",
      });
    }

    const body: GenerateRequest = {
      characterId: normalizedPayload.characterId as string,
      prompt: normalizedPayload.prompt,
      duration: normalizedPayload.duration,
    };
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
        prompt: body.prompt,
        duration: body.duration,
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
