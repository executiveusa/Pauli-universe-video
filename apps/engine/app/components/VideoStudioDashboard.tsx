'use client';

import React, { useState, useEffect } from 'react';
import VideoLibrary from './VideoLibrary';
import GenerateAssets from './GenerateAssets';
import ChatInterface from './ChatInterface';

export default function VideoStudioDashboard() {
  const [activeTab, setActiveTab] = useState<'library' | 'generate' | 'chat'>('library');
  const [videos, setVideos] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/video-studio/videos');
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/video-studio/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleSync = async () => {
    try {
      await fetch('/api/video-studio/sync', { method: 'POST' });
      setTimeout(fetchVideos, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Video Studio Agent</h1>
        <p className="text-gray-400 mb-8">AI-powered video management and creative asset generation</p>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Video Library
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Generate Assets
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={handleSync}
            className="ml-auto px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 font-semibold transition"
          >
            Sync Cloud Storage
          </button>
        </div>

        {activeTab === 'library' && <VideoLibrary videos={videos} onSync={fetchVideos} />}
        {activeTab === 'generate' && <GenerateAssets videos={videos} />}
        {activeTab === 'chat' && <ChatInterface />}

        {jobs.length > 0 && (
          <div className="mt-8 bg-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Active Jobs</h3>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                  <span>{job.type}</span>
                  <span className={`px-3 py-1 rounded text-sm ${
                    job.status === 'completed' ? 'bg-green-600' :
                    job.status === 'failed' ? 'bg-red-600' :
                    'bg-yellow-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
