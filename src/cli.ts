import { randomUUID } from "node:crypto";
import { initDatabase } from "./storage/db.ts";
import { Repository } from "./storage/repository.ts";
import { IdeaBankServer } from "./server/http-server.ts";
import { GitHubExporter } from "./github/github-exporter.ts";
import type { Idea, IdeaCategory } from "./types.ts";

function parseArgs(args: string[]): { command: string; positional: string[]; options: Record<string, string> } {
  const command = args[0] || "help";
  const positional: string[] = [];
  const options: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        options[key] = next;
        i++;
      } else {
        options[key] = "true";
      }
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, options };
}

export async function runCli(): Promise<void> {
  const { command, positional, options } = parseArgs(process.argv.slice(2));
  const dbPath = options.db || process.env.IDEABANK_DB || "ideabank.db";
  const db = initDatabase(dbPath);
  const repo = new Repository(db);

  switch (command) {
    case "start": {
      const port = Number(options.port || process.env.PORT || 5050);
      const server = new IdeaBankServer(repo);

      const info = await server.listen(port);
      console.log("\n========================================================");
      console.log("💡 IdeaBank — Fullstack Web Platform & GitHub Sync");
      console.log("========================================================");
      console.log(`🌐 Aplicação Web / SPA : \x1b[36m${info.url}\x1b[0m`);
      console.log(`📡 API REST             : \x1b[32m${info.url}/api/ideas\x1b[0m`);
      console.log(`💾 Banco SQLite         : ${dbPath} (WAL Mode)`);
      console.log("--------------------------------------------------------");
      console.log("Pressione Ctrl+C para encerrar o servidor.");

      const shutdown = async () => {
        console.log("\nEncerrando IdeaBank...");
        await server.close();
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
      break;
    }

    case "list": {
      const sort = (options.sort as any) || "top";
      const category = options.category;
      const limit = Number(options.limit || 15);
      const ideas = repo.listIdeas({ sort, category, limit });

      console.log("\n========================================================");
      console.log(`📋 Demandas Registradas no IdeaBank (${ideas.length}):`);
      console.log("========================================================");

      if (ideas.length === 0) {
        console.log("Nenhuma demanda cadastrada ainda. Use 'ideabank create' ou inicie a aplicação.");
        return;
      }

      console.log(
        "ID".padEnd(20) +
        "VOTOS".padEnd(8) +
        "CATEGORIA".padEnd(14) +
        "TÍTULO"
      );
      console.log("-".repeat(75));

      for (const i of ideas) {
        const netVotes = i.upvotes - i.downvotes;
        const voteStr = netVotes >= 0 ? `+${netVotes}` : `${netVotes}`;
        console.log(
          i.id.slice(0, 18).padEnd(20) +
          `\x1b[32m${voteStr}\x1b[0m`.padEnd(16) +
          `[${i.category}]`.padEnd(14) +
          i.title
        );
      }
      break;
    }

    case "create": {
      const title = options.title;
      const category = (options.category || "dev-tools") as IdeaCategory;
      const problem = options.problem;
      const solution = options.solution;
      const audience = options.audience || "Desenvolvedores em geral";
      const author = options.author || "FelipeMadson";

      if (!title || !problem || !solution) {
        console.error("❌ Erro: Parâmetros obrigatórios: --title, --problem e --solution.");
        console.error("Exemplo: ideabank create --title 'CLI X' --problem 'Dor Y' --solution 'Solucao Z'");
        process.exit(1);
      }

      const newIdea: Idea = {
        id: `idea_${Date.now()}_${randomUUID().slice(0, 8)}`,
        title,
        category,
        problem_statement: problem,
        proposed_solution: solution,
        target_audience: audience,
        upvotes: 1,
        downvotes: 0,
        gravity_score: 0,
        status: "open",
        author_name: author
      };

      const created = repo.createIdea(newIdea);
      console.log("\n✔ Demanda registrada com sucesso no IdeaBank!");
      console.log(`  ID       : ${created.id}`);
      console.log(`  Título   : ${created.title}`);
      console.log(`  Categoria: ${created.category}`);
      break;
    }

    case "export-issue": {
      const id = positional[0];
      const repoTarget = options.repo || "FelipeMadson/ideabank";
      if (!id) {
        console.error("❌ Erro: Informe o ID da ideia. Exemplo: ideabank export-issue idea_123");
        process.exit(1);
      }

      const idea = repo.getIdeaById(id);
      if (!idea) {
        console.error(`❌ Erro: Ideia com ID "${id}" não encontrada.`);
        process.exit(1);
      }

      const exported = GitHubExporter.exportIssue(idea, repoTarget);
      console.log("\n========================================================");
      console.log(`🐙 Especificação Markdown para GitHub Issue: ${exported.title}`);
      console.log("========================================================\n");
      console.log(exported.markdownBody);
      console.log("\n--------------------------------------------------------");
      console.log("🔗 URL 1-Click para criação instantânea no GitHub:");
      console.log(`\x1b[36m${exported.oneClickUrl}\x1b[0m\n`);
      break;
    }

    case "stats": {
      const stats = repo.getStats();
      console.log("\n========================================================");
      console.log("📊 Estatísticas da Plataforma IdeaBank");
      console.log("========================================================");
      console.log(`Total de Demandas : ${stats.totalIdeas}`);
      console.log(`Total de Votos    : ${stats.totalVotes}`);
      console.log(`Total Comentários : ${stats.totalComments}`);
      console.log("\nPor Categoria:");
      for (const [k, v] of Object.entries(stats.ideasByCategory)) {
        console.log(`  - ${k.padEnd(14)}: ${v}`);
      }
      break;
    }

    case "clear": {
      repo.clearAll();
      console.log("✔ Histórico do IdeaBank limpo com sucesso.");
      break;
    }

    case "help":
    default: {
      console.log("\n========================================================");
      console.log("💡 IdeaBank — Plataforma Fullstack de Demandas & GitHub Sync");
      console.log("========================================================");
      console.log("Uso:");
      console.log("  ideabank start [--port 5050] [--db <path>]");
      console.log("  ideabank list [--category <c>] [--sort <top|new|wilson>]");
      console.log("  ideabank create --title <t> --category <c> --problem <p> --solution <s>");
      console.log("  ideabank export-issue <id> [--repo <owner/repo>]");
      console.log("  ideabank stats");
      console.log("  ideabank clear");
      console.log("  ideabank help\n");
      break;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  });
}
