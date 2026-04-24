import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import {
  clearSession,
  fetchCurrentUser,
  getStoredUser,
  type User,
} from "./lib/api";
import Gestor from "./pages/Gestor";
import Home from "./pages/Home";
import Login from "./pages/Login";

export default function App() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [checkingSession, setCheckingSession] = useState(
    Boolean(getStoredUser()),
  );

  useEffect(() => {
    if (!getStoredUser()) {
      setCheckingSession(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F5F7F6] flex items-center justify-center text-sm text-[#404040]">
        Carregando sessão...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <Navbar
        user={user}
        onLogout={() => {
          clearSession();
          setUser(null);
        }}
      />
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/gestor" element={<Gestor />} />
      </Routes>
    </BrowserRouter>
  );
}
