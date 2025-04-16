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

  async analyzeCommitHistory(commits: CommitInfo[], stats: CommitStats, repoName: string): Promise<string> {
    const commitSamples = commits.slice(0, 10).map(c => `- ${c.message} (${new Date(c.date).toLocaleDateString()})`).join('\n');
    
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

Present this in a friendly, helpful tone with clear sections. Keep your response concise and focused on the most important insights.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result.text;
  }

  async improveCommitMessage(draftMessage: string): Promise<string> {
    const prompt = `
As GitWise, I'm an expert at crafting clear, descriptive git commit messages.

Draft commit message: "${draftMessage}"

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
}

export const aiService = new AIService();