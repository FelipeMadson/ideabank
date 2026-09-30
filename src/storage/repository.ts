import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { RankingEngine } from "../ranking/ranking-engine.ts";
import type { Idea, IdeaCategory, IdeaStatus, Comment, PlatformStats } from "../types.ts";

/**
 * Repositório de persistência SQLite do IdeaBank.
 */
export class Repository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  public createIdea(idea: Idea): Idea {
    const gravity = RankingEngine.calculateGravityScore(
      idea.upvotes ?? 1,
      idea.downvotes ?? 0,
      idea.created_at || new Date().toISOString()
    );

    const stmt = this.db.prepare(`
      INSERT INTO ideas (
        id, title, category, problem_statement, proposed_solution, target_audience,
        upvotes, downvotes, gravity_score, status, github_issue_url, author_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    `);

    stmt.run(
      idea.id,
      idea.title,
      idea.category,
      idea.problem_statement,
      idea.proposed_solution,
      idea.target_audience,
      idea.upvotes ?? 1,
      idea.downvotes ?? 0,
      gravity,
      idea.status ?? "open",
      idea.github_issue_url || null,
      idea.author_name || "Anônimo",
      idea.created_at || null
    );

    return this.getIdeaById(idea.id)!;
  }

  public getIdeaById(id: string): Idea | null {
    const stmt = this.db.prepare("SELECT * FROM ideas WHERE id = ?");
    const row = stmt.get(id) as any;
    if (!row) return null;

    return this.mapIdeaRow(row);
  }

  public listIdeas(options?: {
    category?: string;
    status?: string;
    search?: string;
    sort?: "top" | "new" | "wilson";
    limit?: number;
    offset?: number;
  }): Idea[] {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sort = options?.sort ?? "top";

    let query = "SELECT * FROM ideas WHERE 1=1";
    const params: any[] = [];

    if (options?.category && options.category !== "all") {
      query += " AND category = ?";
      params.push(options.category);
    }

    if (options?.status && options.status !== "all") {
      query += " AND status = ?";
      params.push(options.status);
    }

    if (options?.search) {
      query += " AND (title LIKE ? OR problem_statement LIKE ? OR proposed_solution LIKE ?)";
      const term = `%${options.search}%`;
      params.push(term, term, term);
    }

    if (sort === "new") {
      query += " ORDER BY created_at DESC";
    } else {
      query += " ORDER BY gravity_score DESC, (upvotes - downvotes) DESC";
    }

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    const ideas = rows.map((r) => this.mapIdeaRow(r));

    if (sort === "wilson") {
      ideas.sort(
        (a, b) =>
          RankingEngine.calculateWilsonScore(b.upvotes, b.downvotes) -
          RankingEngine.calculateWilsonScore(a.upvotes, a.downvotes)
      );
    }

    return ideas;
  }

  public castVote(
    ideaId: string,
    clientFingerprint: string,
    voteType: 1 | -1
  ): { success: boolean; netVotes: number; reason?: string } {
    const idea = this.getIdeaById(ideaId);
    if (!idea) {
      return { success: false, netVotes: 0, reason: "Ideia não encontrada" };
    }

    // Verificar se o cliente já votou
    const existingVoteStmt = this.db.prepare(
      "SELECT * FROM votes WHERE idea_id = ? AND client_fingerprint = ?"
    );
    const existing = existingVoteStmt.get(ideaId, clientFingerprint) as any;

    if (existing) {
      if (existing.vote_type === voteType) {
        return {
          success: false,
          netVotes: idea.upvotes - idea.downvotes,
          reason: "Você já registrou este voto nesta ideia."
        };
      } else {
        // Inverte o voto anterior
        this.db
          .prepare("UPDATE votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(voteType, existing.id);

        if (voteType === 1) {
          idea.upvotes += 1;
          idea.downvotes = Math.max(0, idea.downvotes - 1);
        } else {
          idea.downvotes += 1;
          idea.upvotes = Math.max(0, idea.upvotes - 1);
        }
      }
    } else {
      // Novo voto
      const voteId = `vote_${Date.now()}_${randomUUID().slice(0, 8)}`;
      this.db
        .prepare("INSERT INTO votes (id, idea_id, client_fingerprint, vote_type) VALUES (?, ?, ?, ?)")
        .run(voteId, ideaId, clientFingerprint, voteType);

      if (voteType === 1) {
        idea.upvotes += 1;
      } else {
        idea.downvotes += 1;
      }
    }

    const newGravity = RankingEngine.calculateGravityScore(
      idea.upvotes,
      idea.downvotes,
      idea.created_at || new Date().toISOString()
    );

    this.db
      .prepare(
        "UPDATE ideas SET upvotes = ?, downvotes = ?, gravity_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(idea.upvotes, idea.downvotes, newGravity, ideaId);

    return {
      success: true,
      netVotes: idea.upvotes - idea.downvotes
    };
  }

  public addComment(ideaId: string, authorName: string, text: string): Comment {
    const commentId = `cmt_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const stmt = this.db.prepare(`
      INSERT INTO comments (id, idea_id, author_name, comment_text, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(commentId, ideaId, authorName.trim() || "Anônimo", text.trim());

    return {
      id: commentId,
      idea_id: ideaId,
      author_name: authorName.trim() || "Anônimo",
      comment_text: text.trim(),
      created_at: new Date().toISOString()
    };
  }

  public getComments(ideaId: string): Comment[] {
    const stmt = this.db.prepare(
      "SELECT * FROM comments WHERE idea_id = ? ORDER BY created_at ASC"
    );
    const rows = stmt.all(ideaId) as any[];

    return rows.map((r) => ({
      id: r.id,
      idea_id: r.idea_id,
      author_name: r.author_name,
      comment_text: r.comment_text,
      created_at: r.created_at
    }));
  }

  public updateIdeaStatus(id: string, status: IdeaStatus, githubIssueUrl?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE ideas 
      SET status = ?, 
          github_issue_url = COALESCE(?, github_issue_url), 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const info = stmt.run(status, githubIssueUrl || null, id);
    return (info.changes || 0) > 0;
  }

  public recalculateAllScores(): void {
    const ideas = this.listIdeas({ limit: 10000 });
    const now = new Date();
    const stmt = this.db.prepare("UPDATE ideas SET gravity_score = ? WHERE id = ?");

    for (const idea of ideas) {
      const g = RankingEngine.calculateGravityScore(
        idea.upvotes,
        idea.downvotes,
        idea.created_at || now.toISOString(),
        now
      );
      stmt.run(g, idea.id);
    }
  }

  public getStats(): PlatformStats {
    const totalIdeas = (this.db.prepare("SELECT COUNT(*) as count FROM ideas").get() as any)?.count || 0;
    const totalVotes = (this.db.prepare("SELECT COUNT(*) as count FROM votes").get() as any)?.count || 0;
    const totalComments = (this.db.prepare("SELECT COUNT(*) as count FROM comments").get() as any)?.count || 0;

    const statusRows = this.db
      .prepare("SELECT status, COUNT(*) as count FROM ideas GROUP BY status")
      .all() as any[];
    const ideasByStatus: Record<string, number> = {};
    for (const r of statusRows) {
      ideasByStatus[r.status] = r.count;
    }

    const catRows = this.db
      .prepare("SELECT category, COUNT(*) as count FROM ideas GROUP BY category")
      .all() as any[];
    const ideasByCategory: Record<string, number> = {};
    for (const r of catRows) {
      ideasByCategory[r.category] = r.count;
    }

    return {
      totalIdeas,
      totalVotes,
      totalComments,
      ideasByStatus,
      ideasByCategory
    };
  }

  public clearAll(): void {
    this.db.exec("DELETE FROM comments; DELETE FROM votes; DELETE FROM ideas;");
  }

  private mapIdeaRow(row: any): Idea {
    return {
      id: row.id,
      title: row.title,
      category: row.category as IdeaCategory,
      problem_statement: row.problem_statement,
      proposed_solution: row.proposed_solution,
      target_audience: row.target_audience,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      gravity_score: row.gravity_score,
      status: row.status as IdeaStatus,
      github_issue_url: row.github_issue_url || undefined,
      author_name: row.author_name,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}
