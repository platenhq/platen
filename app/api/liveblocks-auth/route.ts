import { liveblocks } from "@/lib/liveblocks";
import { getUserColor } from "@/lib/utils";
import { auth, clerkClient } from "@clerk/nextjs/server";

interface CachedUserInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  cachedAt: number;
}

// In-memory cache to prevent pounding Clerk API on every Liveblocks heartbeat / reconnect
const userCache = new Map<string, CachedUserInfo>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return new Response("Unauthorized", {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Check in-memory cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      const { status, body } = await liveblocks.identifyUser(
        {
          userId: cached.email || userId,
          groupIds: [],
        },
        { userInfo: cached },
      );

      return new Response(body, {
        status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const emailClaim = (sessionClaims?.email as string) || (sessionClaims?.primaryEmail as string);
    const nameClaim =
      (sessionClaims?.fullName as string) ||
      (sessionClaims?.name as string) ||
      [sessionClaims?.firstName, sessionClaims?.lastName].filter(Boolean).join(" ");
    const avatarClaim =
      (sessionClaims?.imageUrl as string) || (sessionClaims?.image as string) || "";

    let userInfo = {
      id: userId,
      name: nameClaim || "Collaborator",
      email: emailClaim || userId,
      avatar: avatarClaim,
      color: getUserColor(userId),
    };

    // If email was not present in the session claims, try hydrating via Clerk client with a quick timeout and try/catch
    if (!emailClaim) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        if (clerkUser) {
          userInfo = {
            id: userId,
            name:
              `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
              nameClaim ||
              "Collaborator",
            email: clerkUser.emailAddresses[0]?.emailAddress ?? userId,
            avatar: clerkUser.imageUrl || avatarClaim,
            color: getUserColor(userId),
          };
        }
      } catch (clerkError) {
        console.warn(
          `[liveblocks-auth] Could not hydrate user info from Clerk API, using session fallback:`,
          clerkError instanceof Error ? clerkError.message : clerkError,
        );
      }
    }

    // Save in cache
    userCache.set(userId, { ...userInfo, cachedAt: Date.now() });

    // Identify user in Liveblocks session
    const { status, body } = await liveblocks.identifyUser(
      {
        userId: userInfo.email,
        groupIds: [],
      },
      { userInfo },
    );

    return new Response(body, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[liveblocks-auth] Error authenticating Liveblocks user:", error);
    return new Response(JSON.stringify({ error: "Failed to authenticate Liveblocks session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
