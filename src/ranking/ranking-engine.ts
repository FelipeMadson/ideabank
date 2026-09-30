/**
 * Motor de Ranking Gravitacional e Algoritmos de Relevância do IdeaBank.
 * Baseado no algoritmo de gravidade do Hacker News / Reddit e Wilson Score.
 */
export class RankingEngine {
  /**
   * Calcula a pontuação de relevância temporal com decaimento gravitacional.
   * Score = (NetVotes - 1) / (AgeInHours + 2)^Gravity
   *
   * @param upvotes Quantidade de votos positivos
   * @param downvotes Quantidade de votos negativos
   * @param createdAt Data ISO de criação da ideia
   * @param now Data de referência (padrão Date.now())
   * @param gravity Expoente gravitacional (padrão 1.5)
   */
  public static calculateGravityScore(
    upvotes: number,
    downvotes: number,
    createdAt: string | Date,
    now: Date = new Date(),
    gravity: number = 1.5
  ): number {
    const createdDate = new Date(createdAt);
    const ageMs = Math.max(0, now.getTime() - createdDate.getTime());
    const ageInHours = ageMs / (1000 * 60 * 60);

    const netVotes = upvotes - downvotes;
    const numerator = netVotes - 1;
    const denominator = Math.pow(ageInHours + 2, gravity);

    const score = numerator / denominator;
    return Number(score.toFixed(4));
  }

  /**
   * Calcula o limite inferior do intervalo de confiança de Wilson (95%).
   * Usado para classificar itens por taxa de aprovação pura sem viés de amostras pequenas.
   */
  public static calculateWilsonScore(upvotes: number, downvotes: number): number {
    const total = upvotes + downvotes;
    if (total === 0) return 0;

    const z = 1.96; // 95% de confiança
    const phat = upvotes / total;

    const numerator =
      phat +
      (z * z) / (2 * total) -
      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
    const denominator = 1 + (z * z) / total;

    return Number((numerator / denominator).toFixed(4));
  }
}
