#!/usr/bin/env bun
import { Command } from 'commander';
import chalk from 'chalk';
import { gitService } from './services/git-service';
import { aiService } from './services/ai-service';

const program = new Command();

program
  .name('gitwise')
  .description('An AI-powered git commit analyzer')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze your git commit history and provide insights')
  .option('-d, --days <number>', 'Number of days to analyze', '30')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('🔍 GitWise is analyzing your repository...'));
      
      const git = gitService();
      
      if (!(await git.isGitRepo())) {
        console.error(chalk.red('Error: Not a git repository'));
        process.exit(1);
      }
      
      const days = parseInt(options.days);
      const [commits, stats, repoInfo] = await Promise.all([
        git.getCommitHistory(days),
        git.analyzeCommitPatterns(days),
        git.getRepoInfo()
      ]);
      
      if (commits.length === 0) {
        console.log(chalk.yellow(`No commits found in the last ${days} days.`));
        process.exit(0);
      }
      
      console.log(chalk.cyan(`Found ${commits.length} commits in the last ${days} days.`));
      console.log(chalk.cyan('🧠 Analyzing commit patterns...'));
      
      const analysis = await aiService.analyzeCommitHistory(commits, stats, repoInfo.name);
      
      console.log('\n' + chalk.bold.green('📊 GitWise Analysis') + '\n');
      console.log(analysis);
      
    } catch (error) {
      console.error(chalk.red('An error occurred:'), error);
      process.exit(1);
    }
  });

program
  .command('commit-help')
  .description('Get suggestions for a better commit message')
  .argument('<message>', 'Your draft commit message')
  .action(async (message) => {
    try {
      console.log(chalk.cyan('🧠 Analyzing your commit message...'));
      
      const improvedMessage = await aiService.improveCommitMessage(message);
      
      console.log('\n' + chalk.bold.green('📝 Improved Commit Message:') + '\n');
      console.log(chalk.yellow(improvedMessage));
      console.log('\n' + chalk.dim('Copy this message for your commit!'));
      
    } catch (error) {
      console.error(chalk.red('An error occurred:'), error);
      process.exit(1);
    }
  });

program.parse();