import { SeedanceClient } from "./seedance-client";
import { KlingClient } from "./kling-client";

export interface Character {
  id: string;
  name: string;
  keyframeBase64: string;
}

export interface SceneConfig {
  characters: Character[];
  scenePrompt: string;
  durationSec: number;
  primaryProvider?: "seedance" | "kling";
}

/**
 * Scene orchestrator for multi-character video generation.
 * Coordinates character videos and composes them into scenes.
 */
export class SceneOrchestrator {
  private seedanceClient: SeedanceClient;
  private klingClient: KlingClient;

  constructor() {
    this.seedanceClient = new SeedanceClient();
    this.klingClient = new KlingClient();
  }

  /**
   * Generate multi-character scene.
   */
  async generateScene(config: SceneConfig): Promise<{
    success: boolean;
    videoBase64?: string;
    videoSize?: number;
    metadata?: Record<string, unknown>;
    error?: string;
  }> {
    if (config.characters.length === 0) {
      return {
        success: false,
        error: "At least one character required",
      };
    }

    const primaryProvider = config.primaryProvider || "seedance";

    try {
      // Generate video for each character (would be parallelized in production)
      const characterVideos = [];

      for (const character of config.characters) {
        let videoBase64: string | undefined;

        if (primaryProvider === "seedance") {
          const result = await this.seedanceClient.generateVideo(
            character.keyframeBase64,
            `${config.scenePrompt} - featuring ${character.name}`,
            { durationSec: config.durationSec }
          );

          if (result.success) {
            videoBase64 = result.videoBase64;
          } else {
            // Fallback to Kling
            const klingResult = await this.klingClient.generateVideo(
              character.keyframeBase64,
              config.scenePrompt,
              { durationSec: config.durationSec }
            );
            videoBase64 = klingResult.videoBase64;
          }
        } else {
          const result = await this.klingClient.generateVideo(
            character.keyframeBase64,
            config.scenePrompt,
            { durationSec: config.durationSec }
          );

          if (result.success) {
            videoBase64 = result.videoBase64;
          } else {
            const seedanceResult = await this.seedanceClient.generateVideo(
              character.keyframeBase64,
              config.scenePrompt,
              { durationSec: config.durationSec }
            );
            videoBase64 = seedanceResult.videoBase64;
          }
        }

        if (videoBase64) {
          characterVideos.push(videoBase64);
        }
      }

      if (characterVideos.length === 0) {
        return {
          success: false,
          error: "Failed to generate any character videos",
        };
      }

      // In production, compose videos together using FFmpeg
      // For now, return the first video as placeholder
      const composedVideo = characterVideos[0];

      return {
        success: true,
        videoBase64: composedVideo,
        videoSize: Buffer.from(composedVideo, "base64").length,
        metadata: {
          characters: config.characters.map((c) => c.name),
          durationSec: config.durationSec,
          characterCount: config.characters.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Generate scene with audio synchronization.
   */
  async generateSceneWithAudio(
    config: SceneConfig,
    audioBase64?: string
  ): Promise<{
    success: boolean;
    videoBase64?: string;
    error?: string;
  }> {
    const sceneResult = await this.generateScene(config);

    if (!sceneResult.success || !sceneResult.videoBase64) {
      return sceneResult;
    }

    // In production, sync audio to video using FFmpeg
    // For now, just return the scene
    if (audioBase64) {
      // Would mix audio here
    }

    return sceneResult;
  }
}

export { SceneOrchestrator as default };
