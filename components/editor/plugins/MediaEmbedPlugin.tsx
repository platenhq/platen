"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import {
  $createYouTubeNode,
  INSERT_YOUTUBE_COMMAND,
  parseYouTubeId,
  YouTubeNode,
} from "../nodes/YouTubeNode";
import {
  $createTweetNode,
  INSERT_TWEET_COMMAND,
  parseTweetId,
  TweetNode,
} from "../nodes/TweetNode";

export default function MediaEmbedPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode, TweetNode])) {
      throw new Error("MediaEmbedPlugin: YouTubeNode or TweetNode not registered on editor");
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_YOUTUBE_COMMAND,
        (urlOrId) => {
          const videoId = parseYouTubeId(urlOrId);
          if (!videoId) return false;

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const youtubeNode = $createYouTubeNode(videoId);
              $insertNodeToNearestRoot(youtubeNode);
              // Ensure paragraph buffer follows the embed
              const nextSibling = youtubeNode.getNextSibling();
              if (!nextSibling) {
                const paragraph = $createParagraphNode();
                youtubeNode.insertAfter(paragraph);
                paragraph.select();
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        INSERT_TWEET_COMMAND,
        (urlOrId) => {
          const tweetId = parseTweetId(urlOrId);
          if (!tweetId) return false;

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const tweetNode = $createTweetNode(tweetId);
              $insertNodeToNearestRoot(tweetNode);
              // Ensure paragraph buffer follows the embed
              const nextSibling = tweetNode.getNextSibling();
              if (!nextSibling) {
                const paragraph = $createParagraphNode();
                tweetNode.insertAfter(paragraph);
                paragraph.select();
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
