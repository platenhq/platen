"use client";

import React from "react";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { FileMenu } from "./menus/FileMenu";
import { EditMenu } from "./menus/EditMenu";
import { ViewMenu } from "./menus/ViewMenu";
import { InsertMenu } from "./menus/InsertMenu";
import { FormatMenu } from "./menus/FormatMenu";
import { ToolsMenu } from "./menus/ToolsMenu";
import { HelpMenu } from "./menus/HelpMenu";

export const MenuBar: React.FC = () => {
  const isEditable = useLexicalEditable();

  return (
    <div className="menu-bar-strip border-border/60 bg-surface text-foreground flex w-full items-center gap-0.5 overflow-x-auto border-b px-3 py-0.5 pl-5 select-none">
      <FileMenu disabled={!isEditable} />
      <EditMenu disabled={!isEditable} />
      <ViewMenu disabled={!isEditable} />
      <InsertMenu disabled={!isEditable} />
      <FormatMenu disabled={!isEditable} />
      <ToolsMenu disabled={!isEditable} />
      <HelpMenu disabled={!isEditable} />
    </div>
  );
};

export default MenuBar;
