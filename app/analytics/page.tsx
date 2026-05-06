/**
 * Analytics page - Phase 5+ functionality
 */
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import AnalyticsContent from "@/components/pages/AnalyticsContent";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AnalyticsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
