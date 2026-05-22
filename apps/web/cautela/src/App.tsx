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

  return (
    <>
      {showShell && <Navbar />}
      {showShell && <Sidebar />}
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
