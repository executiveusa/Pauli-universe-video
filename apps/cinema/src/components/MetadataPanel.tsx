import React, { useState } from 'react';
import styles from './MetadataPanel.module.css';

export interface UDECScores {
  motion: number;
  accessibility: number;
  typography: number;
  color: number;
  speed: number;
  responsiveness: number;
  code: number;
  architecture: number;
  dependencies: number;
  documentation: number;
  errorHandling: number;
  performance: number;
  security: number;
  ux: number;
}

interface VideoMetadata {
  jobId: string;
  duration: number;
  fps: number;
  fileSize: number;
  provider: string;
  cost: number;
  udecScore: number;
  udecDetails?: UDECScores;
  createdAt: string;
}

interface MetadataPanelProps {
  metadata: VideoMetadata;
  activeTab?: 'quality' | 'technical' | 'cost' | 'history';
}

const UDEC_AXES = [
  { key: 'motion', label: 'Motion' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'typography', label: 'Typography' },
  { key: 'color', label: 'Color' },
  { key: 'speed', label: 'Speed' },
  { key: 'responsiveness', label: 'Responsiveness' },
  { key: 'code', label: 'Code Quality' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'errorHandling', label: 'Error Handling' },
  { key: 'performance', label: 'Performance' },
  { key: 'security', label: 'Security' },
  { key: 'ux', label: 'User Experience' },
];

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  metadata,
  activeTab: initialTab = 'quality',
}) => {
  const [activeTab, setActiveTab] = useState<'quality' | 'technical' | 'cost' | 'history'>(
    initialTab
  );

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        {(['quality', 'technical', 'cost', 'history'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'quality' && (
          <div className={styles.qualityTab}>
            <div className={styles.scoreCircle}>
              <svg viewBox="0 0 100 100" className={styles.radialgraph}>
                <circle cx="50" cy="50" r="45" className={styles.bg} />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={styles.fill}
                  style={{
                    strokeDashoffset: 283 - (metadata.udecScore / 10) * 283,
                  }}
                />
              </svg>
              <div className={styles.scoreText}>
                <div className={styles.scoreNumber}>{metadata.udecScore.toFixed(1)}</div>
                <div className={styles.scoreLabel}>UDEC</div>
              </div>
            </div>

            {metadata.udecDetails && (
              <div className={styles.axesGrid}>
                {UDEC_AXES.map(({ key, label }) => {
                  const value = metadata.udecDetails![key as keyof UDECScores];
                  return (
                    <div key={key} className={styles.axisItem}>
                      <div className={styles.axisHeader}>
                        <span className={styles.axisLabel}>{label}</span>
                        <span className={styles.axisValue}>{value.toFixed(1)}</span>
                      </div>
                      <div className={styles.axisBar}>
                        <div
                          className={styles.axisFill}
                          style={{
                            width: `${(value / 10) * 100}%`,
                            background:
                              value >= 8.5
                                ? 'var(--pauli-cyan)'
                                : value >= 7
                                  ? 'var(--pauli-gold)'
                                  : 'var(--pauli-red)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'technical' && (
          <div className={styles.technicalTab}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Job ID</span>
              <span className={styles.metaValue}>{metadata.jobId}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Provider</span>
              <span className={styles.metaValue}>{metadata.provider}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Duration</span>
              <span className={styles.metaValue}>{metadata.duration}s</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Frame Rate</span>
              <span className={styles.metaValue}>{metadata.fps} FPS</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>File Size</span>
              <span className={styles.metaValue}>{formatBytes(metadata.fileSize)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Generated</span>
              <span className={styles.metaValue}>
                {new Date(metadata.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className={styles.costTab}>
            <div className={styles.costSummary}>
              <div className={styles.costLarge}>
                <span className={styles.costValue}>${metadata.cost.toFixed(2)}</span>
                <span className={styles.costLabel}>Total Cost</span>
              </div>
            </div>
            <div className={styles.costBreakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Per Second</span>
                <span className={styles.breakdownValue}>
                  ${(metadata.cost / metadata.duration).toFixed(3)}
                </span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Minute Rate</span>
                <span className={styles.breakdownValue}>
                  ${((metadata.cost / metadata.duration) * 60).toFixed(2)}/min
                </span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Hour Rate</span>
                <span className={styles.breakdownValue}>
                  ${((metadata.cost / metadata.duration) * 3600).toFixed(2)}/hr
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.historyTab}>
            <div className={styles.historyItem}>
              <div className={styles.historyTime}>Now</div>
              <div className={styles.historyEvent}>Video generation completed</div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyTime}>-2m</div>
              <div className={styles.historyEvent}>Quality check passed (UDEC {metadata.udecScore})</div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyTime}>-5m</div>
              <div className={styles.historyEvent}>Video rendering completed</div>
            </div>
            <div className={styles.historyItem}>
              <div className={styles.historyTime}>-6m</div>
              <div className={styles.historyEvent}>Keyframe generation completed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
