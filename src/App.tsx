import { Navigate, Route, Routes } from "react-router-dom";
import RedirectIfSignedIn from "./features/auth/components/RedirectIfSignedIn";
import RequireSession from "./features/auth/components/RequireSession";
import HomePage from "./features/auth/pages/HomePage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import EditBudgetPage from "./features/budgets/pages/EditBudgetPage";
import NewBudgetPage from "./features/budgets/pages/NewBudgetPage";
import GroupDetailPage from "./features/groups/pages/GroupDetailPage";
import GroupsPage from "./features/groups/pages/GroupsPage";
import JoinGroupPage from "./features/groups/pages/JoinGroupPage";
import NewGroupExpensePage from "./features/groups/pages/NewGroupExpensePage";
import NewGroupPage from "./features/groups/pages/NewGroupPage";
import EditNetWorthItemPage from "./features/net-worth/pages/EditNetWorthItemPage";
import NewNetWorthItemPage from "./features/net-worth/pages/NewNetWorthItemPage";
import BudgetsPage from "./features/budgets/pages/BudgetsPage";
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
      <Route
        path="/budgets"
        element={
          <RequireSession>
            <BudgetsPage />
          </RequireSession>
        }
      />
      <Route
        path="/groups"
        element={
          <RequireSession>
            <GroupsPage />
          </RequireSession>
        }
      />
      <Route
        path="/groups/new"
        element={
          <RequireSession>
            <NewGroupPage />
          </RequireSession>
        }
      />
      <Route
        path="/groups/join"
        element={
          <RequireSession>
            <JoinGroupPage />
          </RequireSession>
        }
      />
      <Route
        path="/groups/:groupId"
        element={
          <RequireSession>
            <GroupDetailPage />
          </RequireSession>
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
      <Route
        path="/net-worth/assets/:itemId/edit"
        element={
          <RequireSession>
            <EditNetWorthItemPage kind="asset" />
          </RequireSession>
        }
      />
      <Route
        path="/net-worth/debts/:itemId/edit"
        element={
          <RequireSession>
            <EditNetWorthItemPage kind="debt" />
          </RequireSession>
        }
      />
      <Route
        path="/budgets/new"
        element={
          <RequireSession>
            <NewBudgetPage />
          </RequireSession>
        }
      />
      <Route
        path="/budgets/:budgetId/edit"
        element={
          <RequireSession>
            <EditBudgetPage />
          </RequireSession>
        }
      />
      <Route
        path="/groups/:groupId/expenses/new"
        element={
          <RequireSession>
            <NewGroupExpensePage />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}