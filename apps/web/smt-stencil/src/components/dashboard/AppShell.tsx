import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white">
      <Header onToggleSidebar={() => setExpanded((value) => !value)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar expanded={expanded} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <Outlet context={{ sidebarExpanded: expanded }} />
        </div>
      </div>
    </div>
  );
}
