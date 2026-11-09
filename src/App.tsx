import { Navigate, Route, Routes } from "react-router-dom";
import RedirectIfSignedIn from "./features/auth/components/RedirectIfSignedIn";
import RequireSession from "./features/auth/components/RequireSession";
import HomePage from "./features/auth/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import EditTransactionPage from "./features/transactions/pages/EditTransactionPage";
import NewTransactionPage from "./features/transactions/pages/NewTransactionPage";
import TransactionHistoryPage from "./features/transactions/pages/TransactionHistoryPage";

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
        path="/transactions"
        element={
          <RequireSession>
            <TransactionHistoryPage />
          </RequireSession>
        }
      />
      <Route
        path="/transactions/new"
        element={
          <RequireSession>
            <NewTransactionPage />
          </RequireSession>
        }
      />
      <Route
        path="/transactions/:transactionId/edit"
        element={
          <RequireSession>
            <EditTransactionPage />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
