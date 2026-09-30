/**
 * Tipagens do IdeaBank.
 */

export type IdeaCategory = "web" | "dev-tools" | "automation" | "security" | "ai-applied";

export type IdeaStatus = "open" | "in_progress" | "implemented" | "archived";

export interface Idea {
  id: string;
  title: string;
  category: IdeaCategory;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  upvotes: number;
  downvotes: number;
  gravity_score: number;
  status: IdeaStatus;
  github_issue_url?: string;
  author_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vote {
  id: string;
  idea_id: string;
  client_fingerprint: string;
  vote_type: 1 | -1;
  created_at?: string;
}

export interface Comment {
  id: string;
  idea_id: string;
  author_name: string;
  comment_text: string;
  created_at?: string;
}

export interface GitHubIssueExport {
  title: string;
  markdownBody: string;
  suggestedLabels: string[];
  oneClickUrl: string;
}

export interface PlatformStats {
  totalIdeas: number;
  totalVotes: number;
  totalComments: number;
  ideasByStatus: Record<string, number>;
  ideasByCategory: Record<string, number>;
}
