# memory-runtime

**Local-first context runtime for LLM applications.**

`memory-runtime` is a local-first infrastructure layer that replaces the "sliding window" chat history approach with structured state and code deltas. It cuts prompt sizes by ~80% while preserving high retrieval quality even in massive sessions.

## Install

```bash
npm i memory-runtime
```

## 10-line Usage

```typescript
import { createRuntime } from "memory-runtime";

const runtime = createRuntime({ storagePath: "./.memory.sqlite" });
const session = runtime.session("session-id");

// Ingest code snippets, diffs, or messages
await session.ingest({ type: "snippet", payload: { source: "file.ts", content } });

// Compile a budget-aware prompt (e.g. 2000 tokens)
const { messages } = await session.compile({ userMessage, budgetTokens: 2000 });

// Call your provider as usual
const res = await openai.chat.completions.create({ model: "gpt-4o", messages });

// Observe for autonomous state updates (decisions, constraints)
await session.observe({ assistantText: res.choices[0].message.content });
```

## Benchmarks

Results from a 50-turn session benchmark (Source: `scripts/bench.ts`):

### Token Reduction Performance
| Budget | Avg Naive | Avg Runtime | Max Runtime | Reduction | Needle Retrieval |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **800** | 9,589 | 573 | 641 | **94.0%** | ✅ |
| **2000** | 9,589 | 1,759 | 2,000 | **81.7%** | ✅ |
| **8000** | 9,589 | 6,044 | 7,653 | **37.0%** | ✅ |

### Retrieval Under Interference (Test F)
- **Scenario:** 5 distinct "needles" (facts) buried in 45 turns of noise.
- **Query:** Paraphrased user query with zero keyword overlap.
- **Result:** ✅ **PASS**
- **Model Answer:** *"The user session stays valid for 30 minutes before they need to log in again."*

## Not Summarization

This is not another LLM-based summarization script. Instead, `memory-runtime` uses a deterministic compilation engine to manage three layers:
1.  **State:** Structured records of decisions, constraints, and glossary terms.
2.  **Artifacts:** Content-addressed storage for file snapshots and diffs.
3.  **Budgeting:** Mathematical truncation and prioritization that ensures the most relevant context always fits within your token limit.

## Local-only / Keys

Everything runs on your infrastructure.
- **Local-first:** Context is stored in a local SQLite database.
- **Keys:** Uses your existing `OPENAI_API_KEY` or `GEMINI_API_KEY` environment variables. Keys are never stored, proxied, or sent to our servers.
- **Privacy:** No data leaves your machine except the direct call to your preferred LLM provider.

---
License: MIT
