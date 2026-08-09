# Design Patterns & Workflows

## 1. Monolithic Tier Interaction Sequence

The following sequence diagram illustrates how a user prompt moves synchronously through the 3-tier architecture:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Monolith as LumiMonolith (index.ts)
    participant Agent as AgentEngine (src/agents)
    participant Session as SessionStore & Context (src/sessions)
    participant Registry as ToolRegistry (src/tooling)
    participant Sensory as Eyes / Hands / Ears (src/tooling)

    User->>Monolith: runTurn(prompt)
    Monolith->>Agent: runTurn({ prompt })
    Agent->>Session: incrementTurn() & addMessage(user)
    Agent->>Sensory: Ears.emit("turn_start")
    
    alt Prompt requires file perception
        Agent->>Registry: executeTool("view_file", { path })
        Registry->>Sensory: Eyes.readFile(path)
        Sensory-->>Registry: FileViewResult
        Registry-->>Agent: tool output
    end

    Agent->>Session: addMessage(assistant response)
    Agent->>Sensory: Ears.emit("turn_complete")
    Agent-->>Monolith: AgentStepResult
    Monolith-->>User: Step result with response & tool outputs
```

---

## 2. Tool Execution via Sensory Classification

Tools are instantiated under their sensory classification ([Eyes](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/eyes.ts#L14), [Hands](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/hands.ts#L13), [Ears](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/ears.ts#L12)) and registered in [ToolRegistry](file:///Users/bozoegg/Desktop/LUMI-NEW/src/tooling/tool-registry.ts#L11):

```typescript
this.registerTool({
  name: "view_file",
  description: "Read contents of a file (Eyes)",
  execute: async (args) => this.eyes.readFile(String(args.path))
});
```

---

## 3. Real-Time Telemetry via Ears

The `Ears` subsystem allows decouple observation of agent events without polluting engine state:

```typescript
lumi.ears.listen("turn_complete", (event) => {
  console.log(`[Turn ${event.payload.turnNumber} Done]`, event.payload.responseText);
});
```
