/**
 * InputAdapter - Input Abstraction Layer
 * 
 * Provides unified interface for multiple input methods:
 * - Mouse/Trackpad
 * - Touch (mobile/tablet)
 * - Eye-tracking (future support)
 * 
 * Philosophy: Decouple input source from reading logic.
 */

export interface InputEvent {
  readonly type: InputType;
  readonly timestamp: number;
  readonly position?: InputPosition;
  readonly pressure?: number; // For touch input
}

export enum InputType {
  MOUSE = 'MOUSE',
  TOUCH = 'TOUCH',
  EYE_TRACKER = 'EYE_TRACKER',
}

export interface InputPosition {
  readonly x: number;
  readonly y: number;
}

export interface InputAdapterConfig {
  readonly supportedInputTypes: readonly InputType[];
  readonly enableTouchPressure: boolean;
  readonly eyeTrackerEnabled: boolean;
}

/**
 * InputAdapter Interface
 * 
 * Core responsibility: Normalize input from different sources
 * into a unified event stream for the reading engine.
 */
export interface IInputAdapter {
  /**
   * Register handler for input events
   */
  onInput(handler: (event: InputEvent) => void): () => void; // Returns unregister function

  /**
   * Get current input type (or primary if multiple)
   */
  getCurrentInputType(): InputType | null;

  /**
   * Check if specific input type is available
   */
  isInputTypeAvailable(type: InputType): boolean;

  /**
   * Initialize input adapter
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  destroy(): void;
}

/**
 * InputAdapter Implementation
 * 
 * Concrete implementation that handles mouse, touch, and eye-tracking.
 * Provides event normalization and input type detection.
 */
export class InputAdapter implements IInputAdapter {
  private handlers: Set<(event: InputEvent) => void> = new Set();
  private currentInputType: InputType | null = null;
  private readonly config: InputAdapterConfig;
  private isInitialized = false;

  constructor(config: InputAdapterConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Detect available input types
    this.detectInputTypes();

    // Set up event listeners
    this.setupEventListeners();

    this.isInitialized = true;
  }

  onInput(handler: (event: InputEvent) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getCurrentInputType(): InputType | null {
    return this.currentInputType;
  }

  isInputTypeAvailable(type: InputType): boolean {
    return this.config.supportedInputTypes.includes(type);
  }

  destroy(): void {
    this.removeEventListeners();
    this.handlers.clear();
    this.isInitialized = false;
  }

  private detectInputTypes(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Touch support detection
    if (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints
    ) {
      this.currentInputType = InputType.TOUCH;
    } else {
      this.currentInputType = InputType.MOUSE;
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Mouse events
    window.addEventListener('mousedown', this.handleMouseEvent);
    window.addEventListener('mousemove', this.handleMouseEvent);

    // Touch events
    window.addEventListener('touchstart', this.handleTouchEvent, {
      passive: true,
    });
    window.addEventListener('touchmove', this.handleTouchEvent, {
      passive: true,
    });

    // Eye tracker (placeholder for future implementation)
    if (this.config.eyeTrackerEnabled) {
      // TODO: Integrate eye-tracking SDK when available
    }
  }

  private removeEventListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('mousedown', this.handleMouseEvent);
    window.removeEventListener('mousemove', this.handleMouseEvent);
    window.removeEventListener('touchstart', this.handleTouchEvent);
    window.removeEventListener('touchmove', this.handleTouchEvent);
  }

  private handleMouseEvent = (event: MouseEvent): void => {
    this.emitEvent({
      type: InputType.MOUSE,
      timestamp: performance.now(),
      position: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private handleTouchEvent = (event: TouchEvent): void => {
    if (event.touches.length === 0) {
      return;
    }

    const touch = event.touches[0];
    this.emitEvent({
      type: InputType.TOUCH,
      timestamp: performance.now(),
      position: {
        x: touch.clientX,
        y: touch.clientY,
      },
      pressure: this.config.enableTouchPressure ? touch.force : undefined,
    });
  };

  private emitEvent(event: InputEvent): void {
    this.handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in input event handler:', error);
      }
    });
  }
}
