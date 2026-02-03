// LLM adapter - supports stubbed responses or OpenAI

import OpenAI from 'openai';

const USE_OPENAI = process.env.OPENAI_API_KEY !== undefined;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

let openai: OpenAI | null = null;

if (USE_OPENAI) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

export async function callLLM(
    messages: Array<{ role: string; content: string }>
): Promise<string> {
    if (USE_OPENAI && openai) {
        // Real OpenAI call
        try {
            const response = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: messages as any,
                temperature: 0.7,
                max_tokens: 1000
            });

            return response.choices[0]?.message?.content || 'No response from OpenAI';
        } catch (error) {
            console.error('OpenAI API error:', error);
            return 'Error calling OpenAI API. Falling back to stub.';
        }
    } else {
        // Stubbed response
        return generateStubbedResponse(messages);
    }
}

function generateStubbedResponse(
    messages: Array<{ role: string; content: string }>
): string {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';

    // Generate a contextual stub response
    const responses = [
        `I understand you're asking about: "${userMessage}"\n\nDecision: Use TypeScript for type safety\nConstraint: Must maintain backward compatibility\nOpen: Should we add integration tests?\n\nBased on the context provided, I recommend focusing on the core functionality first.`,

        `Thanks for the question about "${userMessage}".\n\nDecision: Implement feature incrementally\nGlossary: MVP - Minimum Viable Product\n\nLet me help you with that. The key consideration here is to balance speed with quality.`,

        `Regarding "${userMessage}":\n\nConstraint: API must be RESTful\nDecision: Use JSON for data exchange\nOpen: What authentication method should we use?\n\nI'd suggest starting with a simple implementation and iterating based on feedback.`
    ];

    // Deterministic selection based on message length
    const index = userMessage.length % responses.length;
    return responses[index];
}
