#!/usr/bin/env node

import { runCli } from "../src/cli.ts";

runCli().catch((err) => {
  console.error("Erro no IdeaBank:", err);
  process.exit(1);
});
