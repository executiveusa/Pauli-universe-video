'use client';

import React, { useState } from 'react';

interface Video {
  id: string;
  filename: string;
  url: string;
  source: string;
  duration?: number;
  month?: string;
  quality?: string;
}

interface VideoLibraryProps {
  videos: Video[];
  onSync: () => void;
}

export default function VideoLibrary({ videos, onSync }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [filterMonth, setFilterMonth] = useState('');

  const filtered = filterMonth
    ? videos.filter((v) => v.month?.includes(filterMonth))
    : videos;

  const byMonth = videos.reduce((acc, v) => {
    const month = v.month || 'Unknown';
    if (!acc[month]) acc[month] = 0;
    acc[month]++;
    return acc;
  }, {} as Record<string, number>);

  const handleAnalyze = async (videoId: string) => {
    try {
      const response = await fetch(`/api/video-studio/analyze/${videoId}`, {
        method: 'POST'
      });
      const data = await response.json();
      alert(`Analysis queued: ${data.job_id}`);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(byMonth).map(([month, count]) => (
          <div
            key={month}
            className="bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-600 transition"
            onClick={() => setFilterMonth(month)}
          >
            <p className="text-lg font-semibold">{month}</p>
            <p className="text-gray-400">{count} videos</p>
          </div>
        ))}
      </div>

      {filterMonth && (
        <button
          onClick={() => setFilterMonth('')}
          className="px-4 py-2 bg-slate-600 rounded-lg text-sm"
        >
          Clear Filter
        </button>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((video) => (
          <div
            key={video.id}
            className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{video.filename}</p>
                <p className="text-gray-400 text-sm">
                  {video.source} • {video.month} • {video.duration}s
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze(video.id);
                }}
                className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
              >
                Analyze
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedVideo.filename}</h2>
            <video src={selectedVideo.url} controls className="w-full rounded-lg mb-4" />
            <div className="space-y-2 text-gray-300">
              <p>Source: {selectedVideo.source}</p>
              <p>Duration: {selectedVideo.duration}s</p>
              <p>Quality: {selectedVideo.quality}</p>
              <p>Month: {selectedVideo.month}</p>
            </div>
            <button
              onClick={() => setSelectedVideo(null)}
              className="mt-4 px-4 py-2 bg-slate-600 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
