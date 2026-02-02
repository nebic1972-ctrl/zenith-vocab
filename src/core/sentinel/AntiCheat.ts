/**
 * AntiCheat - Silent Observer (Sessiz Gözlemci)
 * 
 * Detects and prevents:
 * - Random clicking (meaningless interactions)
 * - Instruction skipping (bypassing reading instructions)
 * - Pattern-based automation (bot-like behavior)
 * 
 * Philosophy: Maintain integrity of the learning experience
 * without being intrusive or punitive.
 */

export interface CheatIndicator {
  readonly type: CheatType;
  readonly severity: CheatSeverity;
  readonly timestamp: number;
  readonly evidence: readonly string[];
}

export enum CheatType {
  RANDOM_CLICKING = 'RANDOM_CLICKING',
  INSTRUCTION_SKIP = 'INSTRUCTION_SKIP',
  PATTERN_AUTOMATION = 'PATTERN_AUTOMATION',
  TIMING_ANOMALY = 'TIMING_ANOMALY',
}

export enum CheatSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface InteractionPattern {
  readonly eventSequence: readonly InteractionEvent[];
  readonly timingPattern: TimingAnalysis;
  readonly spatialPattern: SpatialAnalysis;
}

export interface InteractionEvent {
  readonly type: 'click' | 'scroll' | 'keypress';
  readonly timestamp: number;
  readonly position?: { x: number; y: number };
  readonly target?: string;
}

export interface TimingAnalysis {
  readonly intervals: readonly number[];
  readonly averageInterval: number;
  readonly variance: number;
  readonly isRegular: boolean; // Too regular = bot-like
}

export interface SpatialAnalysis {
  readonly positions: readonly { x: number; y: number }[];
  readonly movementPattern: 'random' | 'systematic' | 'natural';
  readonly dispersion: number;
}

export interface AntiCheatConfig {
  readonly randomClickThreshold: number; // Max clicks without reading
  readonly instructionSkipWindow: number; // Time window for instruction display
  readonly patternDetectionWindow: number; // Events to analyze
  readonly timingTolerance: number; // Allowed timing variance
}

/**
 * AntiCheat Interface
 * 
 * Core responsibility: Monitor user interactions and detect
 * suspicious patterns that indicate cheating or automation.
 */
export interface IAntiCheat {
  /**
   * Record an interaction event
   */
  recordInteraction(event: InteractionEvent): void;

  /**
   * Check if current pattern indicates cheating
   */
  analyzePattern(): readonly CheatIndicator[];

  /**
   * Check if user skipped instructions
   */
  checkInstructionSkip(instructionDisplayTime: number): boolean;

  /**
   * Reset analysis for new session
   */
  reset(): void;
}

/**
 * AntiCheat Implementation
 * 
 * Silent observer that analyzes interaction patterns without
 * disrupting the user experience.
 */
export class AntiCheat implements IAntiCheat {
  private interactionHistory: InteractionEvent[] = [];
  private instructionStartTime: number | null = null;
  private readonly config: AntiCheatConfig;

  constructor(config: AntiCheatConfig) {
    this.config = config;
  }

  recordInteraction(event: InteractionEvent): void {
    this.interactionHistory.push(event);

    // Maintain rolling window
    if (
      this.interactionHistory.length > this.config.patternDetectionWindow
    ) {
      this.interactionHistory.shift();
    }
  }

  analyzePattern(): readonly CheatIndicator[] {
    const indicators: CheatIndicator[] = [];

    // Check for random clicking
    const randomClickIndicator = this.detectRandomClicking();
    if (randomClickIndicator) {
      indicators.push(randomClickIndicator);
    }

    // Check for pattern automation
    const automationIndicator = this.detectPatternAutomation();
    if (automationIndicator) {
      indicators.push(automationIndicator);
    }

    // Check for timing anomalies
    const timingIndicator = this.detectTimingAnomalies();
    if (timingIndicator) {
      indicators.push(timingIndicator);
    }

    return indicators;
  }

  checkInstructionSkip(instructionDisplayTime: number): boolean {
    if (this.interactionHistory.length === 0) {
      return false;
    }

    const firstInteraction = this.interactionHistory[0];
    const timeToFirstInteraction = firstInteraction.timestamp - instructionDisplayTime;

    return timeToFirstInteraction < this.config.instructionSkipWindow;
  }

