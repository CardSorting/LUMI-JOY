export interface KeybindingBinding {
  action: string;
  shortcut: string;
  description?: string;
}

/**
 * Pass 94: Keybindings Controller
 * Ingests configurable keybindings & shortcut mapping concepts from `packages/coding-agent/src/core/keybindings.ts`.
 * Manages CLI keyboard shortcut mappings and matches input key combinations.
 */
export class KeybindingsController {
  private keybindings: Map<string, KeybindingBinding>;

  constructor() {
    this.keybindings = new Map([
      ["ctrl+c", { action: "cancel", shortcut: "ctrl+c", description: "Cancel current turn execution" }],
      ["ctrl+d", { action: "exit", shortcut: "ctrl+d", description: "Exit interactive session" }],
      ["ctrl+l", { action: "clear", shortcut: "ctrl+l", description: "Clear terminal buffer" }],
      ["ctrl+r", { action: "rewind", shortcut: "ctrl+r", description: "Rewind session to last snapshot" }],
    ]);
  }

  registerKeybinding(action: string, shortcut: string, description?: string): KeybindingBinding {
    const binding: KeybindingBinding = { action, shortcut, description };
    this.keybindings.set(shortcut.toLowerCase(), binding);
    return binding;
  }

  matchesKey(shortcut: string, eventKey: string): boolean {
    return shortcut.trim().toLowerCase() === eventKey.trim().toLowerCase();
  }

  getKeybindingMap(): ReadonlyMap<string, KeybindingBinding> {
    return this.keybindings;
  }

  getActionForShortcut(shortcut: string): string | undefined {
    return this.keybindings.get(shortcut.toLowerCase())?.action;
  }
}
