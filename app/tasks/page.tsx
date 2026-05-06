/**
 * Tasks page - Phase 3 functionality
 */
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import TasksContent from "@/components/pages/TasksContent";

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <TasksContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
