/**
 * Chat page - Phase 2 functionality
 */
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import ChatContent from "@/components/pages/ChatContent";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ChatContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
