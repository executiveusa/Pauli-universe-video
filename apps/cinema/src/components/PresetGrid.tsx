import React from 'react';
import { PRESETS, type Preset } from '../presets';
import styles from './PresetGrid.module.css';

interface PresetGridProps {
  selected?: string;
  onSelect?: (presetId: string) => void;
  compact?: boolean;
}

export const PresetGrid: React.FC<PresetGridProps> = ({
  selected,
  onSelect,
  compact = false,
}) => {
  const presets = Object.values(PRESETS);

  return (
    <div className={`${styles.grid} ${compact ? styles.compact : ''}`}>
      {presets.map((preset) => (
        <div
          key={preset.id}
          className={`${styles.presetCard} ${selected === preset.id ? styles.selected : ''}`}
          onClick={() => onSelect?.(preset.id)}
          role="button"
          tabIndex={0}
          aria-pressed={selected === preset.id}
          aria-label={`${preset.name}: ${preset.description}`}
        >
          <div className={styles.presetPreview}>
            <div
              className={styles.colorSwatch}
              style={{
                background: `linear-gradient(135deg,
                  hsla(${getHueFromPreset(preset)}, 80%, 50%, 1) 0%,
                  hsla(${getHueFromPreset(preset) + 30}, 70%, 40%, 1) 100%)`,
              }}
            />
            <div className={styles.presetInfo}>
              <h3 className={styles.presetTitle}>{preset.name}</h3>
              <p className={styles.presetDesc}>{preset.description}</p>
            </div>
          </div>
          {selected === preset.id && <div className={styles.selectedMark}>✓</div>}
        </div>
      ))}
    </div>
  );
};

function getHueFromPreset(preset: Preset): number {
  const hues: Record<string, number> = {
    reservoir_dogs: 0,
    casino: 30,
    taxi_driver: 210,
    heat: 45,
    bronx_tale: 25,
    sopranos: 260,
    blade_runner: 200,
    kill_bill: 0,
    drive: 320,
    neon_genesis: 270,
    cyberpunk: 90,
    dreamscape: 50,
  };
  return hues[preset.id] || 0;
}
