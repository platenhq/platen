import { Composer, Thread } from "@liveblocks/react-ui";
import { useThreads } from "@liveblocks/react/suspense";
import React from "react";
import { BaseMetadata, ThreadData } from "@liveblocks/client";
import { useIsThreadActive } from "@liveblocks/react-lexical";
import { cn } from "@/lib/utils";

const ThreadWrapper = ({ thread }: { thread: ThreadData<BaseMetadata> }) => {
  const isActive = useIsThreadActive(thread.id);
  return (
    <Thread
      thread={thread}
      data-state={isActive ? "active" : null}
      className={cn(
        "w-full max-w-[800px] overflow-hidden rounded-md border border-[#cccccc] shadow-sm transition-all lg:w-[350px] dark:border-[#444444]",
        isActive && "border-2 !border-[#00a2c9] shadow-md",
        thread.resolved && "opacity-40",
      )}
    />
  );
};

const Comments = () => {
  const { threads } = useThreads();
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 lg:w-fit">
      <Composer className="w-full max-w-[800px] rounded-md border border-[#cccccc] shadow-sm lg:w-[350px] dark:border-[#444444]" />

      {threads.map((thread) => (
        <ThreadWrapper key={thread.id} thread={thread} />
      ))}
    </div>
  );
};

export default Comments;
