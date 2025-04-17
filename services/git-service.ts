import simpleGit, { SimpleGit } from "simple-git";

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

class GitService {
  private git: SimpleGit;

  constructor(path: string = ".") {
    this.git = simpleGit(path);
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
    // Use git-friendly date format
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

  async getCommitsBetween(from: string, to: string): Promise<CommitInfo[]> {
    try {
      // First check if the references exist
      const validFrom = await this.validateReference(from);
      const validTo = await this.validateReference(to);

      let range = "";

      if (validFrom && validTo) {
        // Both references are valid, use the range
        range = `${from}...${to}`;
      } else if (validTo) {
        // Only 'to' is valid, get recent commits instead
        console.log(
          `Reference '${from}' not found. Using recent commits instead.`
        );
        // Get the last 10 commits or whatever seems reasonable
        return (await this.git.log({ maxCount: 10 })).all.map((commit) => ({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author_name: commit.author_name,
          author_email: commit.author_email,
        }));
      } else {
        // Neither reference is valid, fall back to most recent commit
        console.log(`Invalid references. Using most recent commit.`);
        return (await this.git.log({ maxCount: 1 })).all.map((commit) => ({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author_name: commit.author_name,
          author_email: commit.author_email,
        }));
      }

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
    } catch (error) {
      console.log(`Error getting commits between refs: ${error}`);
      // Fallback to recent commits
      const logs = await this.git.log({ maxCount: 5 });
      return logs.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author_name: commit.author_name,
        author_email: commit.author_email,
      }));
    }
  }

  // Add this helper method to check if a git reference exists
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
    for (const day of [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]) {
      commitsByDay[day] = 0;
    }

    // Initialize hours
    for (let hour = 0; hour < 24; hour++) {
      commitsByHour[hour.toString()] = 0;
    }

    commits.forEach((commit) => {
      const date = new Date(commit.date);
      const day = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][date.getDay()];
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
    let mostActiveDay = Object.keys(commitsByDay)[0];
    let mostActiveHour = Object.keys(commitsByHour)[0];

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
        avg: commits.length
          ? Math.round(totalMessageLength / commits.length)
          : 0,
      },
      mostActiveDay,
      mostActiveHour,
    };
  }

  async getRepoInfo(): Promise<{ name: string; branches: number }> {
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
    };
  }
}

export const gitService = (path: string = ".") => new GitService(path);
