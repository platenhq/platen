import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserTypeSelector = ({ userType, setUserType, onClickHandler }: UserTypeSelectorParams) => {
  const accessChangeHandler = (type: UserType) => {
    setUserType(type);

    if (onClickHandler) {
      onClickHandler(type);
    }
  };

  return (
    <Select value={userType} onValueChange={(type: UserType) => accessChangeHandler(type)}>
      <SelectTrigger className="text-muted hover:text-foreground border-muted/30 w-fit cursor-pointer bg-transparent px-2.5 py-1 text-xs font-medium focus:ring-0 focus:ring-offset-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-surface min-w-28 rounded-xl border shadow-2xl">
        <SelectItem value="viewer" className="cursor-pointer text-xs">
          Can view
        </SelectItem>
        <SelectItem value="editor" className="cursor-pointer text-xs">
          Can edit
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default UserTypeSelector;
