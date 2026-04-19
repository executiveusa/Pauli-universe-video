import React, { useState } from 'react';

export interface CreatorDashboardProps {
  creatorId: string;
  onProjectCreate?: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  creatorId,
  onProjectCreate,
}) => {
  const [projectName, setProjectName] = useState('');

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    try {
      const response = await fetch('/api/engine/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          name: projectName,
        }),
      });

      if (response.ok) {
        setProjectName('');
        onProjectCreate?.();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="creator-dashboard">
      <h1>Creator Dashboard</h1>
      <div className="project-creator">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project name"
        />
        <button onClick={handleCreateProject} disabled={!projectName.trim()}>
          Create Project
        </button>
      </div>
      <div className="projects-list">
        <p>Your projects will appear here</p>
      </div>
    </div>
  );
};
