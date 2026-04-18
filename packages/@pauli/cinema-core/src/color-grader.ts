import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

export interface GradingResult {
  success: boolean;
  videoBytes?: Buffer;
  fileSizeBytes?: number;
  error?: string;
}

/**
 * Color grading pipeline using FFmpeg LUTs.
 * Applies cinematic color grading presets to videos.
 */
export class ColorGrader {
  private ffmpegPath = "ffmpeg";
  private lutPath = path.join(__dirname, "../luts");

  /**
   * Apply color grading preset to video.
   */
  async gradeVideo(
    videoBuffer: Buffer,
    presetName: string
  ): Promise<GradingResult> {
    if (!videoBuffer || videoBuffer.length < 1000) {
      return {
        success: false,
        error: "Invalid video buffer",
      };
    }

    // Validate preset exists
    const lutFile = path.join(this.lutPath, `${presetName}.cube`);
    if (!fs.existsSync(lutFile)) {
      return {
        success: false,
        error: `Preset not found: ${presetName}`,
      };
    }

    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `grade_in_${Date.now()}.mp4`);
    const outputFile = path.join(tmpDir, `grade_out_${Date.now()}.mp4`);

    try {
      fs.writeFileSync(inputFile, videoBuffer);

      // Apply LUT via FFmpeg
      const ffmpegCmd = `${this.ffmpegPath} -i "${inputFile}" -vf "lut3d='${lutFile}'" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${outputFile}"`;

      try {
        execSync(ffmpegCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
      } catch (error) {
        return {
          success: false,
          error: `FFmpeg failed: ${String(error)}`,
        };
      }

      if (!fs.existsSync(outputFile)) {
        return {
          success: false,
          error: "Output file not created",
        };
      }

      const gradedBuffer = fs.readFileSync(outputFile);

      return {
        success: true,
        videoBytes: gradedBuffer,
        fileSizeBytes: gradedBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Grading failed: ${String(error)}`,
      };
    } finally {
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }
    }
  }

  /**
   * Batch grade multiple videos with same preset.
   */
  async batchGrade(
    videos: Buffer[],
    presetName: string
  ): Promise<GradingResult[]> {
    const results: GradingResult[] = [];

    for (const video of videos) {
      const result = await this.gradeVideo(video, presetName);
      results.push(result);
    }

    return results;
  }

  /**
   * Get available presets.
   */
  getAvailablePresets(): string[] {
    if (!fs.existsSync(this.lutPath)) {
      return [];
    }

    return fs
      .readdirSync(this.lutPath)
      .filter((file) => file.endsWith(".cube"))
      .map((file) => file.replace(".cube", ""));
  }

  /**
   * Custom color adjustments (without LUT).
   */
  async adjustColor(
    videoBuffer: Buffer,
    adjustments: {
      saturation?: number;
      brightness?: number;
      contrast?: number;
    }
  ): Promise<GradingResult> {
    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `adj_in_${Date.now()}.mp4`);
    const outputFile = path.join(tmpDir, `adj_out_${Date.now()}.mp4`);

    try {
      fs.writeFileSync(inputFile, videoBuffer);

      let filters = [];

      if (adjustments.saturation) {
        filters.push(`saturate=${adjustments.saturation}`);
      }

      if (adjustments.brightness) {
        filters.push(`eq=brightness=${adjustments.brightness / 100}`);
      }

      if (adjustments.contrast) {
        filters.push(`eq=contrast=${adjustments.contrast / 100}`);
      }

      const filterStr = filters.join(",");
      const ffmpegCmd = `${this.ffmpegPath} -i "${inputFile}" -vf "${filterStr}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${outputFile}"`;

      execSync(ffmpegCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });

      if (!fs.existsSync(outputFile)) {
        return {
          success: false,
          error: "Adjustment failed",
        };
      }

      const adjustedBuffer = fs.readFileSync(outputFile);

      return {
        success: true,
        videoBytes: adjustedBuffer,
        fileSizeBytes: adjustedBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    } finally {
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }
    }
  }
}

export { ColorGrader as default };
