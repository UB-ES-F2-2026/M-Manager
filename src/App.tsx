import { Navigate, Route, Routes } from "react-router-dom";
import RedirectIfSignedIn from "./features/auth/components/RedirectIfSignedIn";
import RequireSession from "./features/auth/components/RequireSession";
import HomePage from "./features/auth/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import NewNetWorthItemPage from "./features/net-worth/pages/NewNetWorthItemPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireSession>
            <HomePage />
          </RequireSession>
        }
      />
      <Route
        path="/login"
        element={
          <RedirectIfSignedIn>
            <LoginPage />
          </RedirectIfSignedIn>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfSignedIn>
            <RegisterPage />
          </RedirectIfSignedIn>
        }
      />
      <Route
        path="/net-worth/new"
        element={
          <RequireSession>
            <NewNetWorthItemPage />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
