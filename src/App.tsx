import { Route, Routes } from "react-router-dom";
import RegisterPage from "./features/auth/pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="*"
        element={
          <main className="flex min-h-screen items-center justify-center">
            <h1 className="text-3xl font-semibold">M-Manager</h1>
          </main>
        }
      />
    </Routes>
  );
}
