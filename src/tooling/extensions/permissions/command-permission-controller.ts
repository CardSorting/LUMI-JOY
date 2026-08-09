export interface CommandPermissionRule {
  allow?: string[];
  deny?: string[];
  allowRedirects?: boolean;
}

export interface PermissionValidationResult {
  allowed: boolean;
  reason: string;
  blockedSegment?: string;
}

/**
 * CommandPermissionController & Security Guardrails.
 * Absorbed from packages/codemarie/src/core/permissions (Pass 14 / ADR-012).
 *
 * Enforces shell execution security guardrails, allowlists/denylists, and
 * dangerous command pattern detection prior to terminal execution in AnchoredHands.
 */
export class CommandPermissionController {
  private readonly defaultDenyPatterns = [
    /\bsudo\b/i,
    /\brm\s+-rf\s+[\/\~]/i,
    /\bchmod\s+777\b/i,
    /\bmkfs\b/i,
    /\bdd\s+if=/i,
    />\s*\/dev\/sd/i,
  ];

  private ruleConfig: CommandPermissionRule | null = null;

  constructor(ruleConfig?: CommandPermissionRule) {
    this.ruleConfig = ruleConfig ?? null;
  }

  validateCommand(command: string): PermissionValidationResult {
    const trimmed = command.trim();
    if (!trimmed) {
      return { allowed: false, reason: "empty_command" };
    }

    // 1. Check default destructive security patterns
    for (const pattern of this.defaultDenyPatterns) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          reason: `Security Violation: Destructive shell pattern detected matching '${pattern.source}'`,
          blockedSegment: trimmed,
        };
      }
    }

    // 2. Check explicit deny rules if configured
    if (this.ruleConfig?.deny) {
      for (const denyPattern of this.ruleConfig.deny) {
        if (trimmed.includes(denyPattern)) {
          return {
            allowed: false,
            reason: `Permission Denied: Command matches deny rule '${denyPattern}'`,
            blockedSegment: trimmed,
          };
        }
      }
    }

    // 3. Check explicit allow rules if configured
    if (this.ruleConfig?.allow && this.ruleConfig.allow.length > 0) {
      const isAllowed = this.ruleConfig.allow.some((allowPattern) => trimmed.startsWith(allowPattern));
      if (!isAllowed) {
        return {
          allowed: false,
          reason: "Permission Denied: Command does not match any configured allowlist rules",
          blockedSegment: trimmed,
        };
      }
    }

    return {
      allowed: true,
      reason: "permitted",
    };
  }
}
