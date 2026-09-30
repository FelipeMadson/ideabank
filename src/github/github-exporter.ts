import type { Idea, GitHubIssueExport } from "../types.ts";

/**
 * Exportador de Especificações e Sincronizador de Issues com o GitHub.
 */
export class GitHubExporter {
  /**
   * Converte uma ideia em um documento Markdown formatado para GitHub Issue / RFC.
   */
  public static buildMarkdownIssue(idea: Idea): string {
    return [
      `## 💡 Problema & Motivação`,
      idea.problem_statement,
      ``,
      `**Público-Alvo Beneficiado:**`,
      `> ${idea.target_audience}`,
      ``,
      `## 🛠️ Solução Proposta`,
      idea.proposed_solution,
      ``,
      `## 📋 Critérios de Aceite para Implementação`,
      `- [ ] Validar arquitetura técnica e viabilidade de implementação`,
      `- [ ] Criar especificações de API e modelo de dados`,
      `- [ ] Desenvolver suíte automatizada de testes cobrindo o fluxo principal`,
      `- [ ] Elaborar documentação técnica com exemplos de uso no README`,
      ``,
      `---`,
      `*Categoria:* \`${idea.category}\` | *Votos na Comunidade:* \`+${idea.upvotes - idea.downvotes}\` (\`${idea.upvotes}\` up / \`${idea.downvotes}\` down)`,
      `*Registrado originalmente no [IdeaBank](https://github.com/FelipeMadson/ideabank) por @${idea.author_name}*`
    ].join("\n");
  }

  /**
   * Retorna as etiquetas (labels) recomendadas para a issue no GitHub com base na categoria.
   */
  public static getSuggestedLabels(idea: Idea): string[] {
    const labels = ["rfc", "enhancement", "community-idea"];
    switch (idea.category) {
      case "dev-tools":
        labels.push("developer-experience");
        break;
      case "web":
        labels.push("web-app");
        break;
      case "security":
        labels.push("security");
        break;
      case "automation":
        labels.push("automation");
        break;
      case "ai-applied":
        labels.push("ai");
        break;
    }
    return labels;
  }

  /**
   * Constrói a URL 1-Click do GitHub para abrir a tela de criação de issue com os campos pré-preenchidos.
   */
  public static generateOneClickUrl(idea: Idea, repoTarget: string = "FelipeMadson/ideabank"): string {
    const cleanRepo = repoTarget.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    const title = `[RFC] ${idea.title}`;
    const body = this.buildMarkdownIssue(idea);
    const labels = this.getSuggestedLabels(idea).join(",");

    const params = new URLSearchParams({
      title,
      body,
      labels
    });

    return `https://github.com/${cleanRepo}/issues/new?${params.toString()}`;
  }

  /**
   * Exporta a estrutura completa pronta para consumo ou visualização.
   */
  public static exportIssue(idea: Idea, repoTarget?: string): GitHubIssueExport {
    const title = `[RFC] ${idea.title}`;
    const markdownBody = this.buildMarkdownIssue(idea);
    const suggestedLabels = this.getSuggestedLabels(idea);
    const oneClickUrl = this.generateOneClickUrl(idea, repoTarget);

    return {
      title,
      markdownBody,
      suggestedLabels,
      oneClickUrl
    };
  }

  /**
   * Sincronização direta com a API do GitHub caso um token (PAT) seja fornecido.
   */
  public static async syncToGitHubApi(
    idea: Idea,
    repoTarget: string,
    githubToken: string
  ): Promise<{ success: boolean; issueUrl?: string; error?: string }> {
    const cleanRepo = repoTarget.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
    const url = `https://api.github.com/repos/${cleanRepo}/issues`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "IdeaBank-Sync/1.0.0"
        },
        body: JSON.stringify({
          title: `[RFC] ${idea.title}`,
          body: this.buildMarkdownIssue(idea),
          labels: this.getSuggestedLabels(idea)
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `GitHub API error (${res.status}): ${errText}` };
      }

      const data = await res.json();
      return { success: true, issueUrl: data.html_url };
    } catch (err: any) {
      return { success: false, error: err.message || "Falha de rede ao conectar à API do GitHub" };
    }
  }
}
