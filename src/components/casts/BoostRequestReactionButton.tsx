import { BoltIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTrigger } from "../ui/dialog";
import { BoostRequestDialogContent } from "./BoostRequestDialogContent";
import { useState } from "react";

interface BoostRequestReactionButtonProps {
  castHash: string;
  iconClass: string;
  buttonClass: string;
  backgroundCircleClass: string;
}

export default function BoostRequestReactionButton({
  castHash,
  iconClass,
  buttonClass,
  backgroundCircleClass
}: BoostRequestReactionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className={`${buttonClass} w-8 h-9 py-2`}>
          <div className={`${backgroundCircleClass} bg-red-300`}></div>
          <BoltIcon className={`${iconClass} text-gray-400 group-active:text-red-600 sm:group-hover:text-red-600`} />
        </button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="DialogOverlay" />
        <DialogContent className="DialogContent" onOpenAutoFocus={(e) => e.preventDefault()}>
          <BoostRequestDialogContent castHash={castHash} isOpen={open} setOpen={setOpen} />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
