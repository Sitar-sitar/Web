import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminLogoutButton() {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();

  const isNestedAdminRoute = location.startsWith("/admin/") && location !== "/admin";
  if (!isNestedAdminRoute || user?.role !== "admin") return null;

  const signOut = async () => {
    await logout();
    window.location.href = `${import.meta.env.BASE_URL}admin`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={signOut}
      disabled={loading}
      className="fixed bottom-4 right-4 z-50 h-10 rounded-none border-stone-500 bg-stone-50/95 px-4 text-xs shadow-md backdrop-blur hover:bg-stone-200 sm:bottom-6 sm:right-6"
      aria-label="管理者からログアウト"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "ログアウト中…" : "ログアウト"}
    </Button>
  );
}
