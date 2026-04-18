import React from 'react';
import styles from './CharacterBadge.module.css';

export type BadgeStatus = 'idle' | 'thinking' | 'waiting' | 'complete' | 'error';

interface CharacterBadgeProps {
  status: BadgeStatus;
  message?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const CharacterBadge: React.FC<CharacterBadgeProps> = ({
  status,
  message,
  position = 'bottom-right',
}) => {
  const statusConfig = {
    idle: {
      icon: '👻',
      label: 'Ready',
      color: 'idle',
    },
    thinking: {
      icon: '🧠',
      label: 'Thinking...',
      color: 'thinking',
    },
    waiting: {
      icon: '⏳',
      label: 'Generating...',
      color: 'waiting',
    },
    complete: {
      icon: '✨',
      label: 'Complete',
      color: 'complete',
    },
    error: {
      icon: '⚠️',
      label: 'Error',
      color: 'error',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${styles.badge} ${styles[position]} ${styles[config.color]}`}>
      <div className={styles.icon}>{config.icon}</div>
      <div className={styles.content}>
        <div className={styles.label}>{config.label}</div>
        {message && <div className={styles.message}>{message}</div>}
      </div>
      <div className={styles.statusIndicator} />
    </div>
  );
};
