export const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  HARDER: 4,
  EXTREME: 5,
  INSANE: 6,
  LEGENDARY: 7,
  MYTHIC: 8,
  COSMIC: 9,
} as const;

export const COST_PER_VIDEO = {
  FLUX_GENERATION: 2.5,
  KLING_RENDERING: 0.8,
  COLOR_GRADING: 0.15,
  HIGGSFIELD_CONSISTENCY: 0.3,
  INFINITY_EXTENSION: 0.35,
  INFRASTRUCTURE: 0.2,
} as const;

export const GAME_CONFIG = {
  MAX_HINTS: 3,
  HINT_COST: 5,
  BASE_SCORE: 100,
  DIFFICULTY_MULTIPLIER: {
    1: 1,
    2: 1.5,
    3: 2.0,
    4: 2.5,
    5: 3.0,
    6: 3.5,
    7: 4.0,
    8: 4.5,
    9: 5.0,
  },
} as const;

export const API_ENDPOINTS = {
  CINEMA_GENERATE: '/api/cinema/generate',
  GAME_START: '/api/game/start',
  GAME_GUESS: '/api/game/guess',
  ENGINE_CREATE_PROJECT: '/api/engine/projects',
  ENGINE_SCHEDULE: '/api/engine/schedule',
  PODCAST_GENERATE: '/api/podcast/generate',
} as const;

export const LEADERBOARD_LIMIT = 100;
export const CACHE_TTL_SECONDS = 3600;
export const MAX_VIDEO_DURATION_MINUTES = 10;
export const MIN_UDEC_SCORE = 8.5;
