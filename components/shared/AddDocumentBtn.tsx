"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDoc } from "@/lib/actions/room.actions";
import { useRouter } from "next/navigation";

const AddDocumentBtn = ({ userId, email }: AddDocumentBtnProps) => {
  const router = useRouter();
  const addDocumentHandler = async () => {
    try {
      const room = await createDoc({ userId, email });
      console.log(room);

      if (room) {
        router.push(`/documents/${room.id}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Button
      type="submit"
      onClick={addDocumentHandler}
      className="dark:shadow-lg-dark flex gap-2 bg-[#00afdb] shadow-lg transition-all duration-300 ease-in-out hover:bg-[#0081a4] dark:bg-[#00afdb] dark:hover:bg-[#0081a4]"
    >
      <Plus className="h-6 w-6 text-white" />
      <p className="hidden text-white sm:block">Start a blank document</p>
    </Button>
  );
};

export default AddDocumentBtn;
