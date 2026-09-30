// =========================================================================
// Real-Time ANSI Double-Buffering Render Canvas (Cell Diffing & Single-Syscall Flush)
// Author: Felipe Madison (@FelipeMadson)
// =========================================================================

import { VT100Parser } from "./vt100-parser.ts";

export interface TerminalDimensions {
  cols: number;
  rows: number;
}

export interface TerminalCell {
  char: string;
  fg: number;    // -1 = default, 0x000000..0xFFFFFF = RGB, 0..255 = ANSI 256
  bg: number;    // -1 = default, 0x000000..0xFFFFFF = RGB, 0..255 = ANSI 256
  flags: number; // Bitmask: 1=Bold, 2=Dim, 4=Italic, 8=Underline, 16=Inverse
}

export const CellFlags = {
  NONE: 0,
  BOLD: 1,
  DIM: 2,
  ITALIC: 4,
  UNDERLINE: 8,
  INVERSE: 16
} as const;

export interface IAnsiDoubleBuffer {
  resize(cols: number, rows: number): void;
  setCell(col: number, row: number, char: string, fg?: number, bg?: number, flags?: number): void;
  writeString(col: number, row: number, text: string, fg?: number, bg?: number, flags?: number): void;
  clear(bg?: number): void;
  flush(): string;
}

export class AnsiDoubleBuffer implements IAnsiDoubleBuffer {
  private cols: number;
  private rows: number;
  private frontBuffer: TerminalCell[];
  private backBuffer: TerminalCell[];

  constructor(dimensions: TerminalDimensions = { cols: 80, rows: 24 }) {
    this.cols = Math.max(1, dimensions.cols);
    this.rows = Math.max(1, dimensions.rows);
    this.frontBuffer = this.allocateGrid(this.cols, this.rows);
    this.backBuffer = this.allocateGrid(this.cols, this.rows);
  }

  private allocateGrid(cols: number, rows: number): TerminalCell[] {
    const size = cols * rows;
    const grid = new Array<TerminalCell>(size);
    for (let i = 0; i < size; i++) {
      grid[i] = { char: " ", fg: -1, bg: -1, flags: 0 };
    }
    return grid;
  }

  public resize(cols: number, rows: number): void {
    const newCols = Math.max(1, cols);
    const newRows = Math.max(1, rows);
    if (newCols === this.cols && newRows === this.rows) return;

    const newFront = this.allocateGrid(newCols, newRows);
    const newBack = this.allocateGrid(newCols, newRows);

    const minCols = Math.min(this.cols, newCols);
    const minRows = Math.min(this.rows, newRows);

    for (let r = 0; r < minRows; r++) {
      for (let c = 0; c < minCols; c++) {
        const oldIdx = r * this.cols + c;
        const newIdx = r * newCols + c;
        newFront[newIdx] = { ...this.frontBuffer[oldIdx] };
        newBack[newIdx] = { ...this.backBuffer[oldIdx] };
      }
    }

    this.cols = newCols;
    this.rows = newRows;
    this.frontBuffer = newFront;
    this.backBuffer = newBack;
  }

  public getDimensions(): TerminalDimensions {
    return { cols: this.cols, rows: this.rows };
  }

  public setCell(col: number, row: number, char: string, fg = -1, bg = -1, flags = 0): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const idx = row * this.cols + col;
    this.backBuffer[idx] = {
      char: char.length > 0 ? char : " ",
      fg,
      bg,
      flags
    };
  }

  public writeString(col: number, row: number, text: string, fg = -1, bg = -1, flags = 0): void {
    if (row < 0 || row >= this.rows || col >= this.cols) return;

    const cleanText = VT100Parser.stripAnsi(text);
    let currentCol = col;

    // Segment by graphemes to preserve ZWJ emojis and accented characters
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

    for (const segment of segmenter.segment(cleanText)) {
      if (currentCol >= this.cols) break;
      const grapheme = segment.segment;
      const width = VT100Parser.visualWidth(grapheme);

      this.setCell(currentCol, row, grapheme, fg, bg, flags);

      // If fullwidth (width 2), fill subsequent cell with empty string
      if (width === 2 && currentCol + 1 < this.cols) {
        this.setCell(currentCol + 1, row, "", fg, bg, flags);
      }

      currentCol += Math.max(1, width);
    }
  }

  public clear(bg = -1): void {
    const size = this.cols * this.rows;
    for (let i = 0; i < size; i++) {
      this.backBuffer[i] = { char: " ", fg: -1, bg, flags: 0 };
    }
  }

  public flush(): string {
    let out = "";
    let activeFg = -1;
    let activeBg = -1;
    let activeFlags = 0;
    let cursorCol = -1;
    let cursorRow = -1;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        const b = this.backBuffer[idx];
        const f = this.frontBuffer[idx];

        // Strict cell diffing
        if (
          b.char === f.char &&
          b.fg === f.fg &&
          b.bg === f.bg &&
          b.flags === f.flags
        ) {
          continue;
        }

        // Reposition cursor if not already at current position
        if (cursorRow !== r || cursorCol !== c) {
          out += `\x1b[${r + 1};${c + 1}H`;
          cursorRow = r;
          cursorCol = c;
        }

        // Style flags transition
        if (b.flags !== activeFlags) {
          if ((activeFlags & ~b.flags) !== 0) {
            // Disabled styles require reset
            out += "\x1b[0m";
            activeFg = -1;
            activeBg = -1;
            activeFlags = 0;
          }
          if (b.flags & CellFlags.BOLD && !(activeFlags & CellFlags.BOLD)) out += "\x1b[1m";
          if (b.flags & CellFlags.DIM && !(activeFlags & CellFlags.DIM)) out += "\x1b[2m";
          if (b.flags & CellFlags.ITALIC && !(activeFlags & CellFlags.ITALIC)) out += "\x1b[3m";
          if (b.flags & CellFlags.UNDERLINE && !(activeFlags & CellFlags.UNDERLINE)) out += "\x1b[4m";
          if (b.flags & CellFlags.INVERSE && !(activeFlags & CellFlags.INVERSE)) out += "\x1b[7m";
          activeFlags = b.flags;
        }

        // Foreground (FG) transition
        if (b.fg !== activeFg) {
          if (b.fg === -1) {
            out += "\x1b[39m";
          } else if (b.fg > 255) {
            const red = (b.fg >> 16) & 0xff;
            const green = (b.fg >> 8) & 0xff;
            const blue = b.fg & 0xff;
            out += `\x1b[38;2;${red};${green};${blue}m`;
          } else {
            out += `\x1b[38;5;${b.fg}m`;
          }
          activeFg = b.fg;
        }

        // Background (BG) transition
        if (b.bg !== activeBg) {
          if (b.bg === -1) {
            out += "\x1b[49m";
          } else if (b.bg > 255) {
            const red = (b.bg >> 16) & 0xff;
            const green = (b.bg >> 8) & 0xff;
            const blue = b.bg & 0xff;
            out += `\x1b[48;2;${red};${green};${blue}m`;
          } else {
            out += `\x1b[48;5;${b.bg}m`;
          }
          activeBg = b.bg;
        }

        // Output char
        out += b.char;
        cursorCol++;

        // Update frontBuffer
        this.frontBuffer[idx] = { ...b };
      }
    }

    // Reset styles at end if styling was active
    if (out.length > 0 && (activeFlags !== 0 || activeFg !== -1 || activeBg !== -1)) {
      out += "\x1b[0m";
    }

    return out;
  }
}
