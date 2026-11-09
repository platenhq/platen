import { auth, currentUser } from "@clerk/nextjs/server";

export interface SessionUser {
  id: string;
  email: string;
}

// Emails looked up from Clerk, so a page load only needs the network once per user per window.
// Per server instance; the Liveblocks auth route keeps a similar cache.
const emailCache = new Map<string, { email: string; cachedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * The signed-in user's id and email. Read from the signed session token without a network call
 * when the token carries an email claim; otherwise fetched from Clerk once and cached. Returns
 * null when nobody is signed in.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const claimEmail = sessionClaims?.email ?? sessionClaims?.primaryEmail;
  if (typeof claimEmail === "string" && claimEmail) {
    return { id: userId, email: claimEmail };
  }

  const cached = emailCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { id: userId, email: cached.email };
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  emailCache.set(userId, { email, cachedAt: Date.now() });
  return { id: userId, email };
}
