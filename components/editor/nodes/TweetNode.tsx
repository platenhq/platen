"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createCommand,
} from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ExternalLink, RotateCw, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

export type SerializedTweetNode = Spread<
  {
    id: string;
  },
  SerializedLexicalNode
>;

export const INSERT_TWEET_COMMAND: LexicalCommand<string> = createCommand("INSERT_TWEET_COMMAND");

export function parseTweetId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // If already numeric ID
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  // Matches twitter.com or x.com status URLs
  const match = trimmed.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/i);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTweet: (
          tweetId: string,
          targetEl: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement | null>;
      };
      ready?: (callback: (twttr: unknown) => void) => void;
    };
  }
}

function loadTwitterScript(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;

    if (window.twttr?.widgets) {
      resolve(window.twttr);
      return;
    }

    const existingScript = document.getElementById("twitter-wjs") as HTMLScriptElement | null;
    if (existingScript) {
      if (window.twttr?.ready) {
        window.twttr.ready((twttr) => resolve(twttr));
      } else {
        existingScript.addEventListener("load", () => {
          if (window.twttr?.ready) {
            window.twttr.ready((twttr) => resolve(twttr));
          } else {
            resolve(window.twttr);
          }
        });
        existingScript.addEventListener("error", reject);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "twitter-wjs";
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => {
      if (window.twttr?.ready) {
        window.twttr.ready((twttr) => resolve(twttr));
      } else {
        resolve(window.twttr);
      }
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function TweetComponent({ nodeKey, tweetId }: { nodeKey: NodeKey; tweetId: string }) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);
    setIsLoaded(false);

    loadTwitterScript()
      .then((twttrInstance) => {
        if (!isSubscribed || !containerRef.current) return;
        containerRef.current.replaceChildren();

        const renderFn = () => {
          const widgets =
            (
              twttrInstance as {
                widgets?: { createTweet?: (...args: unknown[]) => Promise<HTMLElement | null> };
              }
            )?.widgets || window.twttr?.widgets;

          if (!widgets?.createTweet || !containerRef.current) {
            if (isSubscribed) {
              setIsLoading(false);
              setHasError(true);
            }
            return;
          }

          widgets
            .createTweet(tweetId, containerRef.current, {
              theme: resolvedTheme === "dark" ? "dark" : "light",
              align: "center",
              conversation: "none",
            })
            .then((el: HTMLElement | null) => {
              if (isSubscribed) {
                setIsLoading(false);
                if (el) {
                  setIsLoaded(true);
                  setHasError(false);
                } else {
                  setHasError(true);
                }
              }
            })
            .catch(() => {
              if (isSubscribed) {
                setIsLoading(false);
                setHasError(true);
              }
            });
        };

        if (window.twttr?.ready) {
          window.twttr.ready(renderFn);
        } else {
          renderFn();
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setIsLoading(false);
          setHasError(true);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [tweetId, resolvedTheme, retryKey]);

  const onDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  };

  const onRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRetryKey((prev) => prev + 1);
  };

  const tweetUrl = `https://x.com/i/status/${tweetId}`;

  return (
    <div
      className={`group relative mx-auto my-4 w-full max-w-lg overflow-hidden rounded-xl border p-2 transition-all select-none ${
        isSelected
          ? "border-primary ring-primary/40 shadow-xl ring-2"
          : "border-border/80 hover:border-border shadow-xs"
      }`}
      contentEditable={false}
      onClick={(e) => {
        if (!e.defaultPrevented) {
          clearSelection();
          setSelected(true);
        }
      }}
    >
      {/* Floating Action Overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          title="Reload preview"
          onClick={onRetry}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-black/80 text-white backdrop-blur-xs transition-colors hover:bg-black"
        >
          <RotateCw className="size-3.5" />
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open post on X"
          className="flex size-7 items-center justify-center rounded-md bg-black/80 text-white backdrop-blur-xs transition-colors hover:bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          type="button"
          title="Delete post"
          onClick={onDelete}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-red-600/85 text-white backdrop-blur-xs transition-colors hover:bg-red-600"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Tweet Container */}
      <div className="relative flex min-h-24 w-full flex-col items-center justify-center">
        {/* Dedicated container for Twitter widget:
            Kept in layout with full width even while loading so Twitter can accurately calculate bounding box */}
        <div
          ref={containerRef}
          className={`flex w-full justify-center transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "pointer-events-none absolute opacity-0"
          }`}
        />

        {/* Loading Skeleton */}
        {isLoading && !hasError && (
          <div className="border-border/40 flex w-full animate-pulse flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted/60 size-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <div className="bg-muted/60 h-3.5 w-28 rounded" />
                <div className="bg-muted/40 h-2.5 w-16 rounded" />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <div className="bg-muted/50 h-3 w-full rounded" />
              <div className="bg-muted/50 h-3 w-4/5 rounded" />
            </div>
          </div>
        )}

        {/* Fallback card shown when blocked by client/adblocker or post unavailable */}
        {hasError && (
          <div className="border-border/60 bg-surface-secondary/40 flex w-full flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-xs font-semibold">Post on X (Twitter)</span>
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                <span>View on X</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <span className="text-muted-foreground truncate text-[11px]">{tweetUrl}</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground/80 text-[10px]">
                Preview blocked by client tracker shield or adblocker.
              </span>
              <button
                type="button"
                onClick={onRetry}
                className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium"
              >
                <RotateCw className="size-3" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export class TweetNode extends DecoratorNode<JSX.Element> {
  __id: string;

  static getType(): string {
    return "tweet";
  }

  static clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  getId(): string {
    return this.__id;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div");
    el.className = "tweet-embed-wrapper";
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedTweetNode): TweetNode {
    return $createTweetNode(serializedNode.id);
  }

  exportJSON(): SerializedTweetNode {
    return {
      id: this.__id,
      type: "tweet",
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-lexical-tweet-id")) {
          const id = domNode.getAttribute("data-lexical-tweet-id");
          if (id) {
            return {
              conversion: () => ({ node: $createTweetNode(id) }),
              priority: 2,
            };
          }
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-tweet-id", this.__id);
    return { element };
  }

  getTextContent(): string {
    return `https://x.com/i/status/${this.__id}`;
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <TweetComponent nodeKey={this.__key} tweetId={this.__id} />;
  }
}

export function $createTweetNode(id: string): TweetNode {
  return new TweetNode(id);
}

export function $isTweetNode(node: LexicalNode | null | undefined): node is TweetNode {
  return node instanceof TweetNode;
}
