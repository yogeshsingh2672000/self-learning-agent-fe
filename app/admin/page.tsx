/**
 * Admin page — operator surfaces for the platform.
 * Auth-gated. Renders inside the MainLayout shell.
 */
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import AdminContent from "@/components/pages/AdminContent";

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AdminContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
