#!/usr/bin/env bun
import { Command } from 'commander';
import { analyze } from './commands/analyze';
import { commitHelp } from './commands/commit-help';
import { generatePRDescription } from './commands/pr-description';
import { generateReleaseNotes } from './commands/release-notes';
import { setupEnvironment } from './commands/setup';
import { version } from './package.json';

const program = new Command();

program
  .name('gitwise')
  .description('AI-powered git insights and workflow tools')
  .version(version);

program
  .command('analyze')
  .description('Analyze git repository commit patterns and provide insights')
  .option('-d, --days <number>', 'Number of days of history to analyze', '30')
  .option('-p, --path <path>', 'Path to git repository', process.cwd())
  .option('-c, --compact', 'Show compact output without visualization', false)
  .option('-i, --interactive', 'Enable interactive mode to ask questions about the repo', false)
  .action(async (options) => {
    await analyze(options);
  });

program
  .command('commit-help')
  .description('Get AI help to improve a commit message')
  .argument('<message>', 'Draft commit message')
  .option('-p, --path <path>', 'Path to git repository', process.cwd())
  .action(async (message, options) => {
    await commitHelp(message, options);
  });

program
  .command('pr-description')
  .description('Generate a PR description based on branch differences')
  .option('-p, --path <path>', 'Path to git repository', process.cwd())
  .option('-b, --base <branch>', 'Base branch to compare against', 'main')
  .action(async (options) => {
    await generatePRDescription(options);
  });

program
  .command('release-notes')
  .description('Generate release notes between two git references')
  .option('-p, --path <path>', 'Path to git repository', process.cwd())
  .option('-f, --from <ref>', 'Starting reference (tag, commit, or branch)', 'HEAD~10')
  .option('-t, --to <ref>', 'Ending reference (tag, commit, or branch)', 'HEAD')
  .option('-c, --count <number>', 'Number of commits to include', '10')
  .action(async (options) => {
    await generateReleaseNotes(options);
  });

program
  .command('setup')
  .description('Setup configuration for GitWise')
  .action(async () => {
    await setupEnvironment();
  });

program.parse();

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.outputHelp();
}