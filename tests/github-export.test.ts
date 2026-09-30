import { describe, it } from "node:test";
import assert from "node:assert";
import { GitHubExporter } from "../src/github/github-exporter.ts";
import type { Idea } from "../src/types.ts";

describe("GitHubExporter - Geração de Especificações e Issues do GitHub", () => {
  const sampleIdea: Idea = {
    id: "idea_sample_42",
    title: "Validador Automático de Certificados SSL",
    category: "security",
    problem_statement: "Certificados TLS expiram sem aviso prévio em microserviços",
    proposed_solution: "Um daemon ultraleve que audita domínios e avisa via webhook",
    target_audience: "Engenheiros de SRE e DevOps",
    upvotes: 15,
    downvotes: 1,
    gravity_score: 3.4,
    status: "open",
    author_name: "FelipeMadson"
  };

  it("deve gerar Markdown estruturado com seções de contexto, solução e critérios de aceite", () => {
    const md = GitHubExporter.buildMarkdownIssue(sampleIdea);

    assert.ok(md.includes("## 💡 Problema & Motivação"));
    assert.ok(md.includes(sampleIdea.problem_statement));
    assert.ok(md.includes(sampleIdea.proposed_solution));
    assert.ok(md.includes(sampleIdea.target_audience));
    assert.ok(md.includes("Critérios de Aceite"));
    assert.ok(md.includes("@FelipeMadson"));
  });

  it("deve atribuir labels coerentes com a categoria da ideia", () => {
    const labels = GitHubExporter.getSuggestedLabels(sampleIdea);
    assert.ok(labels.includes("rfc"));
    assert.ok(labels.includes("security"));
  });

  it("deve gerar URL 1-Click válida com parâmetros codificados para o GitHub", () => {
    const url = GitHubExporter.generateOneClickUrl(sampleIdea, "FelipeMadson/ideabank");

    assert.ok(url.startsWith("https://github.com/FelipeMadson/ideabank/issues/new?"));
    assert.ok(url.includes("title=%5BRFC%5D"));
    assert.ok(url.includes("labels="));
  });

  it("exportIssue deve retornar objeto completo com title, markdown e oneClickUrl", () => {
    const exported = GitHubExporter.exportIssue(sampleIdea);

    assert.strictEqual(exported.title, "[RFC] Validador Automático de Certificados SSL");
    assert.ok(exported.markdownBody.length > 50);
    assert.ok(exported.oneClickUrl.includes("github.com"));
    assert.ok(Array.isArray(exported.suggestedLabels));
  });
});
