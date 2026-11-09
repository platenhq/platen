import React from "react";
import { getDocuments } from "@/lib/actions/room.actions";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { RoomData } from "@liveblocks/node";
import HomeDashboard from "@/components/home/HomeDashboard";

type RoomDocumentsProps = {
  data: RoomData[];
};

const Home = async () => {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Throws when Liveblocks is unreachable; the route's error screen offers a retry
  const roomDocuments: RoomDocumentsProps = await getDocuments(user.email);

  return (
    <HomeDashboard userId={user.id} email={user.email} roomDocuments={roomDocuments?.data || []} />
  );
};

export default Home;
