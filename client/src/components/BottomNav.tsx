import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Target,
  User,
} from "lucide-react";

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { label: t("nav_dashboard"), path: "/", icon: LayoutDashboard },
    { label: t("nav_transactions"), path: "/transactions", icon: ArrowLeftRight },
    { label: t("nav_wallets"), path: "/wallets", icon: CreditCard },
    { label: t("nav_budgets"), path: "/budgets", icon: Target },
    { label: t("nav_profile"), path: "/profile", icon: User },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t-[3px] border-[var(--border-color)] shadow-[0_-4px_10px_rgba(0,0,0,0.15)]"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/profile" && location.pathname === "/about");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "bg-[var(--accent-color)] text-[var(--accent-text)] font-bold"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-pixel text-[7px] tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
