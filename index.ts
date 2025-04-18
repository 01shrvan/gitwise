export interface CommitInfo {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

export interface CommitStats {
  total: number;
  commitsByDay: Record<string, number>;
  commitsByHour: Record<string, number>;
  messageLength: {
    min: number;
    max: number;
    avg: number;
  };
  mostActiveDay: string;
  mostActiveHour: string;
}

export interface RepoInfo {
  name: string;
  branches: number;
  path: string;
}

export interface AnalyzeOptions {
  days: number;
  path: string;
  compact: boolean;
  interactive?: boolean;
}

export interface CommitHelpOptions {
  path: string;
}

export interface PRDescriptionOptions {
  path: string;
  base: string;
}

export interface ReleaseNotesOptions {
  path: string;
  from: string;
  to: string;
  count: number;
}