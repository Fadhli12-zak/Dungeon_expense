import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { LogOut, Skull, Coins, Globe, ChevronDown } from "lucide-react";

export const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { label: t("nav_dashboard"), path: "/" },
    { label: t("nav_transactions"), path: "/transactions" },
    { label: t("nav_wallets"), path: "/wallets" },
    { label: t("nav_categories"), path: "/categories" },
    { label: t("nav_budgets"), path: "/budgets" },
    { label: t("nav_profile"), path: "/profile" },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b-[3px] border-[var(--border-color)]"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center border-[2px] shadow-[var(--glow-shadow-sm)] transition-all ${
                  theme === "theme-spooky"
                    ? "border-red-500 bg-red-950/80 text-red-400"
                    : "border-green-600 bg-green-100 text-yellow-600"
                }`}
              >
                {theme === "theme-spooky" ? (
                  <Skull className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 animate-bounce" />
                ) : (
                  <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 animate-coin-spin" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-pixel text-[11px] sm:text-sm tracking-tight text-[var(--text-primary)]">
                  COIN<span className="opacity-80">TOMB</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 font-pixel text-[9px] transition-all border-b-[3px] ${
                    isActive
                      ? "border-[var(--accent-color)] text-[var(--text-primary)] bg-[var(--bg-card-subtle)] shadow-[var(--glow-shadow-sm)]"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher & Exit / Logout */}
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown in Navbar */}
            <div className="relative flex items-center border-2 border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--glow-shadow-sm)]">
              <span className="px-1.5 py-1 bg-[var(--bg-card-subtle)] border-r-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center shrink-0 select-none">
                <Globe className="h-3 w-3" />
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "id" | "en")}
                className="appearance-none bg-transparent pl-1.5 pr-6 py-1 font-pixel text-[8px] text-[var(--text-primary)] uppercase outline-none cursor-pointer"
              >
                <option value="id" className="bg-[var(--bg-card)] font-pixel text-[8px]">
                  IDN
                </option>
                <option value="en" className="bg-[var(--bg-card)] font-pixel text-[8px]">
                  ENG
                </option>
              </select>
              <span className="absolute right-0 top-0 bottom-0 px-1 bg-[var(--bg-card-subtle)] border-l-2 border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center pointer-events-none select-none">
                <ChevronDown className="h-2.5 w-2.5 stroke-[2.5]" />
              </span>
            </div>

            <button
              onClick={logout}
              className="retro-btn py-1 px-2.5 text-[8px] sm:text-[9px] flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition"
              title="Logout / Exit"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">{t("nav_logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
