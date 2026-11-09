import DocumentClient from "@/components/shared/DocumentClient";
import Loader from "@/components/shared/Loader";
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const Document = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/sign-in");
  }

  // Null for a missing document or no access; throws when Liveblocks is unreachable, which the
  // route's error screen handles with a retry
  const room = await getDocument({
    roomId: id,
    userId: sessionUser.email,
  });

  if (!room) {
    redirect("/");
  }

  // TODO: Access permissions of users to access the document
  const userIds = Object.keys(room.usersAccesses);
  const users = (await getClerkUsers({ userIds })) || [];

  const usersData = users.filter(Boolean).map((user: User) => ({
    ...user,
    userType: room.usersAccesses[user.email]?.includes("room:write") ? "editor" : "viewer",
  }));

  const currentUserType = room.usersAccesses[sessionUser.email]?.includes("room:write")
    ? "editor"
    : "viewer";

  return (
    <Suspense fallback={<Loader />}>
      <DocumentClient
        roomId={id}
        roomMetadata={room.metadata}
        users={usersData}
        currentUserType={currentUserType}
      />
    </Suspense>
  );
};

export default Document;
