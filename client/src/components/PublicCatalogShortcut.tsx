import { BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PublicCatalogShortcut() {
  const [location] = useLocation();
  const { language } = useLanguage();
  if (location !== "/") return null;

  const label = language === "ja" ? "キャラ図鑑（UID不要）" : language === "zh-CN" ? "角色图鉴（无需UID）" : "Character Catalog (No UID)";

  return (
    <Link
      href="/characters"
      className="fixed bottom-5 left-5 z-40 inline-flex min-h-11 items-center gap-2 border border-stone-900 bg-stone-50 px-3 py-2 text-[10px] font-semibold text-stone-900 shadow-lg transition-colors hover:bg-stone-900 hover:text-stone-50 sm:bottom-6 sm:left-6"
    >
      <BookOpen className="h-4 w-4" />
      {label}
    </Link>
  );
}
