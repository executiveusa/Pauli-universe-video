export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  timeOfDay?: string;
  timezone?: string;
}

export interface ScheduledEpisode {
  episodeId: string;
  projectId: string;
  scheduledDate: Date;
  frequency: string;
  nextRun: Date;
}

export function parseScheduleExpression(expression: string): ScheduleConfig {
  if (expression === 'daily') {
    return { frequency: 'daily' };
  }

  if (expression.startsWith('weekly:')) {
    const dayOfWeek = parseInt(expression.split(':')[1]);
    return { frequency: 'weekly', dayOfWeek };
  }

  if (expression === 'monthly') {
    return { frequency: 'monthly' };
  }

  return { frequency: 'daily' };
}

export function calculateNextRunTime(config: ScheduleConfig): Date {
  const now = new Date();

  switch (config.frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'biweekly':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export function validateScheduleConfig(config: ScheduleConfig): boolean {
  if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(config.frequency)) {
    return false;
  }

  if (config.dayOfWeek && (config.dayOfWeek < 0 || config.dayOfWeek > 6)) {
    return false;
  }

  return true;
}
