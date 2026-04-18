import React, { useState } from 'react';
import { Character } from './CharacterCard';
import { PRESETS } from '../presets';
import styles from './GenerationForm.module.css';

interface GenerationFormProps {
  character: Character;
  onGenerate: (config: GenerationConfig) => Promise<void>;
  readyToGenerate: boolean;
}

export interface GenerationConfig {
  characterId: string;
  scenePrompt: string;
  colorPreset: string;
  durationSec: number;
  motionIntensity: number;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  character,
  onGenerate,
  readyToGenerate,
}) => {
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState('heat');
  const [duration, setDuration] = useState(20);
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const estimatedCost = 0.50 + (duration / 10) * 0.3 + (motionIntensity / 10) * 0.2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readyToGenerate || isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerate({
        characterId: character.id,
        scenePrompt: prompt,
        colorPreset: preset,
        durationSec: duration,
        motionIntensity,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="prompt" className={styles.label}>
          Scene Description
        </label>
        <textarea
          id="prompt"
          className={styles.textarea}
          placeholder="Describe the scene... (e.g., 'Pauli in Reservoir Dogs trunk opening')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          disabled={isGenerating}
          required
        />
        <div className={styles.charCount}>
          {prompt.length}/500
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Cinema Preset</label>
        <div className={styles.presetGrid}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className={`${styles.presetButton} ${preset === p.id ? styles.selected : ''}`}
              onClick={() => setPreset(p.id)}
              disabled={isGenerating}
              title={p.description}
            >
              <span className={styles.presetName}>{p.name}</span>
              <span className={styles.presetRef}>{p.filmReference.split(' - ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="duration" className={styles.label}>
          Duration: {duration}s
        </label>
        <input
          id="duration"
          type="range"
          min="15"
          max="30"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={styles.slider}
          disabled={isGenerating}
        />
        <div className={styles.sliderMarks}>
          <span>15s</span>
          <span>30s</span>
        </div>
      </div>

      {showAdvanced && (
        <div className={styles.advancedSection}>
          <div className={styles.formGroup}>
            <label htmlFor="motion" className={styles.label}>
              Motion Intensity: {motionIntensity}/10
            </label>
            <input
              id="motion"
              type="range"
              min="1"
              max="10"
              value={motionIntensity}
              onChange={(e) => setMotionIntensity(Number(e.target.value))}
              className={styles.slider}
              disabled={isGenerating}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.advancedToggle}
        onClick={() => setShowAdvanced(!showAdvanced)}
        disabled={isGenerating}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Settings
      </button>

      <div className={styles.costEstimate}>
        <span className={styles.costLabel}>Estimated Cost:</span>
        <span className={styles.costValue}>${estimatedCost.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        className={`${styles.generateButton} ${
          !readyToGenerate || isGenerating ? styles.disabled : ''
        }`}
        disabled={!readyToGenerate || isGenerating || !prompt.trim()}
      >
        {isGenerating ? (
          <>
            <span className={styles.spinner} /> Generating...
          </>
        ) : (
          'Generate Video'
        )}
      </button>
    </form>
  );
};
