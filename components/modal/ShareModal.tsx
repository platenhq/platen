"use client";

import { useState } from "react";
import { useSelf } from "@liveblocks/react/suspense";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import UserTypeSelector from "@/components/shared/UserTypeSelector";
import Collaborator from "@/components/collaborators/Collaborator";
import { updateDocumentAccess } from "@/lib/actions/room.actions";

const ShareModal = ({
  roomId,
  collaborators,
  creatorId,
  currentUserType,
}: ShareDocumentDialogProps) => {
  const user = useSelf();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("viewer");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareDocument = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter an email address");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      await updateDocumentAccess({
        roomId,
        email: trimmedEmail,
        userType: userType as UserType,
        updatedBy: user.info,
      });
      setEmail("");
    } catch (error) {
      console.error("Error updating document access:", error);
      setErrorMessage("Failed to invite collaborator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary-hover flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium shadow-xs transition-colors active:scale-[0.98]"
          disabled={currentUserType !== "editor"}
        >
          <Share2 className="size-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex w-full max-w-lg flex-col gap-5 rounded-lg p-6">
        <DialogHeader className="">
          <DialogTitle className="text-foreground text-base font-semibold sm:text-lg">
            Share document
          </DialogTitle>
          <DialogDescription className="text-muted text-xs">
            Invite collaborators to view or edit this document in real time.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="border-border bg-surface-secondary/70 focus-within:border-primary/50 focus-within:ring-primary/40 flex flex-1 items-center rounded-xl border p-1 transition-all focus-within:ring-1">
              <Input
                id="email"
                type="email"
                placeholder="Add people by email..."
                className="text-foreground placeholder:text-muted h-8 flex-1 border-none bg-transparent px-2 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    e.preventDefault();
                    handleShareDocument();
                  }
                }}
              />
              <UserTypeSelector userType={userType} setUserType={setUserType} />
            </div>

            <Button
              type="submit"
              onClick={handleShareDocument}
              className="bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-xl px-4 text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
              disabled={loading || !email.trim()}
            >
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </div>

          {errorMessage && <p className="text-destructive text-xs font-medium">{errorMessage}</p>}
        </div>

        {/* Share Link Card */}
        <div className="border-border bg-surface-canvas flex items-center justify-between rounded-xl border p-3.5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex min-w-0 flex-col">
              <p className="text-foreground text-xs font-medium">General access</p>
              <p className="text-muted truncate text-xs">
                Anyone with access can view this document
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-border bg-surface text-foreground hover:bg-surface-hover flex shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs shadow-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="font-medium text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="text-muted size-3.5" />
                <span>Copy link</span>
              </>
            )}
          </Button>
        </div>

        {/* Collaborators List */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-xs font-semibold">People with access</p>
            <span className="bg-surface-secondary text-muted rounded-full px-2 py-0.5 text-[11px] font-medium">
              {collaborators.length}
            </span>
          </div>

          <ul className="divide-border/50 flex max-h-56 flex-col divide-y overflow-y-auto pr-1">
            {collaborators.map((collaborator) => (
              <Collaborator
                key={collaborator.id}
                roomId={roomId}
                email={collaborator.email}
                collaborator={collaborator}
                creatorId={creatorId}
                user={user.info}
              />
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
