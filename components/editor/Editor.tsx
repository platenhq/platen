"use client";
import dynamic from "next/dynamic";
import { editorTheme } from "./plugins/editorTheme";
import ToolbarPlugin from "./plugins/toolbarPlugin/ToolbarPlugin";
import CodeHighlightPlugin from "./plugins/codeHighlightPlugin";

const CodeActionMenuPlugin = dynamic(() => import("./plugins/codeActionMenuPlugin"), {
  ssr: false,
});
const FloatingLinkEditorPlugin = dynamic(() => import("./plugins/floatingLinkEditorPlugin"), {
  ssr: false,
});
const TableCellActionMenuPlugin = dynamic(() => import("./plugins/TableCellActionMenuPlugin"), {
  ssr: false,
});
const TableCellResizerPlugin = dynamic(() => import("./plugins/TableCellResizerPlugin"), {
  ssr: false,
});

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  FloatingComposer,
  liveblocksConfig,
  LiveblocksPlugin,
  useIsEditorReady,
} from "@liveblocks/react-lexical";

import Loader from "@/components/shared/Loader";
import FloatingToolbarPlugin from "./plugins/FloatingToolbarPlugin";
import { useEffect, useMemo, useState } from "react";
import { ToolbarContext } from "@/context/ToolbarContext";
import { DocumentLayoutProvider } from "@/context/DocumentLayoutContext";
import PlaygroundNodes from "./nodes/playgroundNodes";
import { CAN_USE_DOM } from "@lexical/utils";
import LinkPlugin from "./plugins/linkPlugin";
import { useSettings } from "@/context/SettingsContext";

import EditorShell from "./EditorShell";
import TableEscapePlugin from "./plugins/TableEscapePlugin";
import EditorSanitizerPlugin from "./plugins/EditorSanitizerPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { PageBreakPlugin } from "./plugins/PageBreakPlugin";
import CalloutPlugin from "./plugins/CalloutPlugin";
import MediaEmbedPlugin from "./plugins/MediaEmbedPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import DocumentPreviewPlugin from "./plugins/DocumentPreviewPlugin";
import MenuBar from "./menubar/MenuBar";

export function Editor({ roomId, currentUserType }: Editorprops) {
  const initialConfig = useMemo(
    () =>
      liveblocksConfig({
        namespace: "MyEditor",
        nodes: [...PlaygroundNodes],
        theme: editorTheme,
        onError: (error: Error) => {
          console.error("[Lexical Error]:", error);
        },
        editable: currentUserType === "editor",
      }),
    [currentUserType],
  );

  const {
    settings: { hasLinkAttributes },
  } = useSettings();

  const ready = useIsEditorReady();
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <DocumentLayoutProvider>
        <ToolbarContext>
          <div className="bg-surface-canvas text-foreground flex size-full flex-1 flex-col overflow-hidden text-left leading-5">
            <MenuBar />
            <div className="toolbar-wrapper border-border z-20 flex min-h-11 min-w-full items-center justify-between gap-4 border-b">
              <ToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
            </div>

            {/* Wraps the shell so the comment column beside the page can read thread anchors */}
            <LiveblocksPlugin>
              <EditorShell ready={ready}>
                <div className="relative min-h-full">
                  <RichTextPlugin
                    contentEditable={
                      <div className="editor relative min-h-full" ref={onRef}>
                        <ContentEditable className="editor-input text-foreground relative min-h-175 caret-current outline-none" />
                      </div>
                    }
                    placeholder={
                      <div className="editor-placeholder text-muted pointer-events-none absolute top-0 left-0 inline-block text-sm select-none">
                        Enter some rich text...
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  {currentUserType === "editor" && <FloatingToolbarPlugin />}
                  {currentUserType === "editor" && <DocumentPreviewPlugin roomId={roomId} />}
                  <AutoFocusPlugin />
                  <EditorSanitizerPlugin />
                  <ListPlugin />
                  <CheckListPlugin />
                  <CodeHighlightPlugin />
                  <TablePlugin />
                  <TableEscapePlugin />
                  <TableCellResizerPlugin />
                  <HorizontalRulePlugin />
                  <PageBreakPlugin />
                  <CalloutPlugin />
                  <MediaEmbedPlugin />
                  <ImagesPlugin />
                  {floatingAnchorElem && !isSmallWidthViewport && (
                    <>
                      <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                      <FloatingLinkEditorPlugin
                        anchorElem={floatingAnchorElem}
                        isLinkEditMode={isLinkEditMode}
                        setIsLinkEditMode={setIsLinkEditMode}
                      />
                      <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} />
                    </>
                  )}
                  <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
                </div>
              </EditorShell>

              {/* New-comment composer; threads render beside the page from the shell */}
              <FloatingComposer className="border-border bg-surface w-87.5 overflow-hidden rounded-xl border shadow-2xl" />
            </LiveblocksPlugin>
          </div>
        </ToolbarContext>
      </DocumentLayoutProvider>
    </LexicalComposer>
  );
}
