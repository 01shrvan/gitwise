import { env } from "../env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { CommitInfo, CommitStats } from "./git-service";

class AIService {
  private google;

  constructor() {
    this.google = createGoogleGenerativeAI({
      apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  }

  async analyzeCommitHistory(
    commits: CommitInfo[], 
    stats: CommitStats, 
    repoName: string,
    compact: boolean = false
  ): Promise<string> {
    const commitSamples = commits.slice(0, 7).map(c => `- ${c.message} (${new Date(c.date).toLocaleDateString()})`).join('\n');
    
    const prompt = `
As a git expert called GitWise, analyze the following commit history and statistics from the "${repoName}" repository.

# Commit Statistics:
- Total commits in period: ${stats.total}
- Most active day: ${stats.mostActiveDay}
- Most active hour: ${stats.mostActiveHour} (24h format)
- Commit message length: Avg=${stats.messageLength.avg}, Min=${stats.messageLength.min}, Max=${stats.messageLength.max}

# Commit samples:
${commitSamples}

Based on this data, provide:
1. A brief summary of the commit patterns
2. Insights about productivity patterns (time of day, day of week)
3. Feedback on commit message quality and consistency
4. Tips for improving git workflow based on what you see

${compact ? 'Present this in a very concise format with bullet points only. Keep the entire response under 15 lines total.' : 'Present this in a friendly, helpful tone with clear sections.'}
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.7,
      maxTokens: compact ? 500 : 1000,
    });

    return result.text;
  }

  async improveCommitMessage(draftMessage: string, diff: string = ""): Promise<string> {
    const prompt = `
As GitWise, I'm an expert at crafting clear, descriptive git commit messages.

Draft commit message: "${draftMessage}"

${diff ? `Here's the code diff to provide context:\n\`\`\`\n${diff}\n\`\`\`` : ""}

Please improve this commit message following these git best practices:
- Start with a concise summary (50 chars or less)
- Use imperative mood ("Add feature" not "Added feature")
- Provide context about why the change is being made
- Break down complex changes into multiple bullet points if needed
- Keep it focused on what changed and why, not how

Return ONLY the improved commit message without explanations or bullet points.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.4,
      maxTokens: 200,
    });

    return result.text;
  }

  async generatePRDescription(diff: string, currentBranch: string, baseBranch: string): Promise<string> {
    const prompt = `
As GitWise, I'll help you generate a professional pull request description.

I'm looking at changes from branch '${currentBranch}' to be merged into '${baseBranch}'.

Here's the diff of the changes:
\`\`\`
${diff.substring(0, 5000)} ${diff.length > 5000 ? '... (diff truncated)' : ''}
\`\`\`

Generate a comprehensive PR description including:
1. A clear title summarizing the main purpose of these changes
2. A detailed description of what was changed
3. The reason/motivation for these changes
4. Any important implementation details developers should know
5. Instructions for testing these changes
6. Any potential risks or areas of concern

Format this as a proper markdown document ready to paste into a PR description.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.5,
      maxTokens: 1000,
    });

    return result.text;
  }

  async generateReleaseNotes(commits: CommitInfo[]): Promise<string> {
    // Group commits by type (feature, fix, docs, etc.)
    const commitStr = commits.map(c => `- ${c.hash.substring(0, 7)}: ${c.message}`).join('\n');
    
    const prompt = `
As GitWise, I'll help you generate professional release notes.

Here are the commits to include:
${commitStr}

Please generate comprehensive release notes with the following:
1. Group commits by type (features, bug fixes, documentation, etc.)
2. Highlight major changes first
3. Use clear, consistent formatting with markdown
4. Make it user-focused, emphasizing benefits and improvements
5. Include a brief summary at the top

Format this as a proper markdown document ready to share with users.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.5,
      maxTokens: 1000,
    });

    return result.text;
  }
}

export const aiService = new AIService();