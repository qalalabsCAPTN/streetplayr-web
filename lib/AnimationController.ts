/**
 * Global Animation Coordinator
 *
 * Synchronizes all RAF-based animations (scroll, carousel, 3D) into a single
 * master loop. This eliminates frame drops caused by competing RAF loops.
 *
 * All animations update in the same frame, preventing jank.
 */

type AnimationUpdater = (deltaTime: number, timestamp: number) => void;

class AnimationController {
  private static instance: AnimationController | null = null;

  private updaters: Map<string, AnimationUpdater> = new Map();
  private rafId: number | null = null;
  private isRunning = false;
  private lastTimestamp = 0;

  private constructor() {}

  static getInstance(): AnimationController {
    if (!AnimationController.instance) {
      AnimationController.instance = new AnimationController();
    }
    return AnimationController.instance;
  }

  /**
   * Register an animation updater function.
   * Called once per frame with (deltaTime, timestamp).
   */
  register(id: string, updater: AnimationUpdater): void {
    this.updaters.set(id, updater);
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Unregister an animation updater.
   */
  unregister(id: string): void {
    this.updaters.delete(id);
    if (this.updaters.size === 0) {
      this.stop();
    }
  }

  private start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.loop(performance.now());
  }

  private stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (timestamp: number): void => {
    const deltaTime = this.lastTimestamp ? Math.min(timestamp - this.lastTimestamp, 100) : 0;
    this.lastTimestamp = timestamp;

    // Update all registered animations in sync
    for (const updater of this.updaters.values()) {
      updater(deltaTime, timestamp);
    }

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  /**
   * Force a single animation update (useful for testing/debugging)
   */
  tick(deltaTime: number = 16.67): void {
    this.loop(this.lastTimestamp + deltaTime);
  }
}

export const animationController = AnimationController.getInstance();
