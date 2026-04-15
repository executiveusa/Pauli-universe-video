import React, { useState } from 'react';

export interface SceneEditorProps {
  projectId: string;
  characterId: string;
  onSceneSave?: (sceneId: string) => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  projectId,
  characterId,
  onSceneSave,
}) => {
  const [sceneTitle, setSceneTitle] = useState('');
  const [scenePrompt, setScenePrompt] = useState('');
  const [duration, setDuration] = useState('30');

  const handleSaveScene = async () => {
    if (!sceneTitle.trim() || !scenePrompt.trim()) return;

    try {
      const response = await fetch('/api/engine/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          characterId,
          title: sceneTitle,
          prompt: scenePrompt,
          duration: parseInt(duration),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSceneTitle('');
        setScenePrompt('');
        setDuration('30');
        onSceneSave?.(data.sceneId);
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
    }
  };

  return (
    <div className="scene-editor">
      <h3>Scene Editor</h3>
      <input
        type="text"
        value={sceneTitle}
        onChange={(e) => setSceneTitle(e.target.value)}
        placeholder="Scene title"
      />
      <textarea
        value={scenePrompt}
        onChange={(e) => setScenePrompt(e.target.value)}
        placeholder="Scene prompt for video generation"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        min="5"
        max="300"
        placeholder="Duration (seconds)"
      />
      <button onClick={handleSaveScene} disabled={!sceneTitle.trim()}>
        Save Scene
      </button>
    </div>
  );
};
