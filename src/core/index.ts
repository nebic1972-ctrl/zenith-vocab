/**
 * Core Architecture Exports
 * 
 * Centralized exports for core services and interfaces.
 */

// Performance Tracking
export type {
  ITalentScout,
  ReadingMetrics,
  FastTrackThreshold,
  TalentScoutConfig,
  TalentScoutState,
} from './performance/TalentScout';
export { TalentScout } from './performance/TalentScout';

// Adaptive Difficulty
export type {
  IDifficultyScaler,
  DifficultyLevel,
  UserCapability,
  DifficultyScalerConfig,
  PerformanceFeedback,
} from './adaptive-engine/DifficultyScaler';
export {
  DifficultyScaler,
  TextComplexity,
  QuestionComplexity,
} from './adaptive-engine/DifficultyScaler';

// Input Sensors
export type {
  IInputAdapter,
  InputEvent,
  InputAdapterConfig,
} from './sensors/InputAdapter';
export { InputAdapter, InputType } from './sensors/InputAdapter';

// Anti-Cheat Sentinel
export type {
  IAntiCheat,
  CheatIndicator,
  InteractionPattern,
  AntiCheatConfig,
} from './sentinel/AntiCheat';
export {
  AntiCheat,
  CheatType,
  CheatSeverity,
} from './sentinel/AntiCheat';
