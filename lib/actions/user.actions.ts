"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { liveblocks } from "@/lib/liveblocks";

export const getClerkUsers = async ({ userIds }: { userIds: string[] }) => {
  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: userIds,
    });

    const users = data.map((user) => ({
      id: user.id,
      name: user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.emailAddresses[0]?.emailAddress || "Anonymous",
      email: user.emailAddresses[0]?.emailAddress || "",
      avatar: user.imageUrl,
    }));

    const sortedUsers = userIds
      .map((email) => {
        const found = users.find((user) => user.email === email);
        if (found) return found;
        return {
          id: email,
          name: email.split("@")[0] || email,
          email: email,
          avatar: "",
        };
      })
      .filter(Boolean);

    return JSON.parse(JSON.stringify(sortedUsers));
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return userIds.map((email) => ({
      id: email,
      name: email.split("@")[0] || email,
      email: email,
      avatar: "",
    }));
  }
};

export const getDocumentUsers = async ({
  roomId,
  currentUser,
  text,
}: {
  roomId: string;
  currentUser: string;
  text: string;
}) => {
  try {
    const room = await liveblocks.getRoom(roomId);
    const users = Object.keys(room.usersAccesses).filter((email) => email !== currentUser);

    if (text.length) {
      const lowerCaseText = text.toLowerCase();

      const filteredUsers = users.filter((email) =>
        email.toLocaleLowerCase().includes(lowerCaseText),
      );

      return JSON.parse(JSON.stringify(filteredUsers));
    }

    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.log(`Error fetching document users: ${error}`);
  }
};
