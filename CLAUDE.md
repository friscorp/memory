# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting
npm run watch      # Compile in watch mode
npm run clean      # Remove dist/ directory
```

## Architecture

`memory-runtime` is a local-first context management SDK for LLM applications. It maintains typed session state and evidence artifacts, then compiles them into messages respecting token budgets.

### Core Pipeline: Ingest → Compile → Observe

1. **Ingest** (`src/ingest/`): Events and artifacts enter the system
   - `ingest.ts`: Generic event ingestion, automatically creates artifacts for certain event types
   - `gitDiff.ts`, `snippet.ts`: Helper functions for common artifact types

2. **Compile** (`src/compile/`): Context is assembled for LLM calls
   - `compiler.ts`: Orchestrates the compile pipeline
   - `selectEvidence.ts`: Deterministic evidence selection by priority (repo_diff=100, working set snippets=80, keyword matches=70, other snippets=50, doc_chunk/tool_output=40)
   - `budget.ts`: Enforces hard token limits by dropping low-priority evidence
   - `format.ts`: Formats final message array

3. **Observe** (`src/observe/`): Assistant responses are parsed for structured updates
   - `observe.ts`: Records response and updates session state
   - `extract.ts`: Parses `Decision:`, `Constraint:`, `Open:`, `Glossary:` markers from text

### Storage Layer (`src/storage/`)

- `sqliteStore.ts`: SQLite implementation using `better-sqlite3` with WAL mode
- Three tables: `sessions` (state JSON), `events` (event log), `artifacts` (evidence store)

### Runtime (`src/runtime/`)

- `createRuntime.ts`: Factory function returning `Runtime` interface
- `session.ts`: `Session` class delegates to ingest/compile/observe pipelines
- `types.ts`: All core type definitions (`SessionState`, `Event`, `CompileResult`, etc.)

### Session State Structure

```typescript
{
  constraints: string[];           // Hard requirements
  decisions: Decision[];           // Tracked decisions with IDs
  openThreads: OpenThread[];       // Unresolved questions
  glossary: GlossaryEntry[];       // Term definitions
  workingSet?: { paths: string[] } // Active file paths (boosts snippet priority)
}
```

State stores **references** (IDs), not full content. Evidence content lives in artifacts table.

## Example

See `examples/basic-cli/` for a working CLI that demonstrates the full ingest → compile → observe loop.
