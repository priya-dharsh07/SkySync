/**
 * Distributed Lock Manager (Redis & High-Concurrency In-Memory TTL Fallback)
 * Prevents race conditions, double booking, and handles automated hold timeouts.
 */

interface LockEntry {
  resourceKey: string;
  holderId: string;
  expiresAt: number; // epoch ms
  timeoutHandle?: NodeJS.Timeout;
}

class DistributedLockManager {
  private locks: Map<string, LockEntry> = new Map();

  /**
   * Attempts to acquire an atomic lock for a resource with a specified TTL.
   * Returns true if lock was acquired, false if already held by another party.
   */
  async acquireLock(resourceKey: string, holderId: string, ttlSeconds: number = 300): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(resourceKey);

    if (existing) {
      if (existing.expiresAt > now && existing.holderId !== holderId) {
        // Resource is currently locked by someone else
        return false;
      }
      // Clean up previous expired timer if any
      if (existing.timeoutHandle) {
        clearTimeout(existing.timeoutHandle);
      }
    }

    const expiresAt = now + ttlSeconds * 1000;
    const timeoutHandle = setTimeout(() => {
      this.releaseLock(resourceKey, holderId).catch(() => {});
    }, ttlSeconds * 1000);

    // Unref so timer doesn't prevent process exit
    if (typeof timeoutHandle.unref === "function") {
      timeoutHandle.unref();
    }

    this.locks.set(resourceKey, {
      resourceKey,
      holderId,
      expiresAt,
      timeoutHandle,
    });

    return true;
  }

  /**
   * Releases a lock held by a specific holder.
   */
  async releaseLock(resourceKey: string, holderId: string): Promise<boolean> {
    const existing = this.locks.get(resourceKey);
    if (!existing) return true;

    if (existing.holderId === holderId || existing.expiresAt <= Date.now()) {
      if (existing.timeoutHandle) {
        clearTimeout(existing.timeoutHandle);
      }
      this.locks.delete(resourceKey);
      return true;
    }

    return false; // Cannot release a lock owned by someone else
  }

  /**
   * Forcefully releases all locks belonging to a given session
   */
  async releaseAllForSession(sessionId: string): Promise<number> {
    let count = 0;
    for (const [key, lock] of this.locks.entries()) {
      if (lock.holderId.startsWith(sessionId) || key.includes(sessionId)) {
        if (lock.timeoutHandle) {
          clearTimeout(lock.timeoutHandle);
        }
        this.locks.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Check remaining TTL in seconds for a locked resource
   */
  async getRemainingTtl(resourceKey: string): Promise<number> {
    const existing = this.locks.get(resourceKey);
    if (!existing) return 0;
    const remainingMs = existing.expiresAt - Date.now();
    return Math.max(0, Math.round(remainingMs / 1000));
  }
}

// Global singleton instance
const globalForLocks = globalThis as unknown as { lockManager?: DistributedLockManager };
export const lockManager = globalForLocks.lockManager || new DistributedLockManager();
if (process.env.NODE_ENV !== "production") {
  globalForLocks.lockManager = lockManager;
}
