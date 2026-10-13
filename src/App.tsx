import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./features/auth/pages/HomePage";
import { RegisterPage } from "./features/auth/pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
