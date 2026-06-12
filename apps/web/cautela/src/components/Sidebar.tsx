import dashboardIcon from "../assets/icon-dashboard.svg";
import bookIcon from "../assets/icon-book.svg";
import menuIcon from "../assets/icon-menu.svg";

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
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-[#25702F]"
      fill="currentColor"
    >
      <path d="M0 16L5.67488 21.2174V14.7246H16.5517V17.971H8.74877V24H24V6.72464L17.8522 0.463768V8.81159H7.21182V5.91304H14.6601V0H0V16Z" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="24" height="24" rx="4" fill="#F3FAF7" />
      <path
        d="M19 1V5C19 5.53 18.79 6.04 18.41 6.41C18.04 6.79 17.53 7 17 7H3C2.47 7 1.96 6.79 1.59 6.41C1.21 6.04 1 5.53 1 5V1"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(4,13) scale(0.8)"
      />

      <path
        d="M11 6L6 1L1 6"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(7,3) scale(0.8)"
      />

      <path
        d="M1 1V13"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(11,3) scale(0.8)"
      />
    </svg>
  );
}

function Separator() {
  return (
    <svg
      width="32"
      height="1"
      viewBox="0 0 60 1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="my-2"
    >
      <rect width="60" height="1" fill="#E5E7EB" />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-full flex-col items-center py-3 gap-2 z-20 bg-white border-r border-gray-300"
      style={{ width: "60px", boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }}
    >
      <NavIcon active>
        <IconGrid />
      </NavIcon>
      <NavIcon active>
        <div className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted">
          <img src={dashboardIcon} alt="Dashboard" className="h-6 w-6" />
        </div>
      </NavIcon>
      <NavIcon>
        <IconUpload />
      </NavIcon>

      <Separator />

      <NavIcon>
        <div className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted">
          <img src={bookIcon} alt="Book" className="h-40 w-40" />
        </div>
      </NavIcon>
      <NavIcon>
        <div className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted">
          <img src={menuIcon} alt="Book" className="h-40 w-40" />
        </div>
      </NavIcon>
    </aside>
  );
}
