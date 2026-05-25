import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Gestor from "./pages/Gestor";
import Login from "./pages/Login";
import HistoricoCautelas from "./pages/HistoricoCautelas";
import Portaria from "./pages/Portaria";

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.papel)) {
    return (
      <Navigate
        to={
          user.papel === "GESTOR"
            ? "/gestor"
            : user.papel === "PORTARIA"
              ? "/portaria"
              : "/"
        }
        replace
      />
    );
  }
  return children;
}

function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const showShell = Boolean(user) && location.pathname !== "/login";
  const [slowRequestCount, setSlowRequestCount] = useState(0);

  useEffect(() => {
    const showSlowRequest = () => setSlowRequestCount((count) => count + 1);
    const hideSlowRequest = () =>
      setSlowRequestCount((count) => Math.max(0, count - 1));

    window.addEventListener("cautela:slow-request:start", showSlowRequest);
    window.addEventListener("cautela:slow-request:end", hideSlowRequest);

    return () => {
      window.removeEventListener("cautela:slow-request:start", showSlowRequest);
      window.removeEventListener("cautela:slow-request:end", hideSlowRequest);
    };
  }, []);

  return (
    <>
      {showShell && <Navbar />}
      {showShell && <Sidebar />}
      {slowRequestCount > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25">
          <div className="w-[320px] rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#D4D4D4] border-t-[#525252]" />
            <p className="text-sm font-bold text-black">
              A internet está com lentidão. Por favor, aguarde.
            </p>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute roles={["ADMIN", "SOLICITANTE"]}>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historico"
          element={
            <ProtectedRoute roles={["ADMIN", "SOLICITANTE"]}>
              <HistoricoCautelas voltarPara="/" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portaria"
          element={
            <ProtectedRoute roles={["ADMIN", "PORTARIA"]}>
              <Portaria />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portaria/historico"
          element={
            <ProtectedRoute roles={["ADMIN", "PORTARIA"]}>
              <HistoricoCautelas voltarPara="/portaria" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestor"
          element={
            <ProtectedRoute roles={["ADMIN", "GESTOR"]}>
              <Gestor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestor/historico"
          element={
            <ProtectedRoute roles={["ADMIN", "GESTOR"]}>
              <HistoricoCautelas voltarPara="/gestor" />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            user ? (
              <Navigate
                to={
                  user.papel === "GESTOR"
                    ? "/gestor"
                    : user.papel === "PORTARIA"
                      ? "/portaria"
                      : "/"
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
