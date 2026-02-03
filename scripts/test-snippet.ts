import { createRuntime } from "../src/index";
import fs from "fs";

async function run() {
  const runtime = createRuntime({
    storagePath: "./.memory-runtime/runtime.sqlite",
  });

  const session = runtime.session("snippet-test");

  // 1️⃣ Read a real file (any TS file in your repo)
  const filePath = "src/runtime/session.ts";
  const text = fs.readFileSync(filePath, "utf8").slice(0, 1200);

  // 2️⃣ Ingest it as a snippet artifact
  await session.ingest({
    type: "snippet",
    payload: {
      source: filePath,
      content: text,
      meta: {
        path: filePath,
        startLine: 1,
        endLine: 80,
      },
    },
  });

  // 3️⃣ Compile context with a small budget
  const compiled = await session.compile({
    userMessage: "Where in the code could emojis be printed?",
    budgetTokens: 2000,
  });

  // 4️⃣ Print results
  console.log("\n=== DEBUG ===");
  console.log("Token estimate:", compiled.debug.tokenEstimate);
  console.log("Included artifacts:", compiled.debug.includedArtifacts.length);
  console.log("Dropped artifacts:", compiled.debug.droppedArtifacts.length);

  console.log("\n=== MESSAGES SENT TO LLM ===\n");
  compiled.messages.forEach((m, i) => {
    console.log(`--- ${i + 1}. ${m.role.toUpperCase()} ---`);
    console.log(m.content);
    console.log();
  });
}

run().catch(console.error);

