import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOpenHotkeyShortcutWindow } from "@/providers/OpenHotkeyShortcutWindow";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

export default function HotkeyShortcutWindow() {
  const { openHotkeyShortcutWindow, setOpenHotkeyShortcutWindow } = useOpenHotkeyShortcutWindow();

  const rowClass = "flex flex-row gap-x-2 items-center text-sm"
  const keyboardShortcutClass = "rounded-md bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-2 py-0.5"

  return (
    <>
      <Dialog open={openHotkeyShortcutWindow} onOpenChange={setOpenHotkeyShortcutWindow}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-row gap-x-8">
            <div>
              <h2 className="font-medium mb-2">Navigation</h2>
              <ul className="space-y-1">
                <li className={rowClass}><span className="w-32">Shortcut help</span><kbd className={keyboardShortcutClass}>⌘ + /</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Home</span><kbd className={keyboardShortcutClass}>g + h</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Notifications</span><kbd className={keyboardShortcutClass}>g + n</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Mentions</span><kbd className={keyboardShortcutClass}>g + m</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Lists</span><kbd className={keyboardShortcutClass}>g + l</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Community</span><kbd className={keyboardShortcutClass}>g + c</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Bookmarks</span><kbd className={keyboardShortcutClass}>g + b</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Profile</span><kbd className={keyboardShortcutClass}>g + p</kbd></li>
                <li className={rowClass}><span className="w-32">Go to Settings</span><kbd className={keyboardShortcutClass}>g + s</kbd></li>
                <li className={rowClass}><span className="w-32">Open draft window</span><kbd className={keyboardShortcutClass}>⌘ + p</kbd></li>
              </ul>
            </div>
            <div>
              <h2 className="font-medium mb-2">Actions</h2>
              <ul className="space-y-1">
                <li className={rowClass}><span className="w-40">Move to next cast</span><kbd className={keyboardShortcutClass}>j</kbd></li>
                <li className={rowClass}><span className="w-40">Move to previous cast</span><kbd className={keyboardShortcutClass}>k</kbd></li>
                <li className={rowClass}><span className="w-40">Open cast</span><kbd className={keyboardShortcutClass}>Enter</kbd></li>
                <li className={rowClass}><span className="w-40">Close cast</span><kbd className={keyboardShortcutClass}>Esc</kbd></li>
                <li className={rowClass}><span className="w-40">Like cast</span><kbd className={keyboardShortcutClass}>l</kbd></li>
                <li className={rowClass}><span className="w-40">Recast cast</span><kbd className={keyboardShortcutClass}>c</kbd></li>
                <li className={rowClass}><span className="w-40">Quote cast</span><kbd className={keyboardShortcutClass}>q</kbd></li>
                <li className={rowClass}><span className="w-40">Reply to cast</span><kbd className={keyboardShortcutClass}>r</kbd></li>
                <li className={rowClass}><span className="w-40">Switch to priority mode</span><kbd className={keyboardShortcutClass}>p</kbd></li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        className={`fixed bottom-6 right-6 rounded-full w-8 h-8 shadow-sm hidden lg:flex ${openHotkeyShortcutWindow ? "opacity-0" : "opacity-100"}`}
        onClick={() => setOpenHotkeyShortcutWindow(true)}
        aria-label="Open keyboard shortcuts"
        variant="secondary"
      >
        <p className="text-lg">?</p>
      </Button>
    </>
  );
}
