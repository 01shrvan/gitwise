import chalk from 'chalk';
import { ensureEnvFile, askQuestion, linkPath, printHeader } from '../services/utils';

export async function setupEnvironment(): Promise<void> {
  try {
    printHeader('GitWise Setup');
    
    // Ensure .env file exists
    ensureEnvFile();
    
    console.log(chalk.bold('GitWise needs a Gemini API key to function.'));
    console.log(chalk.dim('You can get one from Google AI Studio: https://aistudio.google.com/'));
    
    // Ask user for API key
    const apiKey = await askQuestion('Enter your Google Generative AI API key:');
    
    if (apiKey.trim()) {
      // Save API key to .env file
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(__dirname, '../..', '.env');
      
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/GOOGLE_GENERATIVE_AI_API_KEY=.*/g, `GOOGLE_GENERATIVE_AI_API_KEY=${apiKey.trim()}`);
      fs.writeFileSync(envPath, envContent);
      
      console.log(chalk.green('✓ API key saved successfully'));
    } else {
      console.log(chalk.yellow('No API key provided. You can add it later to the .env file.'));
    }
    
    // Ask if user wants to set up GitHub token
    const setupGithub = await askQuestion('Would you like to set up a GitHub token for additional features? (y/n)');
    
    if (setupGithub.toLowerCase() === 'y' || setupGithub.toLowerCase() === 'yes') {
      console.log(chalk.dim('You can create a token at: https://github.com/settings/tokens'));
      const githubToken = await askQuestion('Enter your GitHub token:');
      
      if (githubToken.trim()) {
        // Save GitHub token to .env file
        const fs = require('fs');
        const path = require('path');
        const envPath = path.resolve(__dirname, '../..', '.env');
        
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/GITHUB_TOKEN=.*/g, `GITHUB_TOKEN=${githubToken.trim()}`);
        fs.writeFileSync(envPath, envContent);
        
        console.log(chalk.green('✓ GitHub token saved'));
      }
    }
    
    // Link the tool globally
    const linkGlobally = await askQuestion('Would you like to link GitWise globally for command-line access? (y/n)');
    
    if (linkGlobally.toLowerCase() === 'y' || linkGlobally.toLowerCase() === 'yes') {
      console.log(chalk.dim('Linking GitWise globally...'));
      await linkPath();
      console.log(chalk.green('✓ GitWise linked globally. You can now run "gitwise" from any directory.'));
    }
    
    console.log(chalk.green('\nSetup complete! You can now use GitWise.'));
    console.log(chalk.dim('Try running "gitwise analyze" in a git repository.'));
    
  } catch (error) {
    console.error(chalk.red("An error occurred during setup:"), error);
    process.exit(1);
  }
}