export { CharacterEmbedder } from "./embedding";
export type {
  EmbeddingOptions,
  CharacterEmbedding,
  EmbeddingResult,
} from "./embedding";

export { VectorSearch } from "./vector-search";
export type {
  CharacterVector,
  SearchResult,
  VectorSearchOptions,
} from "./vector-search";

export { FluxOrchestrator } from "./flux-orchestrator";
export type {
  FluxOptions,
  FluxResult,
} from "./flux-orchestrator";

export { SeedanceClient } from "./seedance-client";
export type {
  SeedanceOptions,
  SeedanceResult,
} from "./seedance-client";

export { KlingClient } from "./kling-client";
export type {
  KlingOptions,
  KlingResult,
} from "./kling-client";

export { FrameProcessor } from "./frame-processor";
export type {
  InterpolationOptions,
  ProcessResult,
} from "./frame-processor";

export { CostTracker } from "./cost-tracker";
export type {
  VideoCost,
  CostEntry,
} from "./cost-tracker";

export { UDECScorer } from "./udec-scorer";
export type {
  UDECScore,
  ScoringMetadata,
} from "./udec-scorer";

export { QualityGate } from "./quality-gate";
export type {
  QualityResult,
  QualityGateConfig,
} from "./quality-gate";

export { HiggsfieldClient } from "./higgsfield-client";
export type {
  HiggsfieldOptions,
} from "./higgsfield-client";

export { ColorGrader } from "./color-grader";
export type {
  GradingResult,
} from "./color-grader";

export * from "./presets";

export { SceneOrchestrator } from "./scene-orchestrator";
export type {
  Character,
  SceneConfig,
} from "./scene-orchestrator";
