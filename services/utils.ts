import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import readline from 'readline';

const execAsync = promisify(exec);

export async function linkPath(): Promise<void> {
  const packageDir = path.resolve(__dirname, '../..');
  
  try {
    await execAsync(`cd ${packageDir} && bun link`);
    return;
  } catch (error) {
    console.error('Failed to link package:', error);
    throw error;
  }
}

export function ensureEnvFile(): void {
  const envPath = path.resolve(__dirname, '../..', '.env');
  
  if (!fs.existsSync(envPath)) {
    const envTemplate = 'GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here\nGITHUB_TOKEN=optional_github_token_here\n';
    fs.writeFileSync(envPath, envTemplate);
    console.log(chalk.yellow('⚠️  Created .env file. Please add your API keys.'));
  }
}

export async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.cyan(question + ' '), (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function printHeader(title: string): void {
  console.log('\n' + chalk.bold.cyan('╔═════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║            💡 GitWise AI            ║'));
  console.log(chalk.bold.cyan('╚═════════════════════════════════════╝'));
  console.log(chalk.bold(`📁 ${title}\n`));
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${(seconds / 60).toFixed(1)}m`;
}