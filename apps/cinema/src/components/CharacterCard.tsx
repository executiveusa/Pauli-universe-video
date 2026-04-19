import React, { useState } from 'react';
import styles from './CharacterCard.module.css';

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  consistencyScore: number;
  lastSeen?: string;
}

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  showGlow?: boolean;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onSelect,
  showGlow = true,
  size = 'medium',
  selected = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <button
      className={`${styles.card} ${styles[size]} ${selected ? styles.selected : ''} ${
        showGlow ? styles.glow : ''
      }`}
      onClick={() => onSelect(character)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-pressed={selected}
      aria-label={`Select character: ${character.name}`}
    >
      <div className={styles.header}>
        <div className={styles.avatar}>
          {character.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.avatar} alt={character.name} />
          ) : (
            <span className={styles.placeholder}>👻</span>
          )}
        </div>
        {selected && <div className={styles.selectionIndicator} />}
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{character.name}</h3>

        <div className={styles.scoreBar}>
          <div className={styles.scoreLabel}>Soul Consistency</div>
          <div className={styles.scoreTrack}>
            <div
              className={styles.scoreFill}
              style={{
                width: `${character.consistencyScore * 100}%`,
              }}
            />
          </div>
          <div className={styles.scoreValue}>
            {(character.consistencyScore * 100).toFixed(0)}%
          </div>
        </div>

        {character.lastSeen && (
          <div className={styles.lastSeen}>
            {isHovering
              ? new Date(character.lastSeen).toLocaleString()
              : `Seen ${getRelativeTime(character.lastSeen)}`}
          </div>
        )}
      </div>

      {selected && <div className={styles.selectedBorder} />}
    </button>
  );
};

function getRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
