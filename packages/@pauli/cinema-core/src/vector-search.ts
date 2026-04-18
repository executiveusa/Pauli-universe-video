import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const CharacterVectorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.coerce.date(),
});

export type CharacterVector = z.infer<typeof CharacterVectorSchema>;

export interface SearchResult {
  id: string;
  name: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export interface VectorSearchOptions {
  limit?: number;
  minSimilarity?: number;
  filters?: Record<string, unknown>;
}

/**
 * Vector search engine using Supabase pgvector.
 * Stores character embeddings and performs similarity searches.
 */
export class VectorSearch {
  private supabase: SupabaseClient;
  private table = "characters";
  private vectorDimensions = 768;

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string
  ) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_KEY required");
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Store character embedding in Supabase.
   */
  async storeCharacter(
    id: string,
    name: string,
    embedding: number[],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (embedding.length !== this.vectorDimensions) {
      throw new Error(`Embedding must be ${this.vectorDimensions} dimensions`);
    }

    const { error } = await this.supabase.from(this.table).insert([
      {
        id,
        name,
        embedding,
        metadata,
        created_at: new Date(),
      },
    ]);

    if (error) {
      throw new Error(`Failed to store character: ${error.message}`);
    }
  }

  /**
   * Search for similar characters using cosine distance.
   */
  async search(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 10;
    const minSimilarity = options.minSimilarity ?? 0.5;

    if (queryEmbedding.length !== this.vectorDimensions) {
      throw new Error(`Query embedding must be ${this.vectorDimensions} dimensions`);
    }

    // Convert embedding to string format for Postgres
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const { data, error } = await this.supabase
      .rpc("search_characters", {
        query_embedding: embeddingStr,
        similarity_threshold: minSimilarity,
        match_count: limit,
      })
      .returns<Array<{ id: string; name: string; similarity: number; metadata: Record<string, unknown> | null }>>();

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return (data || []).map((result) => ({
      id: result.id,
      name: result.name,
      similarity: result.similarity,
      metadata: result.metadata || undefined,
    }));
  }

  /**
   * Get character by ID.
   */
  async getCharacter(id: string): Promise<CharacterVector | null> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      throw new Error(`Failed to fetch character: ${error.message}`);
    }

    return data ? CharacterVectorSchema.parse(data) : null;
  }

  /**
   * Update character embedding.
   */
  async updateCharacter(
    id: string,
    embedding: number[],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (embedding.length !== this.vectorDimensions) {
      throw new Error(`Embedding must be ${this.vectorDimensions} dimensions`);
    }

    const { error } = await this.supabase
      .from(this.table)
      .update({
        embedding,
        metadata,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update character: ${error.message}`);
    }
  }

  /**
   * Delete character.
   */
  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete character: ${error.message}`);
    }
  }

  /**
   * List all characters.
   */
  async listCharacters(limit = 100): Promise<CharacterVector[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list characters: ${error.message}`);
    }

    return (data || []).map((row) => CharacterVectorSchema.parse(row));
  }

  /**
   * Batch store characters for efficiency.
   */
  async batchStoreCharacters(
    characters: Array<{
      id: string;
      name: string;
      embedding: number[];
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    const validated = characters.map((char) => {
      if (char.embedding.length !== this.vectorDimensions) {
        throw new Error(
          `Character ${char.id}: embedding must be ${this.vectorDimensions} dimensions`
        );
      }
      return {
        ...char,
        created_at: new Date(),
      };
    });

    const { error } = await this.supabase
      .from(this.table)
      .insert(validated);

    if (error) {
      throw new Error(`Batch insert failed: ${error.message}`);
    }
  }

  /**
   * Get statistics about the vector store.
   */
  async getStats(): Promise<{
    totalCharacters: number;
    oldestCharacter: Date | null;
    newestCharacter: Date | null;
  }> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("created_at", { count: "exact" });

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const dates = (data || [])
      .map((row: { created_at: string | null }) => row.created_at)
      .filter((date: string | null) => date !== null)
      .map((date: string | null) => new Date(date!));

    return {
      totalCharacters: data?.length || 0,
      oldestCharacter: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null,
      newestCharacter: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null,
    };
  }
}

export { VectorSearch as default };
