import DocumentClient from "@/components/shared/DocumentClient";
import Loader from "@/components/shared/Loader";
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const Document = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const room = await getDocument({
    roomId: id,
    userId: clerkUser.emailAddresses[0].emailAddress,
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

  const currentUserType = room.usersAccesses[clerkUser.emailAddresses[0].emailAddress]?.includes(
    "room:write",
  )
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
