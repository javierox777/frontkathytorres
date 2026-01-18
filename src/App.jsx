import { Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout.jsx";
import PrivateLayout from "./components/PrivateLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Signin from "./pages/Signin.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";

// 👇 importa las páginas del módulo Órdenes
import WorkOrders from "./pages/WorkOrders.jsx";
import WorkOrderNew from "./pages/WorkOrderNew.jsx";
import WorkOrderDetail from "./pages/WorkOrderDetail.jsx";

// (opcional) solo admin
import Admin from "./pages/Admin.jsx";

import Companies from "./pages/Companies.jsx";
import CompanyNew from "./pages/CompanyNew.jsx";
import CompanyEdit from "./pages/CompanyEdit.jsx";

import CompanyPasswordEdit from "./pages/CompanyPasswordEdit.jsx";


import ReportsList from "./pages/ReportsList.jsx";
import ReportNewRigorous from "./pages/ReportNewRigorous.jsx";
import ReportNewBasic from "./pages/ReportNewBasic.jsx";
import ReportEdit from "./pages/ReportEdit.jsx";

import ClientReports from "./pages/ClientReports.jsx";
import ClientReportDetail from "./pages/ClientReportDetail.jsx";

export default function App() {
  return (
    <Routes>
      {/* Públicas (auth) */}
      <Route element={<AuthLayout />}>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Privadas con layout */}
      <Route
        element={
          <ProtectedRoute>
            <PrivateLayout />
          </ProtectedRoute>
        }
      >
        {/* index = "/" */}
        <Route index element={<Dashboard />} />

        {/* Órdenes de trabajo (todas dentro del layout) */}
        <Route path="workorders" element={<WorkOrders />} />
        <Route path="workorders/new" element={<WorkOrderNew />} />
        <Route path="workorders/:id" element={<WorkOrderDetail />} />

        {/* Portal cliente */}
        <Route
          path="client/reports"
          element={
            <ProtectedRoute roles={["client"]}>
              <ClientReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="client/reports/:id"
          element={
            <ProtectedRoute roles={["client"]}>
              <ClientReportDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Solo Admin (también usa el layout privado) */}
      <Route
        element={
          <ProtectedRoute roles={["admin"]}>
            <PrivateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Admin />} />
        {/* 👇 las dos rutas que faltaban */}
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/new" element={<CompanyNew />} />
        <Route path="/companies/:id/edit" element={<CompanyEdit />} />
        <Route path="/companies/:id/password" element={<CompanyPasswordEdit />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id/edit" element={<ReportEdit />} />
  <Route path="/reports/new/rigorous" element={<ReportNewRigorous />} />
  <Route path="/reports/new/basic" element={<ReportNewBasic />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
