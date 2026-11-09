import { Liveblocks } from "@liveblocks/node";

export const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

const LIVEBLOCKS_TIMEOUT_MS = 10_000;

/**
 * Fails a Liveblocks call that has not answered in time. The client has no timeout of its own,
 * so on a network that cannot reach Liveblocks a page would otherwise hang for the network
 * default before failing.
 */
export function withTimeout<T>(promise: Promise<T>, ms = LIVEBLOCKS_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Liveblocks did not respond within ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
