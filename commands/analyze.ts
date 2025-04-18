import chalk from 'chalk';
import path from 'path';
import { createGitService } from '../services/git-service';
import { createAIService } from '../services/ai-service';
import { visualizeCommits, printInsightsHighlight } from '../services/visualization-service';
import { printHeader, askQuestion, formatDuration } from '../services/utils';
import { AnalyzeOptions } from '../types';

export async function analyze(options: AnalyzeOptions): Promise<void> {
  const startTime = Date.now();
  
  try {
    const repoPath = path.resolve(options.path);
    printHeader(`Analyzing Repository: ${path.basename(repoPath)}`);

    const git = createGitService(repoPath);

    if (!(await git.isGitRepo())) {
      console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
      process.exit(1);
    }

    const days = parseInt(String(options.days));
    
    console.log(chalk.dim(`Analyzing the last ${days} days of activity...`));
    
    // Show spinner or progress indicator would be nice here
    const [commits, stats, repoInfo] = await Promise.all([
      git.getCommitHistory(days),
      git.analyzeCommitPatterns(days),
      git.getRepoInfo(),
    ]);

    if (commits.length === 0) {
      console.log(chalk.yellow(`No commits found in the last ${days} days.`));
      process.exit(0);
    }

    console.log(chalk.green(`✓ Found ${commits.length} commits`));

    // Only show visualization if not in compact mode
    if (!options.compact) {
      visualizeCommits(stats);
    }

    console.log(chalk.dim('Analyzing commit patterns...'));
    const ai = createAIService();
    
    const analysis = await ai.analyzeCommitHistory(
      commits,
      stats,
      repoInfo.name,
      options.compact
    );

    printInsightsHighlight(analysis);
    
    const endTime = Date.now();
    console.log(chalk.dim(`Analysis completed in ${formatDuration((endTime - startTime) / 1000)}`));

    // Add interactive mode if requested
    if (options.interactive) {
      await startInteractiveMode(git, ai, repoInfo, commits, stats);
    } else {
      console.log(chalk.dim('Tip: Run with --interactive flag to ask questions about your repository'));
    }
    
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error);
    process.exit(1);
  }
}

async function startInteractiveMode(git: any, ai: any, repoInfo: any, commits: any, stats: any) {
  console.log(chalk.bold.cyan('\n💬 Interactive Mode\n'));
  console.log(chalk.dim('Ask questions about your repository or type "exit" to quit'));
  
  let exitRequested = false;
  
  while (!exitRequested) {
    const question = await askQuestion('\nWhat would you like to know about this repository?');
    
    if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
      exitRequested = true;
      continue;
    }
    
    console.log(chalk.dim('Thinking...'));
    
    const contextInfo = {
      repoName: repoInfo.name,
      totalCommits: commits.length,
      commitStats: stats,
      recentCommits: commits.slice(0, 5).map((c: any) => ({ 
        hash: c.hash.substring(0, 7),
        message: c.message,
        date: new Date(c.date).toLocaleDateString()
      }))
    };
    
    const answer = await ai.answerRepoQuestion(question, contextInfo);
    console.log(chalk.cyan('\nAnswer:'));
    console.log(answer);
  }
  
  console.log(chalk.green('\nExiting interactive mode. Thanks for using GitWise!'));
}