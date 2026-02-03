/**
 * Express + memory-runtime example
 * 
 * Shows how to use memory-runtime with a chat endpoint:
 * - Session ID from cookie
 * - Compile context before calling OpenAI
 * - Observe response after
 * 
 * Environment:
 *   OPENAI_API_KEY=sk-...  (required)
 *   PORT=3000              (optional)
 * 
 * Usage:
 *   npm install
 *   OPENAI_API_KEY=sk-... npm start
 *   
 *   curl -X POST http://localhost:3000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "What is the capital of France?"}'
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import OpenAI from 'openai';
import { createRuntime } from 'memory-runtime';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Initialize runtime (SQLite storage)
const runtime = createRuntime({ storagePath: './.memory/chat.sqlite' });

// Initialize OpenAI client (uses OPENAI_API_KEY env var)
const openai = new OpenAI();

// Middleware: ensure session ID cookie
app.use((req, res, next) => {
    if (!req.cookies.sessionId) {
        const sessionId = crypto.randomUUID();
        res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        req.cookies.sessionId = sessionId;
    }
    next();
});

// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required' });
    }

    const sessionId = req.cookies.sessionId;
    const session = runtime.session(sessionId);

    try {
        // 1. Ingest user message
        await session.ingest({
            type: 'user_message',
            payload: { content: message }
        });

        // 2. Compile context (2000 token budget)
        const { messages } = await session.compile({
            userMessage: message,
            budgetTokens: 2000
        });

        // 3. Call OpenAI with compiled context
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
            max_tokens: 500
        });

        const assistantText = completion.choices[0].message.content || '';

        // 4. Ingest assistant response
        await session.ingest({
            type: 'assistant_response',
            payload: { content: assistantText }
        });

        // 5. Observe to extract decisions/constraints
        session.observe({ assistantText });

        res.json({
            response: assistantText,
            sessionId,
            usage: completion.usage
        });

    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ingest code snippet (for coding assistants)
app.post('/ingest/snippet', async (req, res) => {
    const { path, content } = req.body;

    if (!path || !content) {
        return res.status(400).json({ error: 'path and content are required' });
    }

    const sessionId = req.cookies.sessionId;
    const session = runtime.session(sessionId);

    await session.ingest({
        type: 'snippet',
        payload: {
            source: path,
            content,
            meta: { path }
        }
    });

    res.json({ success: true, sessionId });
});

// Get session state
app.get('/session/state', (req, res) => {
    const sessionId = req.cookies.sessionId;
    const session = runtime.session(sessionId);
    const state = session.getState();
    res.json({ sessionId, state });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`\n   POST /chat           - Send a message`);
    console.log(`   POST /ingest/snippet - Add code context`);
    console.log(`   GET  /session/state  - View session state`);
    console.log(`\n   Example:`);
    console.log(`   curl -X POST http://localhost:${PORT}/chat \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"message": "Hello!"}'`);
});
