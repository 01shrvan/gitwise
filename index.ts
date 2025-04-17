#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import { gitService } from "./services/git-service";
import { aiService } from "./services/ai-service";
import path from "path";
import { visualizeCommits } from "./services/visualization-service";
import { linkPath } from "./services/utils";

const program = new Command();

program
  .name("gitwise")
  .description("An AI-powered git insights tool")
  .version("0.2.0");

program
  .command("analyze")
  .description("Analyze your git commit history and provide insights")
  .option("-d, --days <number>", "Number of days to analyze", "30")
  .option("-p, --path <path>", "Path to git repository", process.cwd())
  .option("-c, --compact", "Show compact output", false)
  .action(async (options) => {
    try {
      const repoPath = path.resolve(options.path);
      console.log(
        chalk.cyan(`🔍 GitWise is analyzing ${chalk.bold(repoPath)}...`)
      );

      const git = gitService(repoPath);

      if (!(await git.isGitRepo())) {
        console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
        process.exit(1);
      }

      const days = parseInt(options.days);
      const [commits, stats, repoInfo] = await Promise.all([
        git.getCommitHistory(days),
        git.analyzeCommitPatterns(days),
        git.getRepoInfo(),
      ]);

      if (commits.length === 0) {
        console.log(chalk.yellow(`No commits found in the last ${days} days.`));
        process.exit(0);
      }

      console.log(
        chalk.cyan(`Found ${commits.length} commits in the last ${days} days.`)
      );

      if (!options.compact) {
        await visualizeCommits(stats);
      }

      console.log(chalk.cyan("🧠 Analyzing commit patterns..."));

      const analysis = await aiService.analyzeCommitHistory(
        commits,
        stats,
        repoInfo.name,
        options.compact
      );

      console.log("\n" + chalk.bold.green("📊 GitWise Analysis") + "\n");
      console.log(analysis);
    } catch (error) {
      console.error(chalk.red("An error occurred:"), error);
      process.exit(1);
    }
  });

program
  .command("commit-help")
  .description("Get suggestions for a better commit message")
  .argument("<message>", "Your draft commit message")
  .option("-p, --path <path>", "Path to git repository", process.cwd())
  .action(async (message, options) => {
    try {
      const repoPath = path.resolve(options.path);
      console.log(chalk.cyan("🧠 Analyzing your commit message..."));

      // Get current diff to provide context
      const git = gitService(repoPath);
      const diff = await git.getStagedDiff();

      const improvedMessage = await aiService.improveCommitMessage(
        message,
        diff
      );

      console.log(
        "\n" + chalk.bold.green("📝 Improved Commit Message:") + "\n"
      );
      console.log(chalk.yellow(improvedMessage));
      console.log("\n" + chalk.dim("Copy this message for your commit!"));
    } catch (error) {
      console.error(chalk.red("An error occurred:"), error);
      process.exit(1);
    }
  });

program
  .command("pr-description")
  .description("Generate a PR description based on your changes")
  .option("-p, --path <path>", "Path to git repository", process.cwd())
  .option("-b, --base <branch>", "Base branch to compare against", "main")
  .action(async (options) => {
    try {
      const repoPath = path.resolve(options.path);
      console.log(
        chalk.cyan(
          `🔍 Generating PR description for changes in ${chalk.bold(
            repoPath
          )}...`
        )
      );

      const git = gitService(repoPath);

      if (!(await git.isGitRepo())) {
        console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
        process.exit(1);
      }

      const diff = await git.getDiffFromBranch(options.base);
      const currentBranch = await git.getCurrentBranch();

      if (!diff) {
        console.log(
          chalk.yellow("No changes detected to generate PR description.")
        );
        process.exit(0);
      }

      console.log(chalk.cyan("🧠 Analyzing changes..."));

      const prDescription = await aiService.generatePRDescription(
        diff,
        currentBranch,
        options.base
      );

      console.log("\n" + chalk.bold.green("📋 PR Description") + "\n");
      console.log(prDescription);
    } catch (error) {
      console.error(chalk.red("An error occurred:"), error);
      process.exit(1);
    }
  });

program
  .command("release-notes")
  .description("Generate release notes from commits between tags")
  .option("-p, --path <path>", "Path to git repository", process.cwd())
  .option("-f, --from <tag>", "Starting tag or commit", "HEAD~10")
  .option("-t, --to <tag>", "Ending tag or commit", "HEAD")
  .option(
    "-c, --count <number>",
    "Number of recent commits if references not found",
    "10"
  )
  .action(async (options) => {
    try {
      const repoPath = path.resolve(options.path);
      console.log(
        chalk.cyan(`🔍 Generating release notes for ${chalk.bold(repoPath)}...`)
      );

      const git = gitService(repoPath);

      if (!(await git.isGitRepo())) {
        console.error(chalk.red(`Error: ${repoPath} is not a git repository`));
        process.exit(1);
      }

      const commits = await git.getCommitsBetween(options.from, options.to);

      if (commits.length === 0) {
        console.log(
          chalk.yellow("No commits found between the specified references.")
        );
        process.exit(0);
      }

      console.log(
        chalk.cyan(
          `Found ${commits.length} commits to include in release notes.`
        )
      );
      console.log(chalk.cyan("🧠 Generating release notes..."));

      const releaseNotes = await aiService.generateReleaseNotes(commits);

      console.log("\n" + chalk.bold.green("📝 Release Notes") + "\n");
      console.log(releaseNotes);
    } catch (error) {
      console.error(chalk.red("An error occurred:"), error);
      console.log(
        chalk.yellow(
          "Try specifying different references or using the --count option."
        )
      );
      process.exit(1);
    }
  });

program
  .command("setup")
  .description("Setup GitWise globally on your system")
  .action(async () => {
    try {
      console.log(chalk.cyan("🔧 Setting up GitWise globally..."));

      await linkPath();

      console.log(chalk.green("✅ GitWise has been installed globally!"));
      console.log(
        chalk.cyan("You can now use GitWise from any directory by typing:")
      );
      console.log(chalk.yellow("gitwise <command>"));
    } catch (error) {
      console.error(chalk.red("An error occurred during setup:"), error);
      console.log(
        chalk.yellow("Try running with sudo or administrator privileges.")
      );
      process.exit(1);
    }
  });

program.parse();
