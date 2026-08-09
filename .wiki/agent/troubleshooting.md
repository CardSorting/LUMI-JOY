# Troubleshooting & Diagnostic Guide

## 1. Type-Checking Failures (`npm run check`)

- **Symptom**: `tsc` error regarding parameter properties or `enum` syntax.
- **Cause**: Using non-erasable TypeScript features. Node's `--experimental-strip-types` / strip-only mode fails when encountering non-erasable syntax.
- **Fix**: Replace parameter properties with explicit fields and constructor assignments. Replace `enum` with union types.

## 2. ESM Import Resolution

- **Symptom**: `Cannot find module './agent-config'` at runtime under Node ESM.
- **Cause**: Missing `.js` file extensions in relative import paths under `"moduleResolution": "NodeNext"`.
- **Fix**: Ensure all relative TypeScript imports specify `.js` extension (e.g. `import { AgentConfig } from "./agent-config.js"`).

## 3. Hydrating Workspace Dependencies

- **Command**: `npm install --ignore-scripts`
- **Rule**: Never run lifecycle scripts automatically during dependency hydration.
