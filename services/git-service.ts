import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import { CommitInfo, CommitStats, RepoInfo } from "../types";

class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string = ".") {
    this.repoPath = path.resolve(repoPath);
    this.git = simpleGit(this.repoPath);
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCommitHistory(days: number = 30): Promise<CommitInfo[]> {
    const logs = await this.git.log({
      "--after": `${days} days ago`,
      format: {
        hash: "%H",
        date: "%aI",
        message: "%s",
        author_name: "%an",
        author_email: "%ae",
      },
    });

    return logs.all;
  }

  async getCurrentBranch(): Promise<string> {
    const branchSummary = await this.git.branch();
    return branchSummary.current;
  }

  async getStagedDiff(): Promise<string> {
    try {
      return await this.git.diff(["--staged"]);
    } catch (error) {
      return "";
    }
  }

  async getDiffFromBranch(base: string = "main"): Promise<string> {
    try {
      const currentBranch = await this.getCurrentBranch();
      return await this.git.diff([`${base}...${currentBranch}`]);
    } catch (error) {
      return "";
    }
  }

  async getModifiedFiles(): Promise<string[]> {
    try {
      const status = await this.git.status();
      return [
        ...status.modified,
        ...status.created,
        ...status.deleted,
        ...status.renamed.map(file => file.path),
      ];
    } catch (error) {
      return [];
    }
  }

  async getFileContent(filePath: string): Promise<string> {
    try {
      // Get the absolute path
      const absolutePath = path.join(this.repoPath, filePath);
      const content = await this.git.show([`HEAD:${filePath}`]);
      return content;
    } catch (error) {
      return "";
    }
  }

  async getCommitsBetween(from: string, to: string): Promise<CommitInfo[]> {
    try {
      const validFrom = await this.validateReference(from);
      const validTo = await this.validateReference(to);

      if (validFrom && validTo) {
        const logs = await this.git.log({
          from,
          to,
          format: {
            hash: "%H",
            date: "%aI",
            message: "%s",
            author_name: "%an",
            author_email: "%ae",
          },
        });
        return logs.all;
      } else if (validTo) {
        console.log(`Reference '${from}' not found. Using recent commits instead.`);
        return (await this.git.log({ maxCount: 10 })).all;
      } else {
        console.log(`Invalid references. Using most recent commit.`);
        return (await this.git.log({ maxCount: 1 })).all;
      }
    } catch (error) {
      console.log(`Error getting commits between refs: ${error}`);
      const logs = await this.git.log({ maxCount: 5 });
      return logs.all;
    }
  }

  async validateReference(ref: string): Promise<boolean> {
    try {
      await this.git.revparse(["--verify", ref]);
      return true;
    } catch (error) {
      return false;
    }
  }

  async analyzeCommitPatterns(days: number = 30): Promise<CommitStats> {
    const commits = await this.getCommitHistory(days);

    const commitsByDay: Record<string, number> = {};
    const commitsByHour: Record<string, number> = {};
    let totalMessageLength = 0;
    let minLength = Infinity;
    let maxLength = 0;

    // Initialize days of week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    days.forEach(day => commitsByDay[day] = 0);

    // Initialize hours
    for (let hour = 0; hour < 24; hour++) {
      commitsByHour[hour.toString()] = 0;
    }

    commits.forEach((commit) => {
      const date = new Date(commit.date);
      const day = days[date.getDay()];
      const hour = date.getHours().toString();

      // Count commits by day and hour
      commitsByDay[day] = (commitsByDay[day] || 0) + 1;
      commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;

      // Analyze message length
      const messageLength = commit.message.length;
      totalMessageLength += messageLength;
      minLength = Math.min(minLength, messageLength);
      maxLength = Math.max(maxLength, messageLength);
    });

    // Find most active day and hour
    let mostActiveDay = days[0];
    let mostActiveHour = "0";

    for (const day in commitsByDay) {
      if (commitsByDay[day] > commitsByDay[mostActiveDay]) {
        mostActiveDay = day;
      }
    }

    for (const hour in commitsByHour) {
      if (commitsByHour[hour] > commitsByHour[mostActiveHour]) {
        mostActiveHour = hour;
      }
    }

    return {
      total: commits.length,
      commitsByDay,
      commitsByHour,
      messageLength: {
        min: minLength === Infinity ? 0 : minLength,
        max: maxLength,
        avg: commits.length ? Math.round(totalMessageLength / commits.length) : 0,
      },
      mostActiveDay,
      mostActiveHour,
    };
  }

  async getRepoInfo(): Promise<RepoInfo> {
    const remote = await this.git.remote(["get-url", "origin"]).catch(() => "");
    const branches = await this.git.branch();

    let name = "local-repo";
    if (remote) {
      // Extract repo name from remote URL
      const matches = remote.match(/\/([^\/]+?)(\.git)?$/);
      if (matches && matches[1]) {
        name = matches[1];
      }
    }

    return {
      name,
      branches: branches.all.length,
      path: this.repoPath,
    };
  }
}

export const createGitService = (path: string = ".") => new GitService(path);