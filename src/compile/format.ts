// Message formatting for LLM API

import type { SessionState } from '../runtime/types.js';
import type { EvidenceItem } from './selectEvidence.js';

export interface FormatOptions {
    policyPrefix?: string;
    state: SessionState;
    evidence: EvidenceItem[];
    userMessage: string;
}

export function formatMessages(options: FormatOptions): Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
}> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Build system message parts
    const systemParts: string[] = [];

    // 1. Stable prefix (if provided)
    if (options.policyPrefix) {
        systemParts.push(options.policyPrefix);
    }

    // 2. Session state as JSON block
    systemParts.push('# Session State\n');
    systemParts.push('```json');
    systemParts.push(JSON.stringify(options.state, null, 2));
    systemParts.push('```');

    // 3. Evidence block
    if (options.evidence.length > 0) {
        systemParts.push('\n# Evidence\n');

        for (const item of options.evidence) {
            const meta = item.artifact.meta_json ? JSON.parse(item.artifact.meta_json) : {};
            const source = meta.path || item.artifact.source;

            systemParts.push(`## ${item.artifact.kind}: ${source}`);
            systemParts.push(`Priority: ${item.priority} - ${item.rationale}\n`);
            systemParts.push('```');
            systemParts.push(item.artifact.content);
            systemParts.push('```\n');
        }
    }

    // Combine all system parts
    messages.push({
        role: 'system',
        content: systemParts.join('\n')
    });

    // Add user message
    messages.push({
        role: 'user',
        content: options.userMessage
    });

    return messages;
}
