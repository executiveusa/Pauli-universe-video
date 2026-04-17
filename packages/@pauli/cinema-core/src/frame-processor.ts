import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
import { z } from "zod";

export interface InterpolationOptions {
  targetFps?: number;
  addMotionBlur?: boolean;
  preserveMetadata?: boolean;
}

export interface ProcessResult {
  success: boolean;
  videoBytes?: Buffer;
  fps: number;
  frameCount?: number;
  duration?: number;
  fileSizeBytes?: number;
  error?: string;
}

/**
 * Frame processor for video post-processing.
 * Handles interpolation, FPS normalization, and motion enhancement.
 */
export class FrameProcessor {
  private ffmpegPath = "ffmpeg";
  private ffprobePath = "ffprobe";

  /**
   * Interpolate frames to create smoother motion.
   */
  async interpolateFrames(
    videoBuffer: Buffer,
    options: InterpolationOptions = {}
  ): Promise<ProcessResult> {
    const targetFps = options.targetFps || 24;
    const addMotionBlur = options.addMotionBlur ?? false;
    const preserveMetadata = options.preserveMetadata ?? true;

    // Validate input
    if (!videoBuffer || videoBuffer.length < 1000) {
      return {
        success: false,
        fps: 0,
        error: "Invalid video buffer",
      };
    }

    if (targetFps < 1 || targetFps > 60) {
      return {
        success: false,
        fps: 0,
        error: "Target FPS must be between 1 and 60",
      };
    }

    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `input_${Date.now()}.mp4`);
    const outputFile = path.join(tmpDir, `output_${Date.now()}.mp4`);

    try {
      // Write input video to temp file
      fs.writeFileSync(inputFile, videoBuffer);

      // Get original video properties
      const origProps = this.getVideoProperties(inputFile);

      // Build FFmpeg command
      let ffmpegCmd = `${this.ffmpegPath} -i "${inputFile}"`;

      // Add interpolation filter
      let filters = `fps=${targetFps}`;

      // Optionally add motion blur
      if (addMotionBlur) {
        filters += ",minterpolate=mi_mode=mci:mc_mode=aobmc:vsbmc=1";
      }

      ffmpegCmd += ` -vf "${filters}"`;

      // Video codec settings (H.264 for compatibility)
      ffmpegCmd += ` -c:v libx264 -preset fast -crf 23`;

      // Audio settings (copy if exists)
      ffmpegCmd += ` -c:a aac -b:a 128k`;

      // Output file
      ffmpegCmd += ` -y "${outputFile}"`;

      // Execute FFmpeg
      try {
        execSync(ffmpegCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
      } catch (error) {
        return {
          success: false,
          fps: 0,
          error: `FFmpeg failed: ${String(error)}`,
        };
      }

      // Check output file exists
      if (!fs.existsSync(outputFile)) {
        return {
          success: false,
          fps: 0,
          error: "Output file not created",
        };
      }

      // Read processed video
      const outputBuffer = fs.readFileSync(outputFile);

      // Get output properties
      const outProps = this.getVideoProperties(outputFile);

      return {
        success: true,
        videoBytes: outputBuffer,
        fps: targetFps,
        frameCount: outProps.frameCount,
        duration: outProps.duration,
        fileSizeBytes: outputBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        fps: 0,
        error: `Processing failed: ${String(error)}`,
      };
    } finally {
      // Cleanup temp files
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch (cleanupError) {
        console.warn("Cleanup failed:", cleanupError);
      }
    }
  }

  /**
   * Normalize video to specific resolution and frame rate.
   */
  async normalizeVideo(
    videoBuffer: Buffer,
    width: number = 1920,
    height: number = 1080,
    fps: number = 24
  ): Promise<ProcessResult> {
    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `norm_in_${Date.now()}.mp4`);
    const outputFile = path.join(tmpDir, `norm_out_${Date.now()}.mp4`);

    try {
      fs.writeFileSync(inputFile, videoBuffer);

      let ffmpegCmd = `${this.ffmpegPath} -i "${inputFile}"`;

      // Scale and FPS normalization
      ffmpegCmd += ` -vf "scale=${width}:${height},fps=${fps}"`;
      ffmpegCmd += ` -c:v libx264 -preset fast -crf 23`;
      ffmpegCmd += ` -c:a aac -b:a 128k`;
      ffmpegCmd += ` -y "${outputFile}"`;

      execSync(ffmpegCmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });

      if (!fs.existsSync(outputFile)) {
        return {
          success: false,
          fps: 0,
          error: "Normalization failed",
        };
      }

      const outputBuffer = fs.readFileSync(outputFile);
      const props = this.getVideoProperties(outputFile);

      return {
        success: true,
        videoBytes: outputBuffer,
        fps,
        frameCount: props.frameCount,
        duration: props.duration,
        fileSizeBytes: outputBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        fps: 0,
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

  /**
   * Get video properties using ffprobe.
   */
  private getVideoProperties(
    filePath: string
  ): { fps: number; frameCount: number; duration: number } {
    try {
      const cmd = `${this.ffprobePath} -v error -select_streams v:0 -show_entries stream=r_frame_rate,nb_read_frames,duration -of default=noprint_wrappers=1:nokey=1:csv=p=0 "${filePath}"`;

      const output = execSync(cmd, { encoding: "utf-8" });
      const lines = output.trim().split("\n");

      // Parse FPS (r_frame_rate)
      let fps = 24;
      if (lines[0]) {
        const fpsMatch = lines[0].match(/(\d+)\/(\d+)/);
        if (fpsMatch) {
          fps = parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]);
        }
      }

      // Parse frame count
      let frameCount = 0;
      if (lines[1]) {
        frameCount = parseInt(lines[1]) || 0;
      }

      // Parse duration
      let duration = 0;
      if (lines[2]) {
        duration = parseFloat(lines[2]) || 0;
      }

      return { fps, frameCount, duration };
    } catch (error) {
      console.warn("Failed to get video properties:", error);
      return { fps: 24, frameCount: 0, duration: 0 };
    }
  }

  /**
   * Validate video quality.
   */
  async validateVideo(videoBuffer: Buffer): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const tmpDir = os.tmpdir();
    const inputFile = path.join(tmpDir, `val_${Date.now()}.mp4`);

    try {
      fs.writeFileSync(inputFile, videoBuffer);

      const issues: string[] = [];

      // Check file size
      if (videoBuffer.length < 100000) {
        issues.push("File too small (< 100KB)");
      }

      if (videoBuffer.length > 1000000000) {
        issues.push("File too large (> 1GB)");
      }

      // Try to get properties (will fail if corrupted)
      try {
        const props = this.getVideoProperties(inputFile);
        if (props.fps === 0 || props.duration === 0) {
          issues.push("Invalid video properties");
        }
      } catch (e) {
        issues.push("Failed to read video properties");
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        valid: false,
        issues: [`Validation error: ${String(error)}`],
      };
    } finally {
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      } catch (e) {
        console.warn("Cleanup failed:", e);
      }
    }
  }
}

export { FrameProcessor as default };
