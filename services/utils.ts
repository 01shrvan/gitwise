import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function linkPath(): Promise<void> {
  const packageDir = path.resolve(__dirname, '..');
  
  try {
    await execAsync(`cd ${packageDir} && bun link`);
  } catch (error) {
    console.error('Failed to link package:', error);
    throw error;
  }
}

export function ensureEnvFile(): void {
  const envPath = path.resolve(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    const envTemplate = 'GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here\n';
    fs.writeFileSync(envPath, envTemplate);
    console.log('Created .env file. Please add your API key.');
  }
}