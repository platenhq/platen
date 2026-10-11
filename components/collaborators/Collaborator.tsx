import Image from "next/image";
import React, { useState } from "react";
import UserTypeSelector from "@/components/shared/UserTypeSelector";
import { Button } from "@/components/ui/button";
import { removeCollaborator, updateDocumentAccess } from "@/lib/actions/room.actions";

const Collaborator = ({ roomId, email, creatorId, collaborator, user }: CollaboratorProps) => {
  const [userType, setUserType] = useState(collaborator.userType || "viewer");
  const [loading, setLoading] = useState(false);

  const shareDocumentHandler = async (type: string) => {
    setLoading(true);

    await updateDocumentAccess({
      roomId,
      email,
      userType: type as UserType,
      updatedBy: user,
    });

    setLoading(false);
  };
  const removeDocumentHandler = async (email: string) => {
    setLoading(true);

    await removeCollaborator({
      roomId,
      email,
    });

    setLoading(false);
  };

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-3 overflow-hidden">
        <Image
          src={collaborator.avatar}
          alt={collaborator.name}
          width={36}
          height={36}
          className="border-border/80 size-9 shrink-0 rounded-full border object-cover shadow-xs"
        />

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <p className="text-foreground truncate text-xs font-semibold sm:text-sm">
              {collaborator.name}
            </p>
            {loading && (
              <span className="text-muted shrink-0 animate-pulse text-[11px] font-normal">
                Updating...
              </span>
            )}
          </div>
          <p className="text-muted truncate text-xs">{collaborator.email}</p>
        </div>
      </div>

      {creatorId === collaborator.id ? (
        <span className="border-border bg-surface-secondary text-muted shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium">
          Owner
        </span>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <UserTypeSelector
            userType={userType}
            setUserType={setUserType || "viewer"}
            onClickHandler={shareDocumentHandler}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive h-8 px-2.5 text-xs transition-colors"
            onClick={() => removeDocumentHandler(collaborator.email)}
            disabled={loading}
          >
            Remove
          </Button>
        </div>
      )}
    </li>
  );
};

export default Collaborator;
