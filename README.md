# GitWise

An AI-powered terminal tool that analyzes your git repositories and provides intelligent insights about your commit patterns and coding habits.

## Features

- **Repository Analysis**: Get detailed insights about your commit patterns
- **Commit Message Helper**: Generate better commit messages with AI assistance
- **Productivity Insights**: Learn about your most productive coding times

## Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Git installed and accessible in your PATH
- Gemini API key (get one from [Google AI Studio](https://aistudio.google.com/))

### Setup

1. Clone this repository:
```bash
git clone https://github.com/01shrvan/gitwise.git
cd gitwise
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file with your API key:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. Link the command globally (optional):
```bash
bun link
```

## Usage

Navigate to any git repository and run GitWise commands:

### Analyze Repository

```bash
gitwise analyze
```

This will analyze your git history and provide insights about:
- Commit patterns and frequency
- Your most productive days and hours
- Commit message quality
- Suggestions for better git practices

### Get Commit Message Help

```bash
gitwise commit-help "fix the login bug"
```

This will return an improved commit message following git best practices.

## Options

- `analyze --days <number>` - Specify the number of days of history to analyze (default: 30)

## License

MIT