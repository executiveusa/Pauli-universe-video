import { z } from 'zod';

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  embedding: z.array(z.number()),
});

export const VideoSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid(),
  url: z.string().url(),
  duration: z.number().positive(),
  quality: z.number().min(0).max(100),
  cost: z.number().positive(),
  createdAt: z.date(),
});

export const GameStateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  difficulty: z.number().min(1).max(9) as z.ZodType<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>,
  score: z.number().nonnegative(),
  hintsUsed: z.number().nonnegative(),
  completed: z.boolean(),
  createdAt: z.date(),
});

export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
});

export const GenerateVideoSchema = z.object({
  characterId: z.string().uuid(),
  prompt: z.string().min(10),
  duration: z.number().min(5).max(600),
});

export const StartGameSchema = z.object({
  userId: z.string(),
  difficulty: z.number().min(1).max(9),
});
