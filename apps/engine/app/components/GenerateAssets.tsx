'use client';

import React, { useState } from 'react';

interface GenerateAssetsProps {
  videos: any[];
}

export default function GenerateAssets({ videos }: GenerateAssetsProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'intro' | 'voice' | 'thumbnail'>('video');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [introPrompt, setIntroPrompt] = useState('');
  const [introDuration, setIntroDuration] = useState(5);
  const [voiceText, setVoiceText] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState('');

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/video-studio/assets/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt })
      });
      const data = await response.json();
      setJobId(data.job_id);
      setVideoPrompt('');
      alert(`Video generation queued! Job ID: ${data.job_id}`);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIntro = async () => {
    if (!introPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/video-studio/assets/generate/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: introPrompt, duration: introDuration })
      });
      const data = await response.json();
      setJobId(data.job_id);
      setIntroPrompt('');
      alert(`Intro generation queued! Job ID: ${data.job_id}`);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoice = async () => {
    if (!selectedVideo || !voiceText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/video-studio/assets/generate/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: selectedVideo, text: voiceText })
      });
      const data = await response.json();
      setJobId(data.job_id);
      setVoiceText('');
      alert(`Voice generation queued! Job ID: ${data.job_id}`);
    } catch (error) {
      console.error('Voice generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!selectedVideo) return;

    setLoading(true);
    try {
      const response = await fetch('/api/video-studio/assets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo,
          asset_type: 'thumbnail',
          params: {}
        })
      });
      const data = await response.json();
      setJobId(data.job_id);
      alert(`Thumbnail generation queued! Job ID: ${data.job_id}`);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-600">
        {(['video', 'intro', 'voice', 'thumbnail'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'video' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generate Video with SeedDance</h3>
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full h-24 bg-slate-700 rounded-lg p-3 text-white placeholder-gray-500"
          />
          <button
            onClick={handleGenerateVideo}
            disabled={loading || !videoPrompt.trim()}
            className="px-6 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      )}

      {activeTab === 'intro' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generate Intro with cdance</h3>
          <textarea
            value={introPrompt}
            onChange={(e) => setIntroPrompt(e.target.value)}
            placeholder="Describe the intro you want..."
            className="w-full h-24 bg-slate-700 rounded-lg p-3 text-white placeholder-gray-500"
          />
          <div>
            <label className="block text-sm mb-2">Duration (seconds)</label>
            <input
              type="number"
              value={introDuration}
              onChange={(e) => setIntroDuration(Number(e.target.value))}
              min="1"
              max="30"
              className="w-full bg-slate-700 rounded-lg p-2 text-white"
            />
          </div>
          <button
            onClick={handleGenerateIntro}
            disabled={loading || !introPrompt.trim()}
            className="px-6 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Intro'}
          </button>
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Add Voice & Avatar (Mercury 2)</h3>
          <div>
            <label className="block text-sm mb-2">Select Video</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full bg-slate-700 rounded-lg p-2 text-white"
            >
              <option value="">Choose a video...</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.filename}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="Voice text for the video..."
            className="w-full h-24 bg-slate-700 rounded-lg p-3 text-white placeholder-gray-500"
          />
          <button
            onClick={handleAddVoice}
            disabled={loading || !selectedVideo || !voiceText.trim()}
            className="px-6 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Voice & Avatar'}
          </button>
        </div>
      )}

      {activeTab === 'thumbnail' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Generate Thumbnail</h3>
          <div>
            <label className="block text-sm mb-2">Select Video</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full bg-slate-700 rounded-lg p-2 text-white"
            >
              <option value="">Choose a video...</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.filename}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateThumbnail}
            disabled={loading || !selectedVideo}
            className="px-6 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Thumbnail'}
          </button>
        </div>
      )}

      {jobId && (
        <div className="bg-green-900 border border-green-600 rounded-lg p-4">
          <p className="text-green-300">Job queued successfully!</p>
          <p className="text-sm text-gray-300">Job ID: {jobId}</p>
        </div>
      )}
    </div>
  );
}
