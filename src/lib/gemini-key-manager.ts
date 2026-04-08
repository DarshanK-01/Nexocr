/**
 * Gemini Key Manager — singleton with round-robin rotation,
 * failure tracking, and 60-second cooldown per key.
 */

const FAILURE_THRESHOLD = 2;
const BLOCK_DURATION_MS = 60_000;

interface KeyState {
  key: string;
  suffix: string;
  failCount: number;
  blockedUntil: number | null;
}

class GeminiKeyManager {
  private keys: KeyState[] = [];
  private index = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    const count = parseInt(process.env.GEMINI_API_KEY_COUNT || '0', 10);

    if (count > 0) {
      for (let i = 1; i <= count; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key) this.keys.push(this.makeState(key));
      }
    }

    // Fallback to plain GEMINI_API_KEY if no numbered keys found
    if (this.keys.length === 0) {
      const fallback = process.env.GEMINI_API_KEY;
      if (fallback) this.keys.push(this.makeState(fallback));
    }

    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured. Set GEMINI_API_KEY or GEMINI_API_KEY_1..N in .env');
    }
  }

  private makeState(key: string): KeyState {
    return { key, suffix: key.slice(-4), failCount: 0, blockedUntil: null };
  }

  private isBlocked(state: KeyState): boolean {
    if (state.blockedUntil === null) return false;
    if (Date.now() >= state.blockedUntil) {
      // Auto-unblock after cooldown
      state.blockedUntil = null;
      state.failCount = 0;
      return false;
    }
    return true;
  }

  getNextKey(): string {
    const total = this.keys.length;
    for (let i = 0; i < total; i++) {
      const state = this.keys[this.index % total];
      this.index = (this.index + 1) % total;
      if (!this.isBlocked(state)) return state.key;
    }
    // All keys blocked — return least-recently-blocked key anyway
    const soonest = this.keys.reduce((a, b) =>
      (a.blockedUntil ?? 0) < (b.blockedUntil ?? 0) ? a : b
    );
    return soonest.key;
  }

  markFailure(key: string) {
    const state = this.keys.find(k => k.key === key);
    if (!state) return;
    state.failCount += 1;
    if (state.failCount >= FAILURE_THRESHOLD) {
      state.blockedUntil = Date.now() + BLOCK_DURATION_MS;
      console.warn(`[KeyManager] Key ...${state.suffix} blocked for 60s after ${state.failCount} failures`);
    }
  }

  markSuccess(key: string) {
    const state = this.keys.find(k => k.key === key);
    if (!state) return;
    state.failCount = 0;
    state.blockedUntil = null;
  }

  getStatus() {
    return this.keys.map(({ suffix, failCount, blockedUntil }) => ({
      keySuffix: `...${suffix}`,
      failCount,
      isBlocked: blockedUntil !== null && Date.now() < blockedUntil,
      unblocksAt: blockedUntil ? new Date(blockedUntil).toISOString() : null,
    }));
  }
}

// Singleton — safe in Next.js server context
const globalForKeyManager = globalThis as unknown as { _geminiKeyManager?: GeminiKeyManager };
export const keyManager = globalForKeyManager._geminiKeyManager ??= new GeminiKeyManager();
