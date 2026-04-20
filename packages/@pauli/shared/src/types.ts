export interface Character {
  id: string;
  name: string;
  description: string;
  embedding: number[];
  createdAt: Date;
}

export interface Video {
  id: string;
  characterId: string;
  url: string;
  duration: number;
  quality: number;
  cost: number;
  createdAt: Date;
}

export interface GenerateRequest {
  characterId: string;
  prompt: string;
  duration: number;
}

export interface GameState {
  id: string;
  userId: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  score: number;
  hintsUsed: number;
  completed: boolean;
  createdAt: Date;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  generatedAt: Date;
  publishedAt: Date | null;
}

export interface CreatorProject {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  characters: string[];
  episodeSchedule: string;
  revenueShare: number;
  createdAt: Date;
}

export interface UDECScore {
  mot: number;
  acc: number;
  typ: number;
  clr: number;
  spd: number;
  rsp: number;
  cod: number;
  arc: number;
  dep: number;
  doc: number;
  err: number;
  prf: number;
  sec: number;
  ux: number;
  average: number;
}

export interface CostTracker {
  videoId: string;
  fluxCost: number;
  klingCost: number;
  modalComputeCost: number;
  totalCost: number;
  timestamp: Date;
}

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };
