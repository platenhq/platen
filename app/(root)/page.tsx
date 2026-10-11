import React from "react";
import { getDocuments } from "@/lib/actions/room.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RoomData } from "@liveblocks/node";
import HomeDashboard from "@/components/home/HomeDashboard";

type RoomDocumentsProps = {
  data: RoomData[];
};

const Home = async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const roomDocuments: RoomDocumentsProps = await getDocuments(
    clerkUser.emailAddresses[0].emailAddress,
  );

  return (
    <HomeDashboard
      userId={clerkUser.id}
      email={clerkUser.emailAddresses[0].emailAddress}
      roomDocuments={roomDocuments?.data || []}
    />
  );
};

export default Home;
