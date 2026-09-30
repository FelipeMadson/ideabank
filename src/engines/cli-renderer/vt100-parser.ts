// =========================================================================
// High-Performance VT100 / xterm Sequence Parser & Visual Width Engine
// Author: Felipe Madison (@FelipeMadson)
// =========================================================================

export type TokenType = "text" | "csi" | "osc";

export interface AnsiToken {
  type: TokenType;
  raw: string;
  value?: string;
}

export interface IVT100Parser {
  stripAnsi(input: string): string;
  visualWidth(input: string): number;
  tokenize(input: string): AnsiToken[];
}

export class VT100Parser implements IVT100Parser {
  // Regex covering CSI (\x1b[...m/H/J), OSC (\x1b]...\x07), and standard escape sequences
  private static readonly ANSI_REGEX = /\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[PX^_][^\x1b]*\x1b\\|\x1b[@-Z\\-_]/g;

  private static readonly graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  public stripAnsi(input: string): string {
    return VT100Parser.stripAnsi(input);
  }

  public static stripAnsi(input: string): string {
    if (!input) return "";
    return input.replace(VT100Parser.ANSI_REGEX, "");
  }

  public visualWidth(input: string): number {
    return VT100Parser.visualWidth(input);
  }

  public static visualWidth(input: string): number {
    if (!input) return 0;
    const clean = VT100Parser.stripAnsi(input);
    let totalWidth = 0;

    for (const segment of VT100Parser.graphemeSegmenter.segment(clean)) {
      totalWidth += VT100Parser.getGraphemeWidth(segment.segment);
    }

    return totalWidth;
  }

  private static getGraphemeWidth(grapheme: string): number {
    if (!grapheme || grapheme.length === 0) return 0;

    const codePoint = grapheme.codePointAt(0);
    if (!codePoint) return 1;

    // Control characters and zero-width combining marks
    if (codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
    if (codePoint >= 0x0300 && codePoint <= 0x036f) return 0; // Combining diacritics
    if (codePoint >= 0x200b && codePoint <= 0x200f) return 0; // Zero-width spaces / marks
    if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) return 0; // Variation Selectors

    // CJK Ideographs and Fullwidth characters (Width 2)
    if (
      (codePoint >= 0x1100 && codePoint <= 0x115f) ||
      (codePoint >= 0x2329 && codePoint <= 0x232a) ||
      (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
      (codePoint >= 0x3040 && codePoint <= 0xa4cf) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd)
    ) {
      return 2;
    }

    // Emojis and graphic symbols (including ZWJ \u200D sequences)
    if (
      (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
      (codePoint >= 0x2600 && codePoint <= 0x27bf) ||
      grapheme.includes("\u200D")
    ) {
      return 2;
    }

    return 1;
  }

  public tokenize(input: string): AnsiToken[] {
    return VT100Parser.tokenize(input);
  }

  public static tokenize(input: string): AnsiToken[] {
    const tokens: AnsiToken[] = [];
    if (!input) return tokens;

    let idx = 0;
    const len = input.length;
    let textBuffer = "";

    while (idx < len) {
      if (input.charCodeAt(idx) === 0x1b) {
        if (textBuffer.length > 0) {
          tokens.push({ type: "text", raw: textBuffer, value: textBuffer });
          textBuffer = "";
        }

        const next = input[idx + 1];
        if (next === "[") {
          // CSI Sequence
          let endIdx = idx + 2;
          while (endIdx < len && !/[a-zA-Z]/.test(input[endIdx])) {
            endIdx++;
          }
          if (endIdx < len) {
            const raw = input.slice(idx, endIdx + 1);
            const value = input.slice(idx + 2, endIdx);
            tokens.push({ type: "csi", raw, value });
            idx = endIdx + 1;
            continue;
          }
        } else if (next === "]") {
          // OSC Sequence
          let endIdx = idx + 2;
          while (endIdx < len && input.charCodeAt(endIdx) !== 0x07 && input.slice(endIdx, endIdx + 2) !== "\x1b\\") {
            endIdx++;
          }
          const isBel = input.charCodeAt(endIdx) === 0x07;
          const endCut = isBel ? endIdx + 1 : endIdx + 2;
          const raw = input.slice(idx, Math.min(len, endCut));
          const value = input.slice(idx + 2, endIdx);
          tokens.push({ type: "osc", raw, value });
          idx = Math.min(len, endCut);
          continue;
        }

        // Isolated escape / other
        tokens.push({ type: "text", raw: "\x1b", value: "\x1b" });
        idx++;
      } else {
        textBuffer += input[idx];
        idx++;
      }
    }

    if (textBuffer.length > 0) {
      tokens.push({ type: "text", raw: textBuffer, value: textBuffer });
    }

    return tokens;
  }
}
