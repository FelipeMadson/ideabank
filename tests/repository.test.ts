import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { initDatabase } from "../src/storage/db.ts";
import { Repository } from "../src/storage/repository.ts";
import type { Idea } from "../src/types.ts";

describe("Repository - Persistência SQLite WAL e Integridade de Votação", () => {
  let repo: Repository;

  beforeEach(() => {
    const db = initDatabase(":memory:");
    repo = new Repository(db);
  });

  it("deve criar e recuperar ideia mantendo atributos íntegros", () => {
    const newIdea: Idea = {
      id: "idea_test_1",
      title: "CLI de diagnóstico de redes locais",
      category: "dev-tools",
      problem_statement: "Desenvolvedores sofrem para checar portas e túneis",
      proposed_solution: "Um binário único em TypeScript nativo",
      target_audience: "Devs backend",
      upvotes: 1,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "FelipeMadson"
    };

    repo.createIdea(newIdea);
    const retrieved = repo.getIdeaById("idea_test_1");

    assert.ok(retrieved);
    assert.strictEqual(retrieved.id, "idea_test_1");
    assert.strictEqual(retrieved.title, newIdea.title);
    assert.strictEqual(retrieved.category, "dev-tools");
    assert.strictEqual(retrieved.upvotes, 1);
  });

  it("deve permitir voto e bloquear duplicidade pelo mesmo cliente (anti-spam)", () => {
    repo.createIdea({
      id: "idea_vote_test",
      title: "Teste de Votação",
      category: "web",
      problem_statement: "Problema X",
      proposed_solution: "Solução Y",
      target_audience: "Público Z",
      upvotes: 1,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "Felipe"
    });

    const clientFp = "client_hash_abcdef123";

    // 1. Primeiro voto positivo
    const firstVote = repo.castVote("idea_vote_test", clientFp, 1);
    assert.strictEqual(firstVote.success, true);
    assert.strictEqual(firstVote.netVotes, 2);

    // 2. Voto repetido deve falhar
    const duplicateVote = repo.castVote("idea_vote_test", clientFp, 1);
    assert.strictEqual(duplicateVote.success, false);
    assert.ok(duplicateVote.reason?.includes("já registrou"));

    // 3. Mudança de voto (de +1 para -1)
    const invertedVote = repo.castVote("idea_vote_test", clientFp, -1);
    assert.strictEqual(invertedVote.success, true);
    // Voto foi invertido: upvotes decrementou de 2 para 1, downvotes incrementou para 1 -> netVotes = 0
    assert.strictEqual(invertedVote.netVotes, 0);
  });

  it("deve filtrar ideias por categoria e realizar buscas parciais de texto", () => {
    repo.createIdea({
      id: "idea_sec",
      title: "Scanner de Secrets em Commits",
      category: "security",
      problem_statement: "Vazamento acidental de chaves de API",
      proposed_solution: "Hook local pré-commit",
      target_audience: "Devs",
      upvotes: 5,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "Felipe"
    });

    repo.createIdea({
      id: "idea_web",
      title: "Plataforma de E-commerce Serverless",
      category: "web",
      problem_statement: "Custos fixos de infraestrutura",
      proposed_solution: "Edge functions",
      target_audience: "Lojistas",
      upvotes: 2,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "Felipe"
    });

    // Filtro por categoria
    const secOnly = repo.listIdeas({ category: "security" });
    assert.strictEqual(secOnly.length, 1);
    assert.strictEqual(secOnly[0].id, "idea_sec");

    // Busca textual
    const searchResult = repo.listIdeas({ search: "Secrets" });
    assert.strictEqual(searchResult.length, 1);
    assert.strictEqual(searchResult[0].id, "idea_sec");
  });

  it("deve permitir adicionar e recuperar comentários associados", () => {
    repo.createIdea({
      id: "idea_cmt",
      title: "Ideia com comentários",
      category: "automation",
      problem_statement: "Prob",
      proposed_solution: "Sol",
      target_audience: "Aud",
      upvotes: 1,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "Felipe"
    });

    repo.addComment("idea_cmt", "Lucas", "Excelente ideia, podemos usar Node.js nativo.");
    const comments = repo.getComments("idea_cmt");

    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].author_name, "Lucas");
    assert.ok(comments[0].comment_text.includes("Node.js"));
  });

  it("deve computar estatísticas da plataforma com agrupamento", () => {
    repo.createIdea({
      id: "i1",
      title: "Ideia 1",
      category: "web",
      problem_statement: "P1",
      proposed_solution: "S1",
      target_audience: "A1",
      upvotes: 1,
      downvotes: 0,
      gravity_score: 0,
      status: "open",
      author_name: "Felipe"
    });

    const stats = repo.getStats();
    assert.strictEqual(stats.totalIdeas, 1);
    assert.strictEqual(stats.ideasByCategory["web"], 1);
    assert.strictEqual(stats.ideasByStatus["open"], 1);
  });
});
