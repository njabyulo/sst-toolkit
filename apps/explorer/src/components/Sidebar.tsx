import { Package } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background p-4">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-2 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">SST Visualizer</span>
          <span className="text-xs text-muted-foreground">State Explorer</span>
        </div>
      </div>
    </aside>
  );
}

