import chalk from 'chalk';
import path from 'path';
import { createGitService } from '../services/git-service';
import { createAIService } from '../services/ai-service';
import { printHeader, formatDuration } from '../services/utils';
import { CommitHelpOptions } from '../types';

export async function commitHelp(message: string, options: CommitHelpOptions): Promise<void> {
  const startTime = Date.now();
  
  try {
    const repoPath = path.resolve(options.path);
    printHeader('Commit Message Helper');

    console.log(chalk.bold('Draft Message:'));
    console.log(chalk.dim(message));
    console.log('');

    // Get current diff to provide context
    const git = createGitService(repoPath);
    const diff = await git.getStagedDiff();
    
    if (!diff) {
      console.log(chalk.yellow('No staged changes found. Stage some changes first with git add.'));
      console.log(chalk.dim('Continuing with limited context...'));
    } else {
      console.log(chalk.green(`✓ Found ${diff.split('\n').length} lines of staged changes`));
    }

    console.log(chalk.dim('Generating improved commit message...'));
    
    const ai = createAIService();
    const improvedMessage = await ai.improveCommitMessage(message, diff);

    console.log('\n' + chalk.bold.green('📝 Improved Commit Message:') + '\n');
    
    // Create a highlighted box for the improved message
    const lines = improvedMessage.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    
    console.log(chalk.yellow('┌' + '─'.repeat(maxLength + 2) + '┐'));
    
    lines.forEach(line => {
      console.log(chalk.yellow('│ ') + chalk.bold(line.padEnd(maxLength)) + chalk.yellow(' │'));
    });
    
    console.log(chalk.yellow('└' + '─'.repeat(maxLength + 2) + '┘'));
    
    console.log('\n' + chalk.dim('Use this command to commit with the improved message:'));
    console.log(chalk.cyan(`git commit -m "${improvedMessage.replace(/"/g, '\\"')}"`));
    
    const endTime = Date.now();
    console.log(chalk.dim(`\nCompleted in ${formatDuration((endTime - startTime) / 1000)}`));
    
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error);
    process.exit(1);
  }
}