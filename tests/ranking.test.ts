import { describe, it } from "node:test";
import assert from "node:assert";
import { RankingEngine } from "../src/ranking/ranking-engine.ts";

describe("RankingEngine - Algoritmos de Relevância Gravitacional e Wilson Score", () => {
  it("deve atribuir maior pontuação para ideias recentes com mesmo número de votos", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    const createdJustNow = new Date("2026-09-29T11:00:00Z"); // 1 hora atrás
    const createdYesterday = new Date("2026-09-28T12:00:00Z"); // 24 horas atrás

    const scoreRecent = RankingEngine.calculateGravityScore(10, 0, createdJustNow, now);
    const scoreOld = RankingEngine.calculateGravityScore(10, 0, createdYesterday, now);

    assert.ok(
      scoreRecent > scoreOld,
      `Esperado que recente (${scoreRecent}) seja maior que antigo (${scoreOld})`
    );
  });

  it("deve permitir que ideias antigas continuem relevantes se acumularem volume expressivo de votos", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    const createdYesterday = new Date("2026-09-28T12:00:00Z"); // 24h atrás
    const createdJustNow = new Date("2026-09-29T11:00:00Z"); // 1h atrás

    // Ideia de ontem com 500 votos vs ideia de 1h atrás com 2 votos
    const scoreViralOld = RankingEngine.calculateGravityScore(500, 0, createdYesterday, now);
    const scoreLowRecent = RankingEngine.calculateGravityScore(2, 0, createdJustNow, now);

    assert.ok(scoreViralOld > scoreLowRecent);
  });

  it("deve calcular pontuação negativa de forma proporcional para ideias com mais downvotes que upvotes", () => {
    const now = new Date();
    const scoreNegative = RankingEngine.calculateGravityScore(1, 10, now, now);
    assert.ok(scoreNegative < 0);
  });

  it("Wilson Score deve priorizar ideias com amostra estatística confiável", () => {
    // 100 upvotes e 5 downvotes (95% aprovação em 105 votos)
    const strongConsensus = RankingEngine.calculateWilsonScore(100, 5);
    // 1 upvote e 0 downvotes (100% aprovação mas apenas 1 voto)
    const singleVote = RankingEngine.calculateWilsonScore(1, 0);

    assert.ok(
      strongConsensus > singleVote,
      `Esperado que consenso consolidado (${strongConsensus}) supere voto único (${singleVote})`
    );
  });
});
