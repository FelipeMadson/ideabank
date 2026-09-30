import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  AnsiDoubleBuffer,
  CellFlags,
  VT100Parser,
  CursorInterpolator
} from "../src/engines/cli-renderer/index.ts";

describe("CLI-Renderer Engine — High-Fidelity Rigor Suite", () => {
  describe("1. VT100 / xterm Sequence Parser", () => {
    test("Deve remover sequencias ANSI CSI e OSC sem alterar o texto", () => {
      const input = "\x1b[31;1mHello\x1b[0m \x1b]0;Title\x07World\x1b[2K!";
      const stripped = VT100Parser.stripAnsi(input);
      assert.strictEqual(stripped, "Hello World!");
    });

    test("Deve calcular largura visual correta para Emojis", () => {
      assert.strictEqual(VT100Parser.visualWidth("🚀"), 2);
      assert.strictEqual(VT100Parser.visualWidth("\x1b[34m🚀 Test\x1b[0m"), 7);
    });
  });

  describe("2. Real-Time Cursor Interpolator", () => {
    test("Interpolacao linear alcanca destino", () => {
      const interpolator = new CursorInterpolator({ col: 0, row: 0 });
      interpolator.setTarget({ col: 10, row: 20 }, 100, "linear");
      const t100 = interpolator.update(100);
      assert.deepStrictEqual(t100.current, { col: 10, row: 20 });
      assert.strictEqual(t100.isComplete, true);
    });
  });

  describe("3. ANSI Double-Buffering Render Canvas", () => {
    test("Diffing gera delta vazio em quadros identicos", () => {
      const buffer = new AnsiDoubleBuffer({ cols: 20, rows: 5 });
      buffer.writeString(0, 0, "Constante");
      buffer.flush();
      assert.strictEqual(buffer.flush(), "");
    });
  });
});
