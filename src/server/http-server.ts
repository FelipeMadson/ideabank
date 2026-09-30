import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { URL } from "node:url";
import { GitHubExporter } from "../github/github-exporter.ts";
import { getIdeaBankSpaHtml } from "../ui/spa-html.ts";
import type { Repository } from "../storage/repository.ts";
import type { Idea, IdeaCategory } from "../types.ts";

/**
 * Servidor HTTP Nativo e API REST do IdeaBank.
 */
export class IdeaBankServer {
  private repo: Repository;
  private server: Server | null = null;

  constructor(repo: Repository) {
    this.repo = repo;
  }

  public listen(port: number = 5050, host: string = "0.0.0.0"): Promise<{ port: number; url: string }> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => this.handleRequest(req, res));

      this.server.on("error", (err) => {
        reject(err);
      });

      this.server.listen(port, host, () => {
        const addr = this.server?.address();
        const actualPort = typeof addr === "object" && addr ? addr.port : port;
        const url = `http://localhost:${actualPort}`;
        resolve({ port: actualPort, url });
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const rawUrl = req.url || "/";
    const hostHeader = req.headers.host || "localhost";
    const parsedUrl = new URL(rawUrl, `http://${hostHeader}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method || "GET").toUpperCase();

    // 1. SPA Web Frontend
    if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(getIdeaBankSpaHtml());
      return;
    }

    // 2. API REST: /api/ideas
    if (pathname === "/api/ideas") {
      if (method === "GET") {
        const category = parsedUrl.searchParams.get("category") || undefined;
        const status = parsedUrl.searchParams.get("status") || undefined;
        const search = parsedUrl.searchParams.get("search") || undefined;
        const sort = (parsedUrl.searchParams.get("sort") as any) || "top";
        const limit = Number(parsedUrl.searchParams.get("limit")) || 50;
        const offset = Number(parsedUrl.searchParams.get("offset")) || 0;

        const ideas = this.repo.listIdeas({ category, status, search, sort, limit, offset });
        this.sendJson(res, 200, ideas);
        return;
      }

      if (method === "POST") {
        const body = await this.readBodyAsJson(req);
        if (!body.title || !body.problem_statement || !body.proposed_solution) {
          this.sendJson(res, 400, {
            error: "Campos obrigatórios ausentes: title, problem_statement, proposed_solution"
          });
          return;
        }

        const newIdea: Idea = {
          id: `idea_${Date.now()}_${randomUUID().slice(0, 8)}`,
          title: String(body.title).trim(),
          category: (body.category || "dev-tools") as IdeaCategory,
          problem_statement: String(body.problem_statement).trim(),
          proposed_solution: String(body.proposed_solution).trim(),
          target_audience: String(body.target_audience || "Desenvolvedores em geral").trim(),
          upvotes: 1,
          downvotes: 0,
          gravity_score: 0,
          status: "open",
          author_name: String(body.author_name || "Anônimo").trim()
        };

        const created = this.repo.createIdea(newIdea);
        this.sendJson(res, 201, created);
        return;
      }

      if (method === "DELETE") {
        this.repo.clearAll();
        this.sendJson(res, 200, { status: "cleared" });
        return;
      }
    }

    // 3. API REST: /api/ideas/:id/...
    if (pathname.startsWith("/api/ideas/")) {
      const parts = pathname.split("/").filter(Boolean); // ['api', 'ideas', ':id', subaction?]
      const ideaId = parts[2];
      const subAction = parts[3];

      if (!subAction && method === "GET") {
        const idea = this.repo.getIdeaById(ideaId);
        if (!idea) {
          this.sendJson(res, 404, { error: "Ideia não encontrada" });
          return;
        }
        this.sendJson(res, 200, idea);
        return;
      }

      if (subAction === "vote" && method === "POST") {
        const body = await this.readBodyAsJson(req);
        const voteType = body.voteType === -1 ? -1 : 1;
        const fingerprint = this.getClientFingerprint(req);

        const result = this.repo.castVote(ideaId, fingerprint, voteType);
        this.sendJson(res, result.success ? 200 : 400, result);
        return;
      }

      if (subAction === "comments") {
        if (method === "GET") {
          const comments = this.repo.getComments(ideaId);
          this.sendJson(res, 200, comments);
          return;
        }

        if (method === "POST") {
          const body = await this.readBodyAsJson(req);
          if (!body.comment_text) {
            this.sendJson(res, 400, { error: "comment_text é obrigatório" });
            return;
          }
          const created = this.repo.addComment(ideaId, body.author_name || "Anônimo", body.comment_text);
          this.sendJson(res, 201, created);
          return;
        }
      }

      if (subAction === "export-issue" && method === "GET") {
        const idea = this.repo.getIdeaById(ideaId);
        if (!idea) {
          this.sendJson(res, 404, { error: "Ideia não encontrada" });
          return;
        }

        const repoTarget = parsedUrl.searchParams.get("repo") || "FelipeMadson/ideabank";
        const exported = GitHubExporter.exportIssue(idea, repoTarget);
        this.sendJson(res, 200, exported);
        return;
      }
    }

    // 4. API REST: /api/stats
    if (pathname === "/api/stats" && method === "GET") {
      const stats = this.repo.getStats();
      this.sendJson(res, 200, stats);
      return;
    }

    // Rota desconhecida
    this.sendJson(res, 404, { error: "Endpoint não encontrado", path: pathname });
  }

  private getClientFingerprint(req: IncomingMessage): string {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "unknown_agent";
    return createHash("sha256").update(`${ip}::${userAgent}`).digest("hex").slice(0, 16);
  }

  private readBodyAsString(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", (err) => reject(err));
    });
  }

  private async readBodyAsJson(req: IncomingMessage): Promise<any> {
    const raw = await this.readBodyAsString(req);
    try {
      return JSON.parse(raw || "{}");
    } catch {
      return {};
    }
  }

  private sendJson(res: ServerResponse, status: number, data: any): void {
    const payload = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(payload),
      "Access-Control-Allow-Origin": "*"
    });
    res.end(payload);
  }
}
