// Token budget enforcement

import type { SessionState } from '../runtime/types.js';
import { estimateTokens } from './tokenEstimate.js';
import type { EvidenceItem } from './selectEvidence.js';

export interface BudgetResult {
    included: EvidenceItem[];
    dropped: EvidenceItem[];
    tokenEstimate: number;
    rationale: string;
}

export function applyBudget(
    candidates: EvidenceItem[],
    state: SessionState,
    budgetTokens: number,
    policyPrefix?: string
): BudgetResult {
    // Estimate tokens for fixed parts
    const prefixTokens = policyPrefix ? estimateTokens(policyPrefix) : 0;
    const stateTokens = estimateTokens(JSON.stringify(state));

    // Reserve space for user message (estimate ~100 tokens)
    const userMessageReserve = 100;

    // Reserve space for message structure overhead
    const messageOverhead = 50;

    let remaining = budgetTokens - prefixTokens - stateTokens - userMessageReserve - messageOverhead;
    const included: EvidenceItem[] = [];
    const dropped: EvidenceItem[] = [];

    // Separate pinned from unpinned
    const pinned = candidates.filter(item => item.artifact.pinned);
    const unpinned = candidates.filter(item => !item.artifact.pinned);

    // Always include pinned artifacts first (they should never be dropped)
    for (const item of pinned) {
        const artifactTokens = estimateTokens(item.artifact.content);
        if (remaining >= artifactTokens) {
            included.push(item);
            remaining -= artifactTokens;
        } else {
            // Truncate pinned artifacts if needed, but never drop
            const maxChars = Math.max(remaining * 4, 100);
            const truncatedContent = item.artifact.content.slice(0, maxChars) + '\n... [truncated]';
            included.push({
                ...item,
                artifact: {
                    ...item.artifact,
                    content: truncatedContent
                },
                rationale: item.rationale + ' (pinned, truncated to fit budget)'
            });
            remaining = 0;
        }
    }

    // Then add unpinned artifacts by priority until budget exhausted
    for (const item of unpinned) {
        const artifactTokens = estimateTokens(item.artifact.content);

        if (remaining >= artifactTokens) {
            included.push(item);
            remaining -= artifactTokens;
        } else {
            // Try truncating if this is a high-priority item and we have some space
            if (item.priority >= 80 && remaining > 100) {
                // Truncate content to fit
                const maxChars = remaining * 4; // Convert tokens back to chars
                const truncatedContent = item.artifact.content.slice(0, maxChars) + '\n... [truncated]';

                included.push({
                    ...item,
                    artifact: {
                        ...item.artifact,
                        content: truncatedContent
                    },
                    rationale: item.rationale + ' (truncated to fit budget)'
                });

                remaining = 0;
            } else {
                dropped.push(item);
            }
        }
    }

    const totalUsed = budgetTokens - remaining;

    return {
        included,
        dropped,
        tokenEstimate: totalUsed,
        rationale: `Included ${included.length} artifacts (${totalUsed} tokens), dropped ${dropped.length} to fit ${budgetTokens} token budget`
    };
}
