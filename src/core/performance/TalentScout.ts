/**
 * TalentScout - Performance Tracking & Fast-Track Detection
 * 
 * Monitors user WPM (Words Per Minute) and comprehension rate in real-time.
 * Triggers fast-track mode when user demonstrates exceptional performance
 * in the first 10% of a reading session.
 * 
 * Philosophy: Identify high-performing users early and challenge them appropriately.
 */

export interface ReadingMetrics {
  readonly wpm: number;
  readonly comprehensionRate: number;
  readonly sessionProgress: number; // 0.0 to 1.0
  readonly timestamp: number;
}

export interface FastTrackThreshold {
  readonly wpmThreshold: number;
  readonly comprehensionThreshold: number;
  readonly progressWindow: number; // 0.0 to 1.0 (e.g., 0.1 for first 10%)
}

export interface TalentScoutConfig {
  readonly fastTrackThreshold: FastTrackThreshold;
  readonly sampleWindowSize: number; // Number of samples to consider
}

export interface TalentScoutState {
  readonly metrics: readonly ReadingMetrics[];
  readonly isFastTrackActive: boolean;
  readonly averageWPM: number;
  readonly averageComprehension: number;
}

/**
 * TalentScout Service Interface
 * 
 * Core responsibility: Track reading performance and detect when
 * a user qualifies for fast-track mode (exceptional early performance).
 */
export interface ITalentScout {
  /**
   * Record a new reading metric sample
   */
  recordMetric(metric: ReadingMetrics): void;

  /**
   * Check if user qualifies for fast-track mode
   * 
   * Criteria: User must demonstrate high WPM and comprehension
   * within the configured progress window (default: first 10%)
   */
  checkFastTrackEligibility(): boolean;

  /**
   * Trigger fast-track mode (challenge user with higher difficulty)
   */
  triggerFastTrack(): void;

  /**
   * Get current state snapshot
   */
  getState(): TalentScoutState;

  /**
   * Reset tracking for a new session
   */
  reset(): void;
}

/**
 * TalentScout Implementation
 * 
 * Concrete implementation of the performance tracking service.
 * Maintains a rolling window of metrics and evaluates fast-track eligibility.
 */
export class TalentScout implements ITalentScout {
  private metrics: ReadingMetrics[] = [];
  private isFastTrackActive = false;
  private readonly config: TalentScoutConfig;

  constructor(config: TalentScoutConfig) {
    this.config = config;
  }

  recordMetric(metric: ReadingMetrics): void {
    this.metrics.push(metric);
    
    // Maintain rolling window
    if (this.metrics.length > this.config.sampleWindowSize) {
      this.metrics.shift();
    }

    // Auto-check fast-track eligibility after each metric
    if (!this.isFastTrackActive) {
      if (this.checkFastTrackEligibility()) {
        this.triggerFastTrack();
      }
    }
  }

  checkFastTrackEligibility(): boolean {
    if (this.metrics.length === 0) {
      return false;
    }

    const { fastTrackThreshold } = this.config;
    const windowMetrics = this.metrics.filter(
      (metric) => metric.sessionProgress <= fastTrackThreshold.progressWindow
    );

    if (windowMetrics.length === 0) {
      return false;
    }

    const avgWPM = this.calculateAverageWPM(windowMetrics);
    const avgComprehension = this.calculateAverageComprehension(windowMetrics);

    return (
      avgWPM >= fastTrackThreshold.wpmThreshold &&
      avgComprehension >= fastTrackThreshold.comprehensionThreshold
    );
  }

  triggerFastTrack(): void {
    this.isFastTrackActive = true;
  }

  getState(): TalentScoutState {
    return {
      metrics: [...this.metrics],
      isFastTrackActive: this.isFastTrackActive,
      averageWPM: this.calculateAverageWPM(this.metrics),
      averageComprehension: this.calculateAverageComprehension(this.metrics),
    };
  }

  reset(): void {
    this.metrics = [];
    this.isFastTrackActive = false;
  }

  private calculateAverageWPM(metrics: readonly ReadingMetrics[]): number {
    if (metrics.length === 0) {
      return 0;
    }
    const sum = metrics.reduce((acc, metric) => acc + metric.wpm, 0);
    return sum / metrics.length;
  }

  private calculateAverageComprehension(
    metrics: readonly ReadingMetrics[]
  ): number {
    if (metrics.length === 0) {
      return 0;
    }
    const sum = metrics.reduce(
      (acc, metric) => acc + metric.comprehensionRate,
      0
    );
    return sum / metrics.length;
  }
}
