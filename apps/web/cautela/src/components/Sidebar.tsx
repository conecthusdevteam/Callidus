interface NavIconProps {
  active?: boolean;
  children: React.ReactNode;
}

function NavIcon({ active = false, children }: NavIconProps) {
  return (
    <button
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all cursor-pointer
        ${active ? "text-white" : "hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function IconGrid() {
  return <img src="/assets/Vector3.png" alt="Grid" className="w-5 h-5" />;
}

function IconMenu() {
  return (
    <img src="/assets/icon-dashboard.png" alt="Grid" className="w-5 h-5" />
  );
}

function IconUpload() {
  return <img src="/assets/upload.png" alt="Grid" className="w-7 h-7" />;
}

function IconFile() {
  return <img src="/assets/Vector.png" alt="Grid" className="w-5 h-5" />;
}

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col items-center py-3 gap-2 z-20"
      style={{ width: "56px", backgroundColor: "#FFFFFF" }}
    >
      <NavIcon active>
        <IconGrid />
      </NavIcon>
      <NavIcon active>
        <IconMenu />
      </NavIcon>
      <NavIcon>
        <IconUpload />
      </NavIcon>

      <div className="w-8 border-t border-white/20 my-1" />

      <NavIcon>
        <IconFile />
      </NavIcon>
      <NavIcon>
        <IconFile />
      </NavIcon>
    </aside>
  );
}
