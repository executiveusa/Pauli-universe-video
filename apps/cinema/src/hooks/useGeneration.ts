import { useState, useCallback } from 'react';

export interface GenerationJob {
  id: string;
  status: 'pending' | 'embedding' | 'keyframe' | 'video' | 'processing' | 'complete' | 'failed';
  progress: number;
  videoUrl?: string;
  udecScore?: number;
  cost: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export function useGeneration() {
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [jobHistory, setJobHistory] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const startGeneration = useCallback(async (config: {
    characterId: string;
    scenePrompt: string;
    colorPreset: string;
    durationSec: number;
    motionIntensity: number;
  }) => {
    setIsGenerating(true);
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: GenerationJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      cost: 0,
    };

    setCurrentJob(job);

    try {
      // Simulate generation workflow
      const steps = [
        { status: 'embedding' as const, duration: 2000 },
        { status: 'keyframe' as const, duration: 3000 },
        { status: 'video' as const, duration: 5000 },
        { status: 'processing' as const, duration: 2000 },
      ];

      let currentProgress = 0;
      const progressPerStep = 100 / steps.length;

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, step.duration));
        currentProgress += progressPerStep;

        setCurrentJob((prev) =>
          prev
            ? {
                ...prev,
                status: step.status,
                progress: Math.min(currentProgress, 99),
              }
            : null
        );
      }

      // Call /api/generate
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      // Check both HTTP status AND semantic success field
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      const completedJob: GenerationJob = {
        id: jobId,
        status: 'complete',
        progress: 100,
        videoUrl: result.videoUrl,
        udecScore: result.udecScore,
        cost: result.cost,
        metadata: result.metadata,
      };

      setCurrentJob(completedJob);
      setJobHistory((prev) => [completedJob, ...prev]);
    } catch (error) {
      setCurrentJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          : null
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearCurrentJob = useCallback(() => {
    setCurrentJob(null);
  }, []);

  return {
    currentJob,
    jobHistory,
    isGenerating,
    startGeneration,
    clearCurrentJob,
  };
}
