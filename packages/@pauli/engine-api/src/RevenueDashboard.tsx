import React, { useState, useEffect } from 'react';

export interface RevenueMetrics {
  totalEarnings: number;
  monthlyEarnings: number;
  subscriptions: number;
  videosPurchased: number;
}

export interface RevenueDashboardProps {
  creatorId: string;
}

export const RevenueDashboard: React.FC<RevenueDashboardProps> = ({ creatorId }) => {
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    subscriptions: 0,
    videosPurchased: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/engine/revenue/${creatorId}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch revenue metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [creatorId]);

  if (isLoading) {
    return <div>Loading revenue data...</div>;
  }

  return (
    <div className="revenue-dashboard">
      <h2>Revenue Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric">
          <h3>Total Earnings</h3>
          <p>${metrics.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="metric">
          <h3>This Month</h3>
          <p>${metrics.monthlyEarnings.toFixed(2)}</p>
        </div>
        <div className="metric">
          <h3>Subscribers</h3>
          <p>{metrics.subscriptions}</p>
        </div>
        <div className="metric">
          <h3>Videos Purchased</h3>
          <p>{metrics.videosPurchased}</p>
        </div>
      </div>
    </div>
  );
};
