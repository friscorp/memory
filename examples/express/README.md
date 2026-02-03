# Express Example

A minimal Express server demonstrating `memory-runtime` integration.

## Setup

```bash
cd examples/express
npm install
```

## Run

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Start server
npm start
```

## Usage

### Chat
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the capital of France?"}'
```

### Add Code Context
```bash
curl -X POST http://localhost:3000/ingest/snippet \
  -H "Content-Type: application/json" \
  -d '{"path": "auth.ts", "content": "export const API_KEY = \"secret\";"}'
```

### View Session State
```bash
curl http://localhost:3000/session/state
```

## How It Works

1. **Session ID Cookie**: Each client gets a unique session ID stored in a cookie
2. **Compile Before LLM**: The `/chat` endpoint compiles context before calling OpenAI
3. **Observe After**: Assistant responses are observed to extract decisions/constraints
4. **Budget Enforcement**: Context is kept within 2000 tokens regardless of history length

## Files

- `src/server.ts` - The full Express server implementation
