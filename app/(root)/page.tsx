import React from "react";
import { getDocuments } from "@/lib/actions/room.actions";
import { getDocumentPreviews } from "@/lib/db/documents";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import HomeDashboard from "@/components/home/HomeDashboard";

type MetadataValue = string | string[] | undefined;

const firstValue = (value: MetadataValue) => (Array.isArray(value) ? value[0] : value);

const Home = async () => {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Throws when Liveblocks is unreachable; the route's error screen offers a retry
  const rooms = await getDocuments(user.email);
  // Thumbnails come from the database; without it, cards keep the text preview
  const previews = await getDocumentPreviews(rooms.map((room) => room.id));

  const documents: DashboardDocument[] = rooms.map(
    ({ id, metadata, usersAccesses, createdAt, lastConnectionAt }) => {
      const preview = previews[id];
      return {
        id,
        title: firstValue(metadata.title) ?? "",
        previewHeading: firstValue(metadata.previewHeading),
        preview: firstValue(metadata.preview),
        isOwner: firstValue(metadata.email) === user.email,
        isShared: Object.keys(usersAccesses).length > 1,
        createdAt: String(createdAt),
        modifiedAt: preview?.contentSavedAt ?? String(lastConnectionAt ?? createdAt),
        thumbnailHtml: preview?.previewHtml ?? null,
        pageSize: preview?.pageSize ?? null,
        pageMargins: preview?.pageMargins ?? null,
      };
    },
  );

  return <HomeDashboard userId={user.id} email={user.email} documents={documents} />;
};

export default Home;
