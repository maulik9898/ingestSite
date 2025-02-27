"use client";

import { ModeSwitcher } from "@/components/ui/mode-switcher";

export function MainNav() {
  return (
    <div className="relative mx-4 flex items-center w-full">
      <div className="flex mr-auto items-center gap-2">
        <span className="font-bold inline-block text-xl">
          Ingest<span className="text-red-500">Site</span>
        </span>
      </div>
      <div className="ml-auto">
        <ModeSwitcher />
      </div>
    </div>
  );
}
