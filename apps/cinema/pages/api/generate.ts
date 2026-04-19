import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  FluxOrchestrator,
  SeedanceClient,
  KlingClient,
  FrameProcessor,
  UDECScorer,
  CostTracker,
} from "@pauli/cinema-core";

// Request validation schema (accepts Studio client format)
const GenerateRequestSchema = z.object({
  characterId: z.string(),
  scenePrompt: z.string().min(10).max(500),
  colorPreset: z.string().default("heat"),
  durationSec: z.number().min(5).max(30).default(20),
  motionIntensity: z.number().min(1).max(10).default(5).optional(),
});

type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

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
    // Validate request
    const body = GenerateRequestSchema.parse(req.body);
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize services (only those required for this flow)
    const fluxOrchestrator = new FluxOrchestrator();
    const seedanceClient = new SeedanceClient();
    const klingClient = new KlingClient();
    const frameProcessor = new FrameProcessor();
    const scorer = new UDECScorer();
    const costTracker = new CostTracker();

    // Step 1: Get character from vector search (mock)
    const characterName = `character_${body.characterId.substring(0, 8)}`;

    // Step 2: Generate keyframe using FLUX.2
    const keyframeResult = await fluxOrchestrator.generateKeyframe(
      body.scenePrompt,
      { seed: body.characterId.charCodeAt(0) }
    );

    if (!keyframeResult.success || !keyframeResult.imageBase64) {
      return res.status(500).json({
        success: false,
        jobId,
        status: "failed",
        error: "Keyframe generation failed",
      });
    }

    // Step 3: Generate video using Seedance (primary) or fallback to Kling
    let videoBase64: string | undefined;
    let videoCost = 0;
    let usedProvider = "seedance-2.0";

    const seedanceResult = await seedanceClient.generateVideo(
      keyframeResult.imageBase64,
      body.scenePrompt,
      {
        motionIntensity: 6,
        durationSec: body.durationSec,
      }
    );

    if (seedanceResult.success && seedanceResult.videoBase64) {
      videoBase64 = seedanceResult.videoBase64;
      videoCost = seedanceResult.cost;
    } else {
      // Fallback to Kling
      const klingResult = await klingClient.generateVideo(
        keyframeResult.imageBase64,
        body.scenePrompt,
        { durationSec: body.durationSec }
      );

      if (!klingResult.success || !klingResult.videoBase64) {
        return res.status(500).json({
          success: false,
          jobId,
          status: "failed",
          error: "Video generation failed (both providers)",
        });
      }

      videoBase64 = klingResult.videoBase64;
      videoCost = klingResult.cost;
      usedProvider = "kling-3.0";
    }

    // Step 4: Process video (frame interpolation, normalization)
    const videoBuffer = Buffer.from(videoBase64, "base64");
    const processedResult = await frameProcessor.interpolateFrames(videoBuffer, {
      targetFps: 24,
      addMotionBlur: false,
    });

    if (!processedResult.success || !processedResult.videoBytes) {
      return res.status(500).json({
        success: false,
        jobId,
        status: "failed",
        error: "Video processing failed",
      });
    }

    // Step 5: Score video quality
    const metadata = {
      videoSize: processedResult.videoBytes.length,
      duration: processedResult.duration || body.durationSec,
      fps: processedResult.fps,
      resolution: "1920x1080",
      codec: "h264",
      generationTimeMs: Date.now() - parseInt(jobId.split("-")[1]),
    };

    const udecScore = await scorer.scoreVideo(processedResult.videoBytes, metadata);

    // Step 6: Track cost
    const totalCost = videoCost + 0.1; // Video + processing

    await costTracker.logCost(jobId, {
      fluxKeyframe: keyframeResult.cost,
      seedanceVideo: usedProvider === "seedance-2.0" ? videoCost : 0,
      klingVideo: usedProvider === "kling-3.0" ? videoCost : 0,
      higgsfield: 0,
      colorGrading: 0.1,
      storage: 0,
      total: totalCost,
    });

    // Step 7: Simulate upload to storage (would be Cloudflare R2)
    const videoUrl = `https://cdn.pauli-universe.com/videos/${jobId}.mp4`;

    return res.status(200).json({
      success: udecScore.overall >= 8.5,
      jobId,
      videoUrl,
      status: "completed",
      udecScore: udecScore.overall,
      cost: totalCost,
      metadata: {
        provider: usedProvider,
        keyframeSize: keyframeResult.imageSize,
        videoSize: processedResult.videoBytes.length,
        fps: processedResult.fps,
        duration: metadata.duration,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        jobId: "",
        status: "failed",
        error: `Validation error: ${error.errors[0].message}`,
      });
    }

    return res.status(500).json({
      success: false,
      jobId: "",
      status: "failed",
      error: String(error),
    });
  }
}
