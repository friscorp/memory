#!/usr/bin/env node

import { createRuntime } from 'memory-runtime';
import { createInterface } from 'readline';
import { callLLM } from './llm.js';

// Configuration from environment
const REPO_PATH = process.env.REPO_PATH || process.cwd();
const SESSION_ID = process.env.SESSION_ID || 'default-session';
const BUDGET_TOKENS = parseInt(process.env.BUDGET_TOKENS || '4000', 10);
const STORAGE_PATH = process.env.STORAGE_PATH || './.memory-runtime/runtime.sqlite';

const STABLE_PREFIX = `You are a helpful coding assistant with access to repository context.

When you make decisions or identify constraints, use these markers:
- Decision: <your decision>
- Constraint: <identified constraint>
- Open: <open question>
- Glossary: term - definition

These will be extracted and tracked across the conversation.`;

async function main() {
    console.log('🧠 Memory Runtime - Basic CLI Example\n');
    console.log(`Session: ${SESSION_ID}`);
    console.log(`Storage: ${STORAGE_PATH}`);
    console.log(`Token Budget: ${BUDGET_TOKENS}`);
    console.log(`Repo Path: ${REPO_PATH}\n`);

    // Create runtime and session
    const runtime = createRuntime({
        storagePath: STORAGE_PATH,
        stablePrefix: STABLE_PREFIX
    });

    const session = runtime.session(SESSION_ID);

    // Create readline interface
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '\n💬 You: '
    });

    console.log('Commands:');
    console.log('  /diff - Ingest git diff from repo');
    console.log('  /state - Show current session state');
    console.log('  /exit - Exit the CLI\n');

    rl.prompt();

    rl.on('line', async (input) => {
        const userMessage = input.trim();

        if (!userMessage) {
            rl.prompt();
            return;
        }

        // Handle commands
        if (userMessage === '/exit') {
            console.log('\n👋 Goodbye!');
            rl.close();
            process.exit(0);
        }

        if (userMessage === '/state') {
            const state = session.getState();
            console.log('\n📊 Session State:');
            console.log(JSON.stringify(state, null, 2));
            rl.prompt();
            return;
        }

        if (userMessage === '/diff') {
            console.log('\n📥 Ingesting git diff...');
            try {
                const artifactId = session.ingestGitDiff(REPO_PATH);
                if (artifactId) {
                    console.log(`✅ Ingested git diff: ${artifactId}`);
                } else {
                    console.log('ℹ️  No git changes to ingest');
                }
            } catch (error) {
                console.error('❌ Failed to ingest git diff:', error);
            }
            rl.prompt();
            return;
        }

        try {
            // Ingest user message
            session.ingest({
                type: 'user_message',
                payload: { text: userMessage }
            });

            // Auto-ingest git diff if REPO_PATH is set and AUTO_DIFF is enabled
            if (process.env.AUTO_DIFF === 'true') {
                const artifactId = session.ingestGitDiff(REPO_PATH);
                if (artifactId) {
                    console.log(`📥 Auto-ingested git diff: ${artifactId.slice(0, 8)}...`);
                }
            }

            // Compile context
            console.log('\n🔄 Compiling context...');
            const { messages, debug } = session.compile({
                userMessage,
                budgetTokens: BUDGET_TOKENS
            });

            // Print debug info
            console.log(`\n📊 Debug Info:`);
            console.log(`  Token Estimate: ${debug.tokenEstimate} / ${BUDGET_TOKENS}`);
            console.log(`  Included Artifacts: ${debug.includedArtifacts.length}`);
            console.log(`  Dropped Artifacts: ${debug.droppedArtifacts.length}`);
            if (debug.includedArtifacts.length > 0) {
                console.log(`  Artifact IDs: ${debug.includedArtifacts.map(id => id.slice(0, 8)).join(', ')}...`);
            }

            // Call LLM (stubbed or OpenAI)
            console.log('\n🤖 Assistant: ');
            const assistantText = await callLLM(messages);
            console.log(assistantText);

            // Observe response
            session.observe({ assistantText });

            // Show extracted items if any
            const state = session.getState();
            if (state.decisions.length > 0) {
                console.log(`\n✅ Decisions tracked: ${state.decisions.length}`);
            }
            if (state.constraints.length > 0) {
                console.log(`⚠️  Constraints tracked: ${state.constraints.length}`);
            }
            if (state.openThreads.length > 0) {
                console.log(`❓ Open threads: ${state.openThreads.length}`);
            }

        } catch (error) {
            console.error('\n❌ Error:', error);
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\n👋 Goodbye!');
        process.exit(0);
    });
}

main().catch(console.error);
