import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { initDatabase } from "../src/storage/db.ts";
import { Repository } from "../src/storage/repository.ts";
import { IdeaBankServer } from "../src/server/http-server.ts";

describe("IdeaBankServer - API REST e Entrega da SPA Web", () => {
  let server: IdeaBankServer;
  let baseUrl: string;
  let repo: Repository;

  before(async () => {
    const db = initDatabase(":memory:");
    repo = new Repository(db);
    server = new IdeaBankServer(repo);

    const info = await server.listen(0, "127.0.0.1");
    baseUrl = info.url;
  });

  after(async () => {
    await server.close();
  });

  it("GET / deve servir a SPA web em HTML5 responsivo", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get("content-type") || "";
    assert.ok(contentType.includes("text/html"));

    const html = await res.text();
    assert.ok(html.includes("IdeaBank"));
    assert.ok(html.includes("Local-First"));
    assert.ok(html.includes("fetchIdeas"));
  });

  it("POST /api/ideas deve criar nova demanda e retornar HTTP 201", async () => {
    const payload = {
      title: "CLI de inspeção de webhooks",
      category: "dev-tools",
      problem_statement: "Depuração de webhooks na nuvem é demorada",
      proposed_solution: "Servidor local com HMAC e replay",
      target_audience: "Desenvolvedores backend",
      author_name: "FelipeMadson"
    };

    const res = await fetch(`${baseUrl}/api/ideas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const created = await res.json();
    assert.ok(created.id.startsWith("idea_"));
    assert.strictEqual(created.title, payload.title);
    assert.strictEqual(created.upvotes, 1);
  });

  it("GET /api/ideas deve listar ideias cadastradas", async () => {
    const res = await fetch(`${baseUrl}/api/ideas`);
    assert.strictEqual(res.status, 200);
    const list = await res.json();

    assert.ok(Array.isArray(list));
    assert.ok(list.length >= 1);
  });

  it("POST /api/ideas/:id/vote deve registrar voto e computar novo saldo", async () => {
    const listRes = await fetch(`${baseUrl}/api/ideas`);
    const list = await listRes.json();
    const ideaId = list[0].id;

    const voteRes = await fetch(`${baseUrl}/api/ideas/${ideaId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType: 1 })
    });

    assert.strictEqual(voteRes.status, 200);
    const voteData = await voteRes.json();
    assert.strictEqual(voteData.success, true);
    assert.strictEqual(voteData.netVotes, 2);
  });

  it("POST /api/ideas/:id/comments e GET /api/ideas/:id/comments devem registrar e recuperar comentários", async () => {
    const listRes = await fetch(`${baseUrl}/api/ideas`);
    const list = await listRes.json();
    const ideaId = list[0].id;

    const postCommentRes = await fetch(`${baseUrl}/api/ideas/${ideaId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_name: "Aline", comment_text: "Excelente ideia!" })
    });
    assert.strictEqual(postCommentRes.status, 201);

    const getCommentsRes = await fetch(`${baseUrl}/api/ideas/${ideaId}/comments`);
    assert.strictEqual(getCommentsRes.status, 200);
    const comments = await getCommentsRes.json();

    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].author_name, "Aline");
  });

  it("GET /api/ideas/:id/export-issue deve retornar especificação e URL 1-click", async () => {
    const listRes = await fetch(`${baseUrl}/api/ideas`);
    const list = await listRes.json();
    const ideaId = list[0].id;

    const res = await fetch(`${baseUrl}/api/ideas/${ideaId}/export-issue?repo=FelipeMadson/ideabank`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();

    assert.ok(data.title.includes("[RFC]"));
    assert.ok(data.markdownBody.includes("Problema & Motivação"));
    assert.ok(data.oneClickUrl.includes("github.com/FelipeMadson/ideabank/issues/new"));
  });

  it("GET /api/stats deve retornar métricas da plataforma", async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.strictEqual(res.status, 200);
    const stats = await res.json();

    assert.ok(stats.totalIdeas >= 1);
    assert.ok(stats.totalVotes >= 1);
  });

  it("DELETE /api/ideas deve esvaziar a base de dados com sucesso", async () => {
    const delRes = await fetch(`${baseUrl}/api/ideas`, { method: "DELETE" });
    assert.strictEqual(delRes.status, 200);

    const listRes = await fetch(`${baseUrl}/api/ideas`);
    const list = await listRes.json();
    assert.strictEqual(list.length, 0);
  });
});
