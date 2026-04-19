import React, { useEffect, useState } from 'react';
import { CharacterCard } from '../src/components/CharacterCard';
import { VideoPreview, type VideoMetadata } from '../src/components/VideoPreview';
import { GenerationForm, type GenerationConfig } from '../src/components/GenerationForm';
import { PresetGrid } from '../src/components/PresetGrid';
import { CharacterBadge, type BadgeStatus } from '../src/components/CharacterBadge';
import { MetadataPanel } from '../src/components/MetadataPanel';
import { StudioLayout, StudioHeader, StudioSidebar, StudioFooter } from '../src/components/StudioLayout';
import { useCharacter } from '../src/hooks/useCharacter';
import { useGeneration } from '../src/hooks/useGeneration';
import { useHiggsfield } from '../src/hooks/useHiggsfield';
import '../src/styles/globals.css';

interface VideoResult extends VideoMetadata {
  jobId: string;
}

export default function StudioPage() {
  const { characters, selectedCharacter, loadCharacters, selectCharacter } = useCharacter();
  const { currentJob, startGeneration, isGenerating } = useGeneration();
  const { generateSoulId } = useHiggsfield();

  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>('idle');
  const [_badgeMessage, _setBadgeMessage] = useState('');

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (currentJob) {
      switch (currentJob.status) {
        case 'pending':
        case 'embedding':
          setBadgeStatus('thinking');
          _setBadgeMessage('Analyzing scene...');
          break;
        case 'keyframe':
          setBadgeStatus('thinking');
          _setBadgeMessage('Generating keyframe...');
          break;
        case 'video':
          setBadgeStatus('waiting');
          _setBadgeMessage('Rendering video...');
          break;
        case 'processing':
          setBadgeStatus('waiting');
          _setBadgeMessage('Quality check...');
          break;
        case 'complete':
          setBadgeStatus('complete');
          _setBadgeMessage('Video ready!');
          if (currentJob.videoUrl && currentJob.udecScore && currentJob.cost) {
            setVideoResult({
              jobId: currentJob.id,
              videoUrl: currentJob.videoUrl,
              duration: 20,
              fps: 24,
              fileSize: 5242880,
              provider: 'Seedance 2.0',
              cost: currentJob.cost,
              udecScore: currentJob.udecScore,
              createdAt: new Date().toISOString(),
            });
          }
          break;
        case 'failed':
          setBadgeStatus('error');
          _setBadgeMessage(currentJob.error || 'Generation failed');
          break;
      }
    }
  }, [currentJob]);

  const handleGenerate = async (config: GenerationConfig) => {
    if (!selectedCharacter) return;

    try {
      // Generate Soul ID for character consistency
      await generateSoulId(selectedCharacter.id, [selectedCharacter.avatar || '']);

      // Start generation workflow
      await startGeneration(config);
    } catch (error) {
      setBadgeStatus('error');
      _setBadgeMessage(error instanceof Error ? error.message : 'Generation error');
    }
  };

  return (
    <StudioLayout
      header={
        <StudioHeader>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#999' }}>
            <span>🎬 Phase 1 Complete • {characters.length} characters loaded</span>
          </div>
        </StudioHeader>
      }
      sidebar={
        <StudioSidebar>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
                Characters
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {characters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    onSelect={selectCharacter}
                    selected={selectedCharacter?.id === character.id}
                    size="small"
                  />
                ))}
              </div>
            </div>

            {selectedCharacter && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
                  Presets
                </h3>
                <PresetGrid compact />
              </div>
            )}
          </div>
        </StudioSidebar>
      }
      main={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {selectedCharacter ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                    {selectedCharacter.name}
                  </h2>
                  <p style={{ margin: '0', color: '#999', fontSize: '14px' }}>
                    Selected character for video generation
                  </p>
                </div>

                {videoResult ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <VideoPreview
                      videoUrl={videoResult.videoUrl}
                      metadata={{
                        duration: videoResult.duration,
                        udecScore: videoResult.udecScore,
                        cost: videoResult.cost,
                        fps: videoResult.fps,
                        videoSize: videoResult.fileSize,
                        provider: videoResult.provider,
                      }}
                    />
                    <MetadataPanel
                      metadata={videoResult}
                      activeTab="quality"
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      aspect: '16 / 9',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px dashed #404040',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    {isGenerating
                      ? `Generating... ${currentJob?.progress || 0}%`
                      : 'Video will appear here'}
                  </div>
                )}
              </div>

              <GenerationForm
                character={selectedCharacter}
                onGenerate={handleGenerate}
                readyToGenerate={!isGenerating}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <p style={{ fontSize: '16px' }}>Select a character to get started</p>
            </div>
          )}
        </div>
      }
      footer={
        <StudioFooter>
          <div>Cinema Studio™ v1.0 • Phase 1 Complete</div>
          <div>
            {currentJob && (
              <span>
                Job: {currentJob.id} • Status: {currentJob.status} • Cost: ${currentJob.cost.toFixed(2)}
              </span>
            )}
          </div>
        </StudioFooter>
      }
    />
  );
}
