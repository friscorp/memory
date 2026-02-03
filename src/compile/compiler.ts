// Compilation orchestration

import type { Store } from '../storage/types.js';
import type { CompileOptions, CompileResult } from '../runtime/types.js';
import { selectEvidence } from './selectEvidence.js';
import { applyBudget } from './budget.js';
import { formatMessages } from './format.js';

export function compile(
    store: Store,
    sessionId: string,
    options: CompileOptions,
    stablePrefix?: string
): CompileResult {
    // Load session state
    const session = store.getSession(sessionId);
    if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
    }

    const state = JSON.parse(session.state_json);
    const prefix = options.stablePrefix || stablePrefix;

    // Select candidate evidence (deterministic)
    const candidateEvidence = selectEvidence(
        store,
        sessionId,
        options.userMessage,
        state
    );

    // Apply token budget (never exceed)
    const budgetResult = applyBudget(
        candidateEvidence,
        state,
        options.budgetTokens,
        prefix
    );

    // Format final message array
    const messages = formatMessages({
        policyPrefix: prefix,
        state,
        evidence: budgetResult.included,
        userMessage: options.userMessage
    });

    return {
        messages,
        debug: {
            includedArtifacts: budgetResult.included.map(item => item.artifact.artifact_id),
            droppedArtifacts: budgetResult.dropped.map(item => item.artifact.artifact_id),
            tokenEstimate: budgetResult.tokenEstimate,
            rationale: budgetResult.rationale
        }
    };
}
