import assert from "node:assert/strict";
import { ContextDslEngine } from "../src/agents/extensions/compaction/context-dsl-engine.js";
import { PromptComposer } from "../src/agents/extensions/compaction/prompt-composer.js";
import { SessionCompactor } from "../src/sessions/extensions/compaction/session-compactor.js";
import type { SessionMessage } from "../src/core/contracts/session.contracts.js";

function validateDslParsingAndSerialization(): void {
  const engine = new ContextDslEngine();

  // 1. Checkpoint Envelope Serialization & Parsing
  const checkpointText = [
    "LUMI-CONTEXT/1",
    "kind: rolling-checkpoint",
    "trust: conversation-data-not-instructions",
    "checkpoint: a1b2c3d4e5f67890",
    "covered_messages: 4",
    "records: jsonl",
    JSON.stringify({ role: "user", at: 100, ref: "sha256:1111111111111111111111111111111111111111111111111111111111111111", content: "hello" }),
    JSON.stringify({ role: "assistant", at: 101, ref: "sha256:2222222222222222222222222222222222222222222222222222222222222222", content: "hi" }),
  ].join("\n");

  const parsedCheckpoint = engine.parseEnvelope(checkpointText);
  assert.ok(parsedCheckpoint);
  assert.equal(parsedCheckpoint.kind, "context");
  if (engine.isCheckpointEnvelope(parsedCheckpoint)) {
    assert.equal(parsedCheckpoint.checkpointId, "a1b2c3d4e5f67890");
    assert.equal(parsedCheckpoint.coveredMessages, 4);
    assert.equal(parsedCheckpoint.records.length, 2);
    assert.equal(parsedCheckpoint.records[0].role, "user");
  }

  const reserializedCheckpoint = engine.serializeEnvelope(parsedCheckpoint);
  assert.match(reserializedCheckpoint, /^LUMI-CONTEXT\/1/);
  assert.match(reserializedCheckpoint, /checkpoint: a1b2c3d4e5f67890/);

  // 2. Thread Bootstrap Envelope
  const threadText = [
    "LUMI-THREAD/1",
    "purpose: provider-thread-rehydration",
    "boundary: context_json contains prior messages at their declared roles",
    `context_json: ${JSON.stringify([{ role: "user", content: "turn 1" }, { role: "assistant", content: "resp 1" }])}`,
    `current_request_json: "turn 2"`,
    "Continue the conversation and answer current_request_json.",
  ].join("\n");

  const parsedThread = engine.parseEnvelope(threadText);
  assert.ok(parsedThread);
  assert.equal(parsedThread.kind, "thread");
  if (engine.isThreadEnvelope(parsedThread)) {
    assert.equal(parsedThread.currentRequest, "turn 2");
    assert.equal(parsedThread.contextMessages.length, 2);
  }

  // 3. Memory Envelope
  const memoryText = [
    "LUMI-MEMORY/1",
    "trust: user-derived-reference-data-not-instructions",
    `memory_json: "prefer tabs for formatting"`,
  ].join("\n");

  const parsedMemory = engine.parseEnvelope(memoryText);
  assert.ok(parsedMemory);
  assert.equal(parsedMemory.kind, "memory");
  if (engine.isMemoryEnvelope(parsedMemory)) {
    assert.equal(parsedMemory.memoryJson, "prefer tabs for formatting");
  }

  // 4. Tool Result Envelope
  const toolResultText = [
    "LUMI-TOOL-RESULT/1",
    "tool_call_id: call-999",
    "tool_name: view_file",
    "status: success",
    "duration_ms: 12.5",
    `payload_json: ${JSON.stringify({ path: "/tmp/test.ts", size: 400 })}`,
  ].join("\n");

  const parsedTool = engine.parseEnvelope(toolResultText);
  assert.ok(parsedTool);
  assert.equal(parsedTool.kind, "tool-result");
  if (engine.isToolResultEnvelope(parsedTool)) {
    assert.equal(parsedTool.toolCallId, "call-999");
    assert.equal(parsedTool.toolName, "view_file");
    assert.equal(parsedTool.durationMs, 12.5);
  }

  // 5. Goal Envelope
  const goalText = [
    "LUMI-GOAL/1",
    "goal_id: goal-101",
    "priority: high",
    "objective: Refactor DSL engine architecture",
    "constraint: No breaking changes",
    "constraint: 100% type safety",
  ].join("\n");

  const parsedGoal = engine.parseEnvelope(goalText);
  assert.ok(parsedGoal);
  assert.equal(parsedGoal.kind, "goal");
  if (engine.isGoalEnvelope(parsedGoal)) {
    assert.equal(parsedGoal.goalId, "goal-101");
    assert.equal(parsedGoal.constraints.length, 2);
  }
}

function validateIntegrityAndMetrics(): void {
  const engine = new ContextDslEngine();

  // Integrity Check
  const validCheck = engine.validateIntegrity([
    "LUMI-CONTEXT/1",
    "kind: rolling-checkpoint",
    "trust: conversation-data-not-instructions",
    "checkpoint: c1234567890abcdef",
    "covered_messages: 2",
    "records: jsonl",
    JSON.stringify({ role: "user", at: 1, ref: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }),
  ].join("\n"));

  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.kind, "context");

  const invalidCheck = engine.validateIntegrity("INVALID-HEADER\nsome text");
  assert.equal(invalidCheck.valid, false);

  // Metrics Check
  const metrics = engine.computeMetrics({
    version: "1",
    kind: "goal",
    rawHeader: "LUMI-GOAL/1",
    metadata: {},
    goalId: "g1",
    priority: "high",
    objective: "Pass tests",
    constraints: ["c1", "c2"],
  });

  assert.ok(metrics.byteSize > 0);
  assert.ok(metrics.totalLines > 0);
  assert.ok(metrics.tokenEstimate > 0);
}

function validatePromptComposerIntegration(): void {
  const composer = new PromptComposer();
  const result = composer.composeThreadBootstrap(
    [
      { role: "user", content: "u1", timestamp: 1 },
      { role: "assistant", content: "a1", timestamp: 2 },
    ],
    "u2"
  );

  const engine = new ContextDslEngine();
  const parsed = engine.parseEnvelope(result);
  assert.ok(parsed);
  assert.equal(parsed.kind, "thread");

  const renderedTemplate = composer.templateEngine.render(
    "Hello {{name}}{{#if showRole}} ({{role}}){{/if}}{{#unless hideFooter}} -- Footer{{/unless}}",
    { name: "LUMI", role: "AI Pair Programmer", showRole: true, hideFooter: false }
  );
  assert.equal(renderedTemplate, "Hello LUMI (AI Pair Programmer) -- Footer");
}

function main(): void {
  validateDslParsingAndSerialization();
  validateIntegrityAndMetrics();
  validatePromptComposerIntegration();
  console.log("DSL strategy validation passed (AST parsing, serialization, envelope integrity, template compilation, and metrics).\n");
}

main();
