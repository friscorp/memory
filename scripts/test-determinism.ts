/**
 * Fast determinism test for CI gates
 * Verifies that compiling the same session+message produces identical output
 */

import { createRuntime } from "../src/index";
import fs from "fs";
import path from "path";

const STORAGE_PATH = "./.memory-runtime/determinism-test.sqlite";

async function runDeterminismTest(): Promise<boolean> {
    // Clean storage
    if (fs.existsSync(path.dirname(STORAGE_PATH))) {
        fs.rmSync(path.dirname(STORAGE_PATH), { recursive: true, force: true });
    }

    const runtime = createRuntime({ storagePath: STORAGE_PATH });
    const session = runtime.session("determinism-test");

    // Ingest test data
    await session.ingest({
        type: "snippet",
        payload: {
            source: "test.ts",
            content: "const x = 1;\nconst y = 2;\nconst z = x + y;",
            meta: { path: "test.ts", startLine: 1, endLine: 3 }
        }
    });

    await session.ingest({
        type: "snippet",
        payload: {
            source: "util.ts",
            content: "export function add(a: number, b: number) { return a + b; }",
            meta: { path: "util.ts", startLine: 1, endLine: 1 }
        }
    });

    await session.ingest({
        type: "user_message",
        payload: { content: "What does this code do?" }
    });

    // Compile twice with identical inputs
    const userMessage = "Explain the add function";
    const budgetTokens = 2000;

    const result1 = await session.compile({ userMessage, budgetTokens });
    const result2 = await session.compile({ userMessage, budgetTokens });

    // Compare
    const messages1 = JSON.stringify(result1.messages);
    const messages2 = JSON.stringify(result2.messages);

    return messages1 === messages2;
}

async function main() {
    console.log("Running determinism test...\n");

    const isDeterministic = await runDeterminismTest();

    if (isDeterministic) {
        console.log("✅ PASS: Compilation is deterministic");
        console.log("   Same session + message produces identical output");
        process.exit(0);
    } else {
        console.log("❌ FAIL: Compilation is NOT deterministic");
        console.log("   Same session + message produced different outputs");
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("❌ FAIL:", err.message);
    process.exit(1);
});
