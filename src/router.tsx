import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { AppShell } from "./layout/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { CreateModule } from "./pages/modules/CreateModule";
import { ModulePage } from "./pages/modules/ModulePage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { RoutinesPage } from "./pages/routines/RoutinesPage";
import { ComingSoon } from "./pages/ComingSoon";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/cadastro", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "rotinas", element: <RoutinesPage /> },
      { path: "modulos/novo", element: <CreateModule /> },
      { path: "modulos/:slug", element: <ModulePage /> },
      { path: "configuracoes/preferencias", element: <ComingSoon title="Preferências" /> },
      { path: "configuracoes/notificacoes", element: <NotificationsPage /> },
    ],
  },
]);
