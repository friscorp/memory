# Memory Runtime - Basic CLI Example

A simple terminal-based example demonstrating the memory-runtime SDK's ingest → compile → observe loop.

## Features

- 💬 Interactive terminal loop for conversations
- 📥 Git diff ingestion (manual or automatic)
- 🧠 Context compilation with token budget enforcement
- 📊 Debug output showing token usage and evidence selection
- 🤖 LLM integration (stubbed or OpenAI)
- 📝 Structured extraction (Decision/Constraint/Open/Glossary markers)

## Installation

```bash
cd examples/basic-cli
npm install
```

## Usage

### Basic Usage (Stubbed LLM)

```bash
npm start
```

This runs with a stubbed LLM that generates contextual responses without requiring API keys.

### With OpenAI

```bash
export OPENAI_API_KEY=your-api-key-here
npm start
```

The CLI will automatically use OpenAI when `OPENAI_API_KEY` is set.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4-turbo-preview` |
| `SESSION_ID` | Session identifier | `default-session` |
| `BUDGET_TOKENS` | Token budget for compilation | `4000` |
| `STORAGE_PATH` | SQLite database path | `./.memory-runtime/runtime.sqlite` |
| `REPO_PATH` | Repository path for git diff | Current directory |
| `AUTO_DIFF` | Auto-ingest git diff each turn | `false` |

## Commands

While in the CLI:

- `/diff` - Manually ingest git diff from the repository
- `/state` - Display current session state (decisions, constraints, etc.)
- `/exit` - Exit the CLI

## Example Session

```
🧠 Memory Runtime - Basic CLI Example

Session: default-session
Storage: ./.memory-runtime/runtime.sqlite
Token Budget: 4000
Repo Path: /Users/you/myproject

Commands:
  /diff - Ingest git diff from repo
  /state - Show current session state
  /exit - Exit the CLI

💬 You: /diff
📥 Ingesting git diff...
✅ Ingested git diff: a1b2c3d4

💬 You: How does the authentication work?

🔄 Compiling context...

📊 Debug Info:
  Token Estimate: 2847 / 4000
  Included Artifacts: 3
  Dropped Artifacts: 0
  Artifact IDs: a1b2c3d4, e5f6g7h8, i9j0k1l2...

🤖 Assistant: 
Based on the git diff, I can see you've recently modified the auth module.

Decision: Use JWT tokens for stateless authentication
Constraint: Tokens must expire after 24 hours
Open: Should we implement refresh tokens?

The authentication flow works as follows...

✅ Decisions tracked: 1
⚠️  Constraints tracked: 1
❓ Open threads: 1

💬 You: /state
📊 Session State:
{
  "constraints": [
    "Tokens must expire after 24 hours"
  ],
  "decisions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Use JWT tokens for stateless authentication",
      "evidenceRefs": [],
      "createdAt": "2026-02-03T03:27:38.000Z"
    }
  ],
  "openThreads": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "question": "Should we implement refresh tokens?",
      "createdAt": "2026-02-03T03:27:38.000Z"
    }
  ],
  "glossary": [],
  "workingSet": undefined
}
```

## How It Works

1. **User Input**: You type a message
2. **Ingest**: Message is stored as an event
3. **Compile**: 
   - Evidence is selected (git diffs, code snippets, etc.)
   - Token budget is enforced
   - Context is compiled into messages
4. **LLM Call**: Messages are sent to LLM (stubbed or OpenAI)
5. **Observe**: 
   - Response is stored as an event
   - Structured markers are extracted (Decision:/Constraint:/etc.)
   - Session state is updated

## Auto Git Diff

To automatically ingest git diff on each turn:

```bash
export AUTO_DIFF=true
npm start
```

This is useful for tracking changes as you code.

## Development

```bash
# Run with ts-node
npm run dev

# Build TypeScript
npm run build
```

## Tips

- Use the `/diff` command after making code changes to update context
- Check `/state` to see what decisions and constraints have been tracked
- The stubbed LLM includes example Decision/Constraint/Open markers for testing
- Token budget enforcement ensures you never exceed context limits
