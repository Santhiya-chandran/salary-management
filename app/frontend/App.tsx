import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./layout/AppLayout";
import { EditEmployeePage } from "./pages/EditEmployeePage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { NewEmployeePage } from "./pages/NewEmployeePage";
import { InsightsPage } from "./pages/InsightsPage";
import { ByCountryInsight } from "./pages/insights/ByCountryInsight";
import { ByJobTitleInsight } from "./pages/insights/ByJobTitleInsight";
import { HeadcountInsight } from "./pages/insights/HeadcountInsight";
import { UsdComparisonInsight } from "./pages/insights/UsdComparisonInsight";
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
        <Route path="employees/new" element={<NewEmployeePage />} />
        <Route path="employees/:id/edit" element={<EditEmployeePage />} />
        <Route path="insights" element={<InsightsPage />}>
          <Route index element={<Navigate to="by-country" replace />} />
          <Route path="by-country" element={<ByCountryInsight />} />
          <Route path="by-job-title" element={<ByJobTitleInsight />} />
          <Route path="headcount" element={<HeadcountInsight />} />
          <Route path="usd-comparison" element={<UsdComparisonInsight />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
