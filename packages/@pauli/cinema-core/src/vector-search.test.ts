import { describe, it, expect, beforeEach, vi } from "vitest";
import { VectorSearch } from "./vector-search";

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe("VectorSearch", () => {
  let vectorSearch: VectorSearch;
  const mockEmbedding = Array(768)
    .fill(0)
    .map((_, i) => (i === 0 ? 1.0 : 0));

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_KEY = "test-key";
    vectorSearch = new VectorSearch();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws if SUPABASE_URL is missing", () => {
      delete process.env.SUPABASE_URL;
      expect(() => new VectorSearch()).toThrow("SUPABASE_URL");
    });

    it("throws if SUPABASE_KEY is missing", () => {
      delete process.env.SUPABASE_KEY;
      expect(() => new VectorSearch()).toThrow("SUPABASE_KEY");
    });

    it("initializes with provided credentials", () => {
      expect(() =>
        new VectorSearch("https://custom.supabase.co", "custom-key")
      ).not.toThrow();
    });
  });

  describe("storeCharacter", () => {
    it("stores character with embedding", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await vectorSearch.storeCharacter(
        uuid,
        "Albert Einstein",
        mockEmbedding,
        { description: "Physicist" }
      );

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: uuid,
            name: "Albert Einstein",
          }),
        ])
      );
    });

    it("throws on wrong embedding dimensions", async () => {
      const wrongDim = Array(512).fill(0);
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await expect(
        vectorSearch.storeCharacter(uuid, "Test", wrongDim)
      ).rejects.toThrow("768 dimensions");
    });

    it("throws on store error", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: { message: "Database error" },
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await expect(
        vectorSearch.storeCharacter(uuid, "Test", mockEmbedding)
      ).rejects.toThrow("Failed to store");
    });
  });

  describe("search", () => {
    it("searches for similar characters", async () => {
      const mockResults = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Einstein",
          similarity: 0.95,
          metadata: null,
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Bohr",
          similarity: 0.87,
          metadata: null,
        },
      ];

      const mockSearch = vi.fn().mockReturnValue({
        data: mockResults,
        error: null,
      });

      mockSupabaseClient.rpc.mockReturnValue({
        returns: vi.fn().mockReturnValue({
          data: mockResults,
          error: null,
        }),
      });

      const results = await vectorSearch.search(mockEmbedding, {
        limit: 10,
        minSimilarity: 0.5,
      });

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBe(0.95);
    });

    it("throws on wrong query embedding dimensions", async () => {
      const wrongDim = Array(512).fill(0);
      await expect(
        vectorSearch.search(wrongDim)
      ).rejects.toThrow("768 dimensions");
    });

    it("handles empty search results", async () => {
      mockSupabaseClient.rpc.mockReturnValue({
        returns: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      });

      const results = await vectorSearch.search(mockEmbedding);
      expect(results).toEqual([]);
    });
  });

  describe("getCharacter", () => {
    it("retrieves character by ID", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const mockChar = {
        id: uuid,
        name: "Einstein",
        embedding: mockEmbedding,
        created_at: new Date().toISOString(),
        metadata: {},
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockChar,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await vectorSearch.getCharacter(uuid);
      expect(result?.name).toBe("Einstein");
    });

    it("returns null when character not found", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: null,
            error: { code: "PGRST116" },
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await vectorSearch.getCharacter("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updateCharacter", () => {
    it("updates character embedding", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await vectorSearch.updateCharacter(uuid, mockEmbedding, {
        updated: true,
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it("throws on wrong embedding dimensions", async () => {
      const wrongDim = Array(512).fill(0);
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await expect(
        vectorSearch.updateCharacter(uuid, wrongDim)
      ).rejects.toThrow("768 dimensions");
    });
  });

  describe("deleteCharacter", () => {
    it("deletes character by ID", async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await vectorSearch.deleteCharacter(uuid);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("batchStoreCharacters", () => {
    it("stores multiple characters in one call", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const uuid1 = "550e8400-e29b-41d4-a716-446655440000";
      const uuid2 = "550e8400-e29b-41d4-a716-446655440001";
      await vectorSearch.batchStoreCharacters([
        {
          id: uuid1,
          name: "Einstein",
          embedding: mockEmbedding,
        },
        {
          id: uuid2,
          name: "Bohr",
          embedding: mockEmbedding,
        },
      ]);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: uuid1 }),
          expect.objectContaining({ id: uuid2 }),
        ])
      );
    });

    it("validates all embeddings before insert", async () => {
      const wrongDim = Array(512).fill(0);
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      await expect(
        vectorSearch.batchStoreCharacters([
          {
            id: uuid,
            name: "Test",
            embedding: wrongDim,
          },
        ])
      ).rejects.toThrow("768 dimensions");
    });
  });

  describe("getStats", () => {
    it("returns vector store statistics", async () => {
      const now = new Date().toISOString();
      const mockSelect = vi.fn().mockReturnValue({
        data: [
          { created_at: now },
          { created_at: now },
        ],
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const stats = await vectorSearch.getStats();
      expect(stats.totalCharacters).toBe(2);
      expect(stats.oldestCharacter).toBeDefined();
    });
  });
});
