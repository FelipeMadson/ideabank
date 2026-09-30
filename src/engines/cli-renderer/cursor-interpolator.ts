// =========================================================================
// Real-Time Cursor Movement Interpolator (Easing & Step Accumulator)
// Author: Felipe Madison (@FelipeMadson)
// =========================================================================

export interface CursorCoordinates {
  col: number;
  row: number;
}

export type EasingType = "linear" | "ease-in-out";

export interface ICursorInterpolator {
  setTarget(target: CursorCoordinates, durationMs: number, easing?: EasingType): void;
  update(nowMs: number): { current: CursorCoordinates; delta: CursorCoordinates; isComplete: boolean };
}

export class CursorInterpolator implements ICursorInterpolator {
  private start: CursorCoordinates;
  private currentFloat: { col: number; row: number };
  private target: CursorCoordinates;
  private currentInt: CursorCoordinates;
  private startTimeMs: number = 0;
  private durationMs: number = 0;
  private easing: EasingType = "linear";
  private isFinished: boolean = true;

  constructor(initial: CursorCoordinates = { col: 0, row: 0 }) {
    this.start = { ...initial };
    this.currentFloat = { ...initial };
    this.currentInt = { ...initial };
    this.target = { ...initial };
  }

  public setTarget(target: CursorCoordinates, durationMs: number, easing: EasingType = "linear", startTimeMs: number = 0): void {
    this.start = { ...this.currentInt };
    this.currentFloat = { ...this.currentInt };
    this.target = { col: Math.round(target.col), row: Math.round(target.row) };
    this.durationMs = Math.max(0, durationMs);
    this.easing = easing;
    this.startTimeMs = startTimeMs;
    this.isFinished = this.durationMs === 0 || (this.start.col === this.target.col && this.start.row === this.target.row);
  }

  public update(nowMs: number): { current: CursorCoordinates; delta: CursorCoordinates; isComplete: boolean } {
    if (this.isFinished) {
      return {
        current: { ...this.currentInt },
        delta: { col: 0, row: 0 },
        isComplete: true
      };
    }

    if (this.startTimeMs < 0) {
      this.startTimeMs = nowMs;
    }

    const elapsed = nowMs - this.startTimeMs;
    let t = this.durationMs > 0 ? elapsed / this.durationMs : 1;

    if (t >= 1) {
      t = 1;
      this.isFinished = true;
    }

    const progress = this.calculateEasing(t);
    const targetCol = this.start.col + progress * (this.target.col - this.start.col);
    const targetRow = this.start.row + progress * (this.target.row - this.start.row);

    this.currentFloat = { col: targetCol, row: targetRow };
    const nextIntCol = Math.round(targetCol);
    const nextIntRow = Math.round(targetRow);

    const deltaCol = nextIntCol - this.currentInt.col;
    const deltaRow = nextIntRow - this.currentInt.row;

    this.currentInt = { col: nextIntCol, row: nextIntRow };

    return {
      current: { ...this.currentInt },
      delta: { col: deltaCol, row: deltaRow },
      isComplete: this.isFinished
    };
  }

  private calculateEasing(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    if (this.easing === "ease-in-out") {
      // EaseInOutQuad: 2t^2 para t < 0.5, 1 - (-2t + 2)^2 / 2 para t >= 0.5
      return clamped < 0.5
        ? 2 * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
    }
    return clamped; // Linear
  }

  public getPosition(): CursorCoordinates {
    return { ...this.currentInt };
  }
}
