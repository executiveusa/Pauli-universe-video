import React, { useState } from 'react';
import styles from './VideoPreview.module.css';

export interface VideoMetadata {
  duration: number;
  udecScore: number;
  cost: number;
  fps?: number;
  videoSize?: number;
  provider?: string;
}

interface VideoPreviewProps {
  videoUrl: string;
  metadata: VideoMetadata;
  showAnalysis?: boolean;
  cinemaPreset?: string;
  onDownload?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  metadata,
  showAnalysis = true,
  cinemaPreset,
  onDownload,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.filmstrip}>
        <video
          className={styles.video}
          src={videoUrl}
          controls
          autoPlay
          loop
          muted
        />

        {/* Top-Left: Cinema Preset Label */}
        {cinemaPreset && (
          <div className={styles.presetLabel}>
            {cinemaPreset.replace(/_/g, ' ')}
          </div>
        )}

        {/* Top-Right: Quality Score */}
        <div className={styles.scoreOverlay}>
          <div className={styles.scoreValue}>{metadata.udecScore.toFixed(1)}</div>
          <div className={styles.scoreLabel}>UDEC</div>
          <div className={styles.scoreGauge}>
            <div
              className={styles.gaugeFill}
              style={{
                width: `${(metadata.udecScore / 10) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Bottom-Left: Cost */}
        <div className={styles.costOverlay}>
          <div className={styles.costValue}>${metadata.cost.toFixed(2)}</div>
          <div className={styles.costLabel}>Cost</div>
        </div>

        {/* Bottom-Center: Duration */}
        <div className={styles.durationOverlay}>
          {formatDuration(metadata.duration)}
        </div>

        {/* Analysis Panel (on hover) */}
        {showAnalysis && isHovering && (
          <div className={styles.analysisPanel}>
            <div className={styles.analysisList}>
              <div className={styles.analysisItem}>
                <span className={styles.analysisLabel}>Duration</span>
                <span className={styles.analysisValue}>
                  {formatDuration(metadata.duration)}
                </span>
              </div>
              <div className={styles.analysisItem}>
                <span className={styles.analysisLabel}>Quality</span>
                <span className={styles.analysisValue}>
                  {metadata.udecScore.toFixed(2)}/10
                </span>
              </div>
              <div className={styles.analysisItem}>
                <span className={styles.analysisLabel}>Provider</span>
                <span className={styles.analysisValue}>
                  {metadata.provider || 'Seedance 2.0'}
                </span>
              </div>
              {metadata.videoSize && (
                <div className={styles.analysisItem}>
                  <span className={styles.analysisLabel}>File Size</span>
                  <span className={styles.analysisValue}>
                    {formatSize(metadata.videoSize)}
                  </span>
                </div>
              )}
              {metadata.fps && (
                <div className={styles.analysisItem}>
                  <span className={styles.analysisLabel}>Frame Rate</span>
                  <span className={styles.analysisValue}>{metadata.fps} FPS</span>
                </div>
              )}
              <div className={styles.analysisItem}>
                <span className={styles.analysisLabel}>Cost</span>
                <span className={styles.analysisValue}>
                  ${metadata.cost.toFixed(2)}
                </span>
              </div>
            </div>
            {onDownload && (
              <button className={styles.downloadButton} onClick={onDownload}>
                ⬇ Download
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
