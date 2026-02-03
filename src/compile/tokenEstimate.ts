// Token estimation utilities

/**
 * Simple token estimation using chars/4 heuristic
 * For production, consider using tiktoken or similar library
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Rough heuristic: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
}

export function estimateMessageTokens(messages: Array<{ role: string; content: string }>): number {
    let total = 0;
    for (const msg of messages) {
        // Rough overhead per message (role, formatting)
        total += 4;
        total += estimateTokens(msg.content);
    }
    return total;
}
