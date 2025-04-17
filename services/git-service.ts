import simpleGit, { SimpleGit } from 'simple-git';

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

  constructor(path: string = '.') {
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
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const logs = await this.git.log({
      from: since.toISOString(),
      format: {
        hash: '%H',
        date: '%aI',
        message: '%s',
        author_name: '%an',
        author_email: '%ae',
      }
    });
    
    return logs.all;
  }

  async getCurrentBranch(): Promise<string> {
    const branchSummary = await this.git.branch();
    return branchSummary.current;
  }

  async getStagedDiff(): Promise<string> {
    try {
      return await this.git.diff(['--staged']);
    } catch (error) {
      return '';
    }
  }

  async getDiffFromBranch(base: string = 'main'): Promise<string> {
    try {
      const currentBranch = await this.getCurrentBranch();
      return await this.git.diff([`${base}...${currentBranch}`]);
    } catch (error) {
      return '';
    }
  }

  async getCommitsBetween(from: string, to: string): Promise<CommitInfo[]> {
    const logs = await this.git.log({
      from,
      to,
      format: {
        hash: '%H',
        date: '%aI',
        message: '%s',
        author_name: '%an',
        author_email: '%ae',
      }
    });
    
    return logs.all;
  }

  async analyzeCommitPatterns(days: number = 30): Promise<CommitStats> {
    const commits = await this.getCommitHistory(days);
    
    const commitsByDay: Record<string, number> = {};
    const commitsByHour: Record<string, number> = {};
    let totalMessageLength = 0;
    let minLength = Infinity;
    let maxLength = 0;
    
    // Initialize days of week
    for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      commitsByDay[day] = 0;
    }
    
    // Initialize hours
    for (let hour = 0; hour < 24; hour++) {
      commitsByHour[hour.toString()] = 0;
    }
    
    commits.forEach(commit => {
      const date = new Date(commit.date);
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
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
        avg: commits.length ? Math.round(totalMessageLength / commits.length) : 0
      },
      mostActiveDay,
      mostActiveHour
    };
  }
  
  async getRepoInfo(): Promise<{name: string, branches: number}> {
    const remote = await this.git.remote(['get-url', 'origin']).catch(() => '');
    const branches = await this.git.branch();
    
    let name = 'local-repo';
    if (remote) {
      // Extract repo name from remote URL
      const matches = remote.match(/\/([^\/]+?)(\.git)?$/);
      if (matches && matches[1]) {
        name = matches[1];
      }
    }
    
    return {
      name,
      branches: branches.all.length
    };
  }
}

export const gitService = (path: string = '.') => new GitService(path);