  reset(): void {
    this.interactionHistory = [];
    this.instructionStartTime = null;
  }

  private detectRandomClicking(): CheatIndicator | null {
    if (this.interactionHistory.length < this.config.randomClickThreshold) {
      return null;
    }

    // Analyze if clicks are in meaningful areas (simplified check)
    const recentClicks = this.interactionHistory
      .filter((e) => e.type === 'click')
      .slice(-this.config.randomClickThreshold);

    if (recentClicks.length < this.config.randomClickThreshold) {
      return null;
    }

    // Check spatial dispersion (random clicks = high dispersion, low clustering)
    const positions = recentClicks
      .map((c) => c.position)
      .filter((p): p is { x: number; y: number } => p !== undefined);

    if (positions.length < 3) {
      return null;
    }

    const dispersion = this.calculateDispersion(positions);

    // High dispersion with no clear pattern suggests random clicking
    if (dispersion > 0.8) {
      return {
        type: CheatType.RANDOM_CLICKING,
        severity: CheatSeverity.MEDIUM,
        timestamp: Date.now(),
        evidence: [
          `High spatial dispersion: ${dispersion.toFixed(2)}`,
          `${recentClicks.length} clicks analyzed`,
        ],
      };
    }

    return null;
  }

  private detectPatternAutomation(): CheatIndicator | null {
    if (this.interactionHistory.length < 5) {
      return null;
    }

    const timingAnalysis = this.analyzeTiming();
    if (timingAnalysis.isRegular && timingAnalysis.variance < this.config.timingTolerance) {
      return {
        type: CheatType.PATTERN_AUTOMATION,
        severity: CheatSeverity.HIGH,
        timestamp: Date.now(),
        evidence: [
          `Extremely regular timing pattern (variance: ${timingAnalysis.variance.toFixed(2)})`,
          `Average interval: ${timingAnalysis.averageInterval.toFixed(2)}ms`,
        ],
      };
    }

    return null;
  }

  private detectTimingAnomalies(): CheatIndicator | null {
    if (this.interactionHistory.length < 3) {
      return null;
    }

    const timingAnalysis = this.analyzeTiming();
    const intervals = timingAnalysis.intervals;

    // Check for impossibly fast interactions (humanly impossible)
    const tooFast = intervals.some((interval) => interval < 50); // < 50ms is suspicious

    if (tooFast) {
      return {
        type: CheatType.TIMING_ANOMALY,
        severity: CheatSeverity.CRITICAL,
        timestamp: Date.now(),
        evidence: [
          `Interactions faster than humanly possible (< 50ms)`,
          `Minimum interval: ${Math.min(...intervals)}ms`,
        ],
      };
    }

    return null;
  }

  private analyzeTiming(): TimingAnalysis {
    if (this.interactionHistory.length < 2) {
      return {
        intervals: [],
        averageInterval: 0,
        variance: 0,
        isRegular: false,
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.interactionHistory.length; i++) {
      const interval =
        this.interactionHistory[i].timestamp -
        this.interactionHistory[i - 1].timestamp;
      intervals.push(interval);
    }

    const averageInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - averageInterval, 2),
        0
      ) / intervals.length;

    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / averageInterval;

    // Low coefficient of variation = very regular pattern
    const isRegular = coefficientOfVariation < 0.1;

    return {
      intervals,
      averageInterval,
      variance,
      isRegular,
    };
  }

  private calculateDispersion(
    positions: readonly { x: number; y: number }[]
  ): number {
    if (positions.length < 2) {
      return 0;
    }

    // Calculate centroid
    const centroid = {
      x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
      y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length,
    };

    // Calculate average distance from centroid
    const avgDistance =
      positions.reduce(
        (sum, p) =>
          sum +
          Math.sqrt(
            Math.pow(p.x - centroid.x, 2) + Math.pow(p.y - centroid.y, 2)
          ),
        0
      ) / positions.length;

    // Normalize (simplified - would need screen dimensions for true normalization)
    const maxExpectedDistance = 1000; // Approximate screen diagonal
    return Math.min(avgDistance / maxExpectedDistance, 1.0);
  }
}
