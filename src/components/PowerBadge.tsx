import { Zap } from "lucide-react";

export default function PowerBadge() {

  return (
    <div className="p-0.5 bg-black dark:bg-gray-200 rounded-full">
      <Zap size={10} className="dark:hidden text-white" fill="#fff" />
      <Zap size={10} className="hidden dark:block text-black" fill="#000" />
    </div>
  );
}