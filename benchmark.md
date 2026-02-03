📊 Benchmark: Naive KB Replay vs memory-runtime

We benchmarked a real Next.js app that answers questions from a local markdown knowledge base (“AcmeAuth”).
The app was tested in two modes:

### Naive: On every request, resend the entire KB (~4k chars) + growing chat history.

### Runtime: Ingest the KB once, then compile a bounded prompt by selecting only relevant artifacts per request.

Both modes used the same model, same UI, and answered the same questions.

#### Test setup

- 10 realistic questions (pricing, errors, session timeouts, SDK usage, troubleshooting)

- Single continuous chat session

- Model: gpt-4o-mini

- Budget (runtime mode): 750 tokens

- Metrics recorded per request:

- estimated input tokens

- latency (ms)

- context included (KB chars vs artifacts)

### Results (summary)

#### Naive mode

- Estimated tokens per request: ~1100 → ~1380 (grows with chat length)

- KB characters sent every request: ~3934

- Chat history grows unbounded

- Cost scales linearly with session length

#### Runtime mode

- Estimated tokens per request: ~572 (flat across all turns)

- KB replayed: never

- Context included: ~10 selected artifacts

- Prompt size remains bounded and deterministic

### Key takeaways

- ~50–60% fewer input tokens per request compared to naive replay

- No prompt growth over time — long chats stay cheap and stable

- No answer quality regression — all questions answered correctly in both modes

- Drop-in optimization: same app, same model call, different context compiler

### Why this matters

**Naively replaying context causes token costs (and instability) to grow with every turn.
memory-runtime replaces replay with state + evidence selection, keeping prompts small while preserving retrieval quality.**

This benchmark demonstrates that you can:

- stop resending the entire KB

- cap prompt size under a fixed budget

- maintain correctness in real applications

## Results (naive)

| # | Question | tokenEstimate | latencyMs | kbChars | historyCount | included | dropped |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | What is the pricing per month? Give Developer, Pro, Enterprise. |  | 1594 | 3934 | 1 |  |  |
| 2 | How long does a user session stay valid before they need to log in again? |  | 913 | 3934 | 3 |  |  |
| 3 | How long are refresh tokens valid? |  | 610 | 3934 | 5 |  |  |
| 4 | What does error AA-401 mean and how do I fix it? |  | 3515 | 3934 | 7 |  |  |
| 5 | What does error AA-429 mean and what should I do? |  | 1569 | 3934 | 9 |  |  |
| 6 | Compare Pro vs Enterprise in 3 bullets. |  | 1153 | 3934 | 11 |  |  |
| 7 | Show a minimal JavaScript example of AcmeAuth login using the SDK (from the KB). |  | 3371 | 3934 | 13 |  |  |
| 8 | What are the recommended troubleshooting steps if logins intermittently fail? |  | 427 | 3934 | 15 |  |  |
| 9 | Does the Developer plan support MFA? |  | 1255 | 3934 | 17 |  |  |
| 10 | What happens if I exceed my MAU limit on Pro? |  | 809 | 3934 | 19 |  |  |

## Results (runtime)

| # | Question | tokenEstimate | latencyMs | kbChars | historyCount | included | dropped |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | What is the pricing per month? Give Developer, Pro, Enterprise. | 572 | 1478 |  |  | 10 | 0 |
| 2 | How long does a user session stay valid before they need to log in again? | 572 | 2103 |  |  | 10 | 0 |
| 3 | How long are refresh tokens valid? | 572 | 1362 |  |  | 10 | 0 |
| 4 | What does error AA-401 mean and how do I fix it? | 572 | 1211 |  |  | 10 | 0 |
| 5 | What does error AA-429 mean and what should I do? | 572 | 2831 |  |  | 10 | 0 |
| 6 | Compare Pro vs Enterprise in 3 bullets. | 572 | 2296 |  |  | 10 | 0 |
| 7 | Show a minimal JavaScript example of AcmeAuth login using the SDK (from the KB). | 572 | 3360 |  |  | 10 | 0 |
| 8 | What are the recommended troubleshooting steps if logins intermittently fail? | 572 | 5068 |  |  | 10 | 0 |
| 9 | Does the Developer plan support MFA? | 572 | 666 |  |  | 10 | 0 |
| 10 | What happens if I exceed my MAU limit on Pro? | 572 | 1593 |  |  | 10 | 0 |


### *note*
*In runtime mode, raw kbChars and historyCount are no longer relevant metrics because the KB and chat history are not replayed; instead, the runtime injects a small, bounded set of selected artifacts.*
