/**
 * DifficultyScaler - Adaptive Difficulty Engine
 * 
 * Implements Zone of Proximal Development (ZPD) theory:
 * Difficulty is maintained at 5% above user's current capability limit.
 * Never makes difficulty "impossible" - always within reach but challenging.
 * 
 * Philosophy: Progressive challenge without overwhelming the user.
 */

export interface DifficultyLevel {
  readonly level: number; // 1-10 scale
  readonly wpmTarget: number;
  readonly textComplexity: TextComplexity;
  readonly questionComplexity: QuestionComplexity;
}

export enum TextComplexity {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum QuestionComplexity {
  SIMPLE = 'SIMPLE',
  MODERATE = 'MODERATE',
  COMPLEX = 'COMPLEX',
  ANALYTICAL = 'ANALYTICAL',
}

export interface UserCapability {
  readonly currentWPM: number;
  readonly maxSustainedWPM: number;
  readonly comprehensionScore: number;
  readonly sessionCount: number;
}

export interface DifficultyScalerConfig {
  readonly baseDifficultyLevel: number;
  readonly zpdOffset: number; // Percentage above capability (default: 0.05 = 5%)
  readonly maxDifficultyLevel: number;
  readonly minDifficultyLevel: number;
}

/**
 * DifficultyScaler Service Interface
 * 
 * Core responsibility: Calculate optimal difficulty level based on
 * user's current capability, maintaining ZPD principles.
 */
export interface IDifficultyScaler {
  /**
   * Calculate next difficulty level based on user capability
   */
  calculateDifficulty(capability: UserCapability): DifficultyLevel;

  /**
   * Adjust difficulty based on performance feedback
   */
  adjustDifficulty(
    currentLevel: DifficultyLevel,
    performance: PerformanceFeedback
  ): DifficultyLevel;

  /**
   * Get difficulty level for fast-track users
   */
  getFastTrackDifficulty(capability: UserCapability): DifficultyLevel;
}

export interface PerformanceFeedback {
  readonly successRate: number; // 0.0 to 1.0
  readonly timeToComplete: number; // milliseconds
  readonly comprehensionScore: number; // 0.0 to 1.0
}

/**
 * DifficultyScaler Implementation
 * 
 * Concrete implementation of adaptive difficulty scaling.
 * Applies ZPD theory: difficulty = capability * (1 + zpdOffset)
 */
export class DifficultyScaler implements IDifficultyScaler {
  private readonly config: DifficultyScalerConfig;

  constructor(config: DifficultyScalerConfig) {
    this.config = config;
  }

  calculateDifficulty(capability: UserCapability): DifficultyLevel {
    const targetWPM = capability.maxSustainedWPM * (1 + this.config.zpdOffset);
    
    const level = this.calculateLevelFromWPM(targetWPM);
    const clampedLevel = this.clampLevel(level);

    return {
      level: clampedLevel,
      wpmTarget: targetWPM,
      textComplexity: this.mapLevelToTextComplexity(clampedLevel),
      questionComplexity: this.mapLevelToQuestionComplexity(clampedLevel),
    };
  }

  adjustDifficulty(
    currentLevel: DifficultyLevel,
    performance: PerformanceFeedback
  ): DifficultyLevel {
    // If user is performing too well (>90% success), increase difficulty
    // If user is struggling (<70% success), decrease difficulty
    let adjustment = 0;

    if (performance.successRate > 0.9 && performance.comprehensionScore > 0.85) {
      adjustment = 1;
    } else if (performance.successRate < 0.7 || performance.comprehensionScore < 0.6) {
      adjustment = -1;
    }

    const newLevel = this.clampLevel(currentLevel.level + adjustment);

    return {
      level: newLevel,
      wpmTarget: this.calculateWPMFromLevel(newLevel),
      textComplexity: this.mapLevelToTextComplexity(newLevel),
      questionComplexity: this.mapLevelToQuestionComplexity(newLevel),
    };
  }

  getFastTrackDifficulty(capability: UserCapability): DifficultyLevel {
    // Fast-track users get difficulty at 10% above capability (vs 5% normal)
    const targetWPM = capability.maxSustainedWPM * 1.1;
    const level = this.calculateLevelFromWPM(targetWPM);
    const clampedLevel = Math.min(
      this.clampLevel(level + 1),
      this.config.maxDifficultyLevel
    );

    return {
      level: clampedLevel,
      wpmTarget: targetWPM,
      textComplexity: this.mapLevelToTextComplexity(clampedLevel),
      questionComplexity: this.mapLevelToQuestionComplexity(clampedLevel),
    };
  }

  private calculateLevelFromWPM(wpm: number): number {
    // Linear mapping: 50 WPM = level 1, 400 WPM = level 10
    const minWPM = 50;
    const maxWPM = 400;
    const normalized = (wpm - minWPM) / (maxWPM - minWPM);
    return 1 + normalized * 9;
  }

  private calculateWPMFromLevel(level: number): number {
    const minWPM = 50;
    const maxWPM = 400;
    const normalized = (level - 1) / 9;
    return minWPM + normalized * (maxWPM - minWPM);
  }

  private clampLevel(level: number): number {
    return Math.max(
      this.config.minDifficultyLevel,
      Math.min(this.config.maxDifficultyLevel, Math.round(level))
    );
  }

  private mapLevelToTextComplexity(level: number): TextComplexity {
    if (level <= 3) return TextComplexity.BEGINNER;
    if (level <= 6) return TextComplexity.INTERMEDIATE;
    if (level <= 8) return TextComplexity.ADVANCED;
    return TextComplexity.EXPERT;
  }

  private mapLevelToQuestionComplexity(level: number): QuestionComplexity {
    if (level <= 2) return QuestionComplexity.SIMPLE;
    if (level <= 5) return QuestionComplexity.MODERATE;
    if (level <= 8) return QuestionComplexity.COMPLEX;
    return QuestionComplexity.ANALYTICAL;
  }
}
