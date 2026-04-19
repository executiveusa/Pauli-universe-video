import React from 'react';

export interface PauliModelProps {
  visible: boolean;
  position?: { x: number; y: number };
  size?: number;
}

export const PauliModel: React.FC<PauliModelProps> = ({
  visible,
  position = { x: 50, y: 50 },
  size = 100,
}) => {
  if (!visible) return null;

  return (
    <div
      className="pauli-model"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#FF6B6B',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
      }}
    >
      <span>🧪</span>
    </div>
  );
};
