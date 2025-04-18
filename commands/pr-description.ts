import chalk from 'chalk';
import path from 'path';
import { createGitService } from '../services/git-service';
import { createAIService } from '../services/ai-service';
import { printHeader, formatDuration } from '../services/utils';
import { PRDescriptionOptions } from '../types';

export async function generatePRDescription(options: PRDescriptionOptions): Promise<void> {
  const startTime = Date.now();
  
  try {
    const repoPath = path.resolve(options.path);
    printHeader('PR Description Generator');

    const git = createGitService(repoPath);

    if (!(await git.isGitRepo())) {
      console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
      process.exit(1);
    }

    const currentBranch = await git.getCurrentBranch();
    const baseBranch = options.base;
    
    console.log(chalk.dim(`Creating PR description for changes from ${baseBranch} to ${currentBranch}...`));
    
    const diff = await git.getDiffFromBranch(baseBranch);
    
    if (!diff) {
      console.log(chalk.yellow(`No changes found between ${baseBranch} and ${currentBranch}.`));
      process.exit(0);
    }

    console.log(chalk.green(`✓ Found ${diff.split('\n').length} lines of changes`));
    
    const modifiedFiles = await git.getModifiedFiles();
    console.log(chalk.green(`✓ ${modifiedFiles.length} file(s) modified`));
    
    console.log(chalk.dim('Generating PR description...'));
    
    const ai = createAIService();
    const prDescription = await ai.generatePRDescription(diff, currentBranch, baseBranch);

    console.log('\n' + chalk.bold.green('📝 PR Description:') + '\n');
    console.log(prDescription);
    
    const endTime = Date.now();
    console.log(chalk.dim(`\nCompleted in ${formatDuration((endTime - startTime) / 1000)}`));
    
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error);
    process.exit(1);
  }
}