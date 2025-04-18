import { env } from "../config/env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { CommitInfo, CommitStats } from "../types";

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
You are GitWise, an AI assistant specifically designed to help developers understand their git repositories and improve their workflow. Analyze the following git repository data and provide actionable insights.

# Repository: "${repoName}"

# Commit Statistics:
- Total commits in period: ${stats.total}
- Most active day: ${stats.mostActiveDay}
- Most active hour: ${stats.mostActiveHour} (24h format)
- Commit message length: Avg=${stats.messageLength.avg}, Min=${stats.messageLength.min}, Max=${stats.messageLength.max}

# Commit samples:
${commitSamples}

Based on this data, provide:
1. The most important insight about this repository's commit patterns
2. ONE specific recommendation to improve the git workflow 
3. A note about commit message quality and how it could be improved

${compact ? 'Be very concise with just 1-2 sentences per point. Keep the entire response under 10 lines.' : 'Be conversational but focused - like a helpful senior developer giving advice.'}
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.7,
      maxTokens: compact ? 300 : 800,
    });

    return result.text;
  }

  async improveCommitMessage(draftMessage: string, diff: string = ""): Promise<string> {
    const prompt = `
You are GitWise, an AI assistant for git workflows. Improve this commit message to follow best practices.

Draft commit message: "${draftMessage}"

${diff ? `Here's the code diff to provide context:\n\`\`\`\n${diff.substring(0, 2000)}\n${diff.length > 2000 ? '... (diff truncated)' : ''}\`\`\`` : ""}

Transform this into a clear, descriptive commit message following these git best practices:
- Start with a concise summary (50 chars or less)
- Use imperative mood ("Add feature" not "Added feature")
- Be specific about what changed
- Reference issue numbers if present in the original

Return ONLY the improved commit message without explanations.
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
You are GitWise, an AI assistant that helps developers create high-quality PR descriptions. Based on the provided diff, generate a comprehensive PR description.

Branch information:
- Source branch: '${currentBranch}'
- Target branch: '${baseBranch}'

Here's the diff (changes):
\`\`\`
${diff.substring(0, 4000)} ${diff.length > 4000 ? '... (diff truncated)' : ''}
\`\`\`

Generate a professional PR description with:
1. A clear title (prefixed with "Title: ")
2. A concise summary of what this PR accomplishes (2-3 sentences)
3. Key changes (as bullet points)
4. Testing instructions (simple steps to verify the changes work)

Format this as a proper markdown document that a developer can immediately use.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.5,
      maxTokens: 800,
    });

    return result.text;
  }

  async generateReleaseNotes(commits: CommitInfo[]): Promise<string> {
    const commitStr = commits.map(c => `- ${c.hash.substring(0, 7)}: ${c.message}`).join('\n');
    
    const prompt = `
You are GitWise, an AI assistant that helps create professional release notes. Based on these commits, create organized and user-friendly release notes.

Commits:
${commitStr}

Create release notes that:
1. Group changes by type (Features, Bug Fixes, Documentation, etc.)
2. Use clear, friendly language that focuses on what users gain
3. Highlight the most important changes first
4. Include a brief summary at the top

Format as markdown, ready to publish to users.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.5,
      maxTokens: 800,
    });

    return result.text;
  }

  async answerRepoQuestion(question: string, repoInfo: any): Promise<string> {
    const prompt = `
You are GitWise, an AI assistant for git repositories. Answer the following question about a git repository based on the provided information.

Question: "${question}"

Repository information:
${JSON.stringify(repoInfo, null, 2)}

Provide a helpful, conversational response that directly answers the question. If you don't have enough information to answer the question specifically, say so and suggest what information would be needed.
`;

    const result = await generateText({
      model: this.google("gemini-1.5-flash-latest"),
      prompt,
      temperature: 0.5,
      maxTokens: 500,
    });

    return result.text;
  }
}

export const createAIService = () => new AIService();