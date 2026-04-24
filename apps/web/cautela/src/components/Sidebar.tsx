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

function IconMenu() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-black"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="3"
        width="8"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <rect
        x="13"
        y="3"
        width="8"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <rect
        x="1"
        y="15"
        width="8"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <rect
        x="13"
        y="11"
        width="8"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />
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

function IconFile() {
  return (
    <svg
      viewBox="0 0 40 42"
      className="w-9 h-9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fundo arredondado verde claro */}
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="40"
        rx="9.5"
        fill="#F3FAF7"
        stroke="#2B8E37"
      />

      {/* Documento centralizado */}
      <g transform="translate(11,10)">
        <path
          d="M0 18.75V2.75C0 2.02065 0.289939 1.32139 0.805664 0.805664C1.32139 0.289939 2.02065 0 2.75 0H11.75C11.9489 0 12.1396 0.0790743 12.2803 0.219727L17.2803 5.21973C17.4209 5.36038 17.5 5.55109 17.5 5.75V18.75C17.5 19.4793 17.2101 20.1786 16.6943 20.6943C16.1786 21.2101 15.4793 21.5 14.75 21.5H2.75C2.02065 21.5 1.32139 21.2101 0.805664 20.6943C0.289939 20.1786 0 19.4793 0 18.75ZM1.5 18.75C1.5 19.0815 1.63179 19.3994 1.86621 19.6338C2.10063 19.8682 2.41848 20 2.75 20H14.75C15.0815 20 15.3994 19.8682 15.6338 19.6338C15.8682 19.3994 16 19.0815 16 18.75V6.06055L11.4395 1.5H2.75C2.41848 1.5 2.10063 1.63179 1.86621 1.86621C1.63179 2.10063 1.5 2.41848 1.5 2.75V18.75Z"
          fill="#2B8E37"
        />
        <path
          d="M10 4.75V0.75C10 0.335786 10.3358 0 10.75 0C11.1642 0 11.5 0.335786 11.5 0.75V4.75C11.5 5.08152 11.6318 5.39937 11.8662 5.63379C12.1006 5.86821 12.4185 6 12.75 6H16.75C17.1642 6 17.5 6.33579 17.5 6.75C17.5 7.16421 17.1642 7.5 16.75 7.5H12.75C12.0207 7.5 11.3214 7.21006 10.8057 6.69434C10.2899 6.１７８６１ １０ ５．４７９３５ １０ ４．７５Ｚ"
          fill="#2B8E37"
        />
        <path
          d="M6.75 7C7.16421 7 7.5 7.33579 7.5 7.75C7.5 8.16421 7.16421 8.5 6.75 8.5H4.75C4.33579 8.5 4 8.16421 4 7.75C4 7.33579 4.33579 7 4.75 7H6.75Z"
          fill="#2B8E37"
        />
        <path
          d="M12.75 11C13.1642 11 13.5 11.3358 13.5 11.75C13.5 12.1642 13.1642 12.5 12.75 12.5H4.75C4.33579 12.5 4 12.1642 4 11.75C4 11.3358 4.33579 11 4.75 11H12.75Z"
          fill="#2B8E37"
        />
        <path
          d="M12.75 15C13.1642 15 13.5 15.3358 13.5 15.75C13.5 16.1642 13.1642 16.5 12.75 16.5H4.75C4.33579 16.5 4 16.1642 4 15.75C4 15.3358 4.33579 15 4.75 15H12.75Z"
          fill="#2B8E37"
        />
      </g>
    </svg>
  );
}

function IconFile2() {
  return (
    <svg
      viewBox="0 0 40 42"
      className="w-9 h-9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Documento centralizado */}
      <g transform="translate(11,10)">
        <path
          d="M0 18.75V2.75C0 2.02065 0.289939 1.32139 0.805664 0.805664C1.32139 0.289939 2.02065 0 2.75 0H11.75C11.9489 0 12.1396 0.0790743 12.2803 0.219727L17.2803 5.21973C17.4209 5.36038 17.5 5.55109 17.5 5.75V18.75C17.5 19.4793 17.2101 20.1786 16.6943 20.6943C16.1786 21.2101 15.4793 21.5 14.75 21.5H2.75C2.02065 21.5 1.32139 21.2101 0.805664 20.6943C0.289939 20.1786 0 19.4793 0 18.75ZM1.5 18.75C1.5 19.0815 1.63179 19.3994 1.86621 19.6338C2.10063 19.8682 2.41848 20 2.75 20H14.75C15.0815 20 15.3994 19.8682 15.6338 19.6338C15.8682 19.3994 16 19.0815 16 18.75V6.06055L11.4395 1.5H2.75C2.41848 1.5 2.10063 1.63179 1.86621 1.86621C1.63179 2.10063 1.5 2.41848 1.5 2.75V18.75Z"
          fill="#525252"
        />
        <path
          d="M10 4.75V0.75C10 0.335786 10.3358 0 10.75 0C11.1642 0 11.5 0.335786 11.5 0.75V4.75C11.5 5.08152 11.6318 5.39937 11.8662 5.63379C12.1006 5.86821 12.4185 6 12.75 6H16.75C17.1642 6 17.5 6.33579 17.5 6.75C17.5 7.16421 17.1642 7.5 16.75 7.5H12.75C12.0207 7.5 11.3214 7.21006 10.8057 6.69434C10.2899 6.１７８６１ １０ ５．４７９３５ １０ ４．７５Ｚ"
          fill="#525252"
        />
        <path
          d="M6.75 7C7.16421 7 7.5 7.33579 7.5 7.75C7.5 8.16421 7.16421 8.5 6.75 8.5H4.75C4.33579 8.5 4 8.16421 4 7.75C4 7.33579 4.33579 7 4.75 7H6.75Z"
          fill="#525252"
        />
        <path
          d="M12.75 11C13.1642 11 13.5 11.3358 13.5 11.75C13.5 12.1642 13.1642 12.5 12.75 12.5H4.75C4.33579 12.5 4 12.1642 4 11.75C4 11.3358 4.33579 11 4.75 11H12.75Z"
          fill="#525252"
        />
        <path
          d="M12.75 15C13.1642 15 13.5 15.3358 13.5 15.75C13.5 16.1642 13.1642 16.5 12.75 16.5H4.75C4.33579 16.5 4 16.1642 4 15.75C4 15.3358 4.33579 15 4.75 15H12.75Z"
          fill="#525252"
        />
      </g>
    </svg>
  );
}

function Separator() {
  return (
    <svg
      width="56"
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
      className="fixed left-0 top-0 h-full flex flex-col items-center py-3 gap-2 z-20 bg-white border-r border-gray-300"
      style={{ width: "70px", boxShadow: "2px 0 6px rgba(0,0,0,0.08)" }}
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

      <Separator />

      <NavIcon>
        <IconFile />
      </NavIcon>
      <NavIcon>
        <IconFile2 />
      </NavIcon>
    </aside>
  );
}
