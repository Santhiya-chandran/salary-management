import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./layout/AppLayout";
import { EmployeesPage } from "./pages/EmployeesPage";
import { InsightsPage } from "./pages/InsightsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

type AppProps = {
  userEmail: string;
};

// Client-side routes. Rails serves this app for /, /employees/* and
// /insights/* (config/routes.rb), so refreshing any of these pages works.
export function App({ userEmail }: AppProps) {
  return (
    <Routes>
      <Route element={<AppLayout userEmail={userEmail} />}>
        <Route index element={<Navigate to="/employees" replace />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
