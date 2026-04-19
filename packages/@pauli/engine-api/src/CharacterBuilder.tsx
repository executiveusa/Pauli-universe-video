import React, { useState } from 'react';

export interface CharacterBuilderProps {
  projectId: string;
  onCharacterCreate?: (characterId: string) => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({
  projectId,
  onCharacterCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCharacter = async () => {
    if (!name.trim() || !description.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/engine/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setName('');
        setDescription('');
        onCharacterCreate?.(data.characterId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="character-builder">
      <h2>Create Character</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
        disabled={isLoading}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Character description"
        disabled={isLoading}
      />
      <button onClick={handleCreateCharacter} disabled={isLoading || !name.trim()}>
        {isLoading ? 'Creating...' : 'Create Character'}
      </button>
    </div>
  );
};
