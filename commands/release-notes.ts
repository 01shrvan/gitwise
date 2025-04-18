import chalk from 'chalk';
import path from 'path';
import { createGitService } from '../services/git-service';
import { createAIService } from '../services/ai-service';
import { printHeader, formatDuration } from '../services/utils';
import { ReleaseNotesOptions } from '../types';

export async function generateReleaseNotes(options: ReleaseNotesOptions): Promise<void> {
  const startTime = Date.now();
  
  try {
    const repoPath = path.resolve(options.path);
    printHeader('Release Notes Generator');

    const git = createGitService(repoPath);

    if (!(await git.isGitRepo())) {
      console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
      process.exit(1);
    }

    console.log(chalk.dim(`Generating release notes from ${options.from} to ${options.to}...`));
    
    const commits = await git.getCommitsBetween(options.from, options.to);
    
    if (commits.length === 0) {
      console.log(chalk.yellow(`No commits found between ${options.from} and ${options.to}.`));
      process.exit(0);
    }

    const commitsToUse = options.count ? commits.slice(0, parseInt(String(options.count))) : commits;
    console.log(chalk.green(`✓ Found ${commitsToUse.length} commits`));
    
    console.log(chalk.dim('Generating release notes...'));
    
    const ai = createAIService();
    const releaseNotes = await ai.generateReleaseNotes(commitsToUse);

    console.log('\n' + chalk.bold.green('📝 Release Notes:') + '\n');
    console.log(releaseNotes);
    
    const endTime = Date.now();
    console.log(chalk.dim(`\nCompleted in ${formatDuration((endTime - startTime) / 1000)}`));
    
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error);
    process.exit(1);
  }
}