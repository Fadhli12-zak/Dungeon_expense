import React from "react";
import { useTheme } from "../context/ThemeContext";

export const AtmosphericParticles: React.FC = () => {
  const { theme } = useTheme();
  const isSpooky = theme === "theme-spooky";

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {isSpooky ? (
        // ============================================================
        // EXPENSE THEME: POLA ICON TENGKORAK RETRO 8-BIT
        // ============================================================
        <>
          {/* Repeating 8-Bit Skull Background Pattern Grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="retro-skull-pattern"
                width="64"
                height="64"
                patternUnits="userSpaceOnUse"
              >
                {/* 16x16 Pixel Skull scaled to 24px */}
                <g transform="translate(20, 20) scale(1.2)">
                  <path
                    d="M3 1h6v1h2v3h1v3h-1v2h-1v1h-1v1h-1v-1H7v1H5v-1H4v-1H3V8H2V5h1V2h1V1h-1zm1 4h2v2H4V5zm4 0h2v2H8V5z"
                    fill="#FFFFFF"
                  />
                  {/* Eye Sockets */}
                  <rect x="4" y="5" width="2" height="2" fill="#000000" />
                  <rect x="8" y="5" width="2" height="2" fill="#000000" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#retro-skull-pattern)" />
          </svg>

          {/* Floating Pixel Skulls with Subtle Glow & Red Eyes */}
          {/* Skull 1 - Top Left */}
          <div className="absolute top-[12%] left-[8%] animate-skull-bob-1 opacity-70">
            <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
              {/* Skull Head */}
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#E2E8F0"
              />
              {/* Eye Sockets with Red Glow */}
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="5" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="10" y="6" width="1" height="1" fill="#DC2626" />
              {/* Nose */}
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
              {/* Teeth */}
              <rect x="5" y="12" width="1" height="2" fill="#000000" />
              <rect x="7" y="12" width="1" height="2" fill="#000000" />
              <rect x="9" y="12" width="1" height="2" fill="#000000" />
            </svg>
          </div>

          {/* Skull 2 - Top Right */}
          <div className="absolute top-[18%] right-[10%] animate-skull-bob-2 opacity-65">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#CBD5E1"
              />
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="5" y="6" width="1" height="1" fill="#EF4444" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="10" y="6" width="1" height="1" fill="#EF4444" />
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
              <rect x="5" y="12" width="1" height="2" fill="#000000" />
              <rect x="7" y="12" width="1" height="2" fill="#000000" />
              <rect x="9" y="12" width="1" height="2" fill="#000000" />
            </svg>
          </div>

          {/* Skull 3 - Center Left */}
          <div className="absolute top-[52%] left-[5%] animate-skull-pulse-1 opacity-60">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#94A3B8"
              />
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="5" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="10" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
            </svg>
          </div>

          {/* Skull 4 - Center Right */}
          <div className="absolute top-[48%] right-[7%] animate-skull-bob-3 opacity-60">
            <svg width="34" height="34" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#E2E8F0"
              />
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="5" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="10" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
            </svg>
          </div>

          {/* Skull 5 - Bottom Left */}
          <div className="absolute bottom-[15%] left-[12%] animate-skull-bob-2 opacity-55">
            <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#64748B"
              />
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
            </svg>
          </div>

          {/* Skull 6 - Bottom Right */}
          <div className="absolute bottom-[18%] right-[14%] animate-skull-pulse-2 opacity-65">
            <svg width="30" height="30" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 1h8v2h2v5h-1v2h-1v2h-1v2H9v-1H7v1H5v-2H4v-2H3V8H2V3h2V1z"
                fill="#E2E8F0"
              />
              <rect x="4" y="5" width="3" height="3" fill="#000000" />
              <rect x="5" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="9" y="5" width="3" height="3" fill="#000000" />
              <rect x="10" y="6" width="1" height="1" fill="#DC2626" />
              <rect x="7" y="8" width="2" height="2" fill="#000000" />
            </svg>
          </div>
        </>
      ) : (
        // ============================================================
        // INCOME THEME: POLA BINTANG RETRO 8-BIT
        // ============================================================
        <>
          {/* Repeating 8-Bit Star Background Pattern Grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="retro-star-pattern"
                width="56"
                height="56"
                patternUnits="userSpaceOnUse"
              >
                {/* 4-point pixel star */}
                <g transform="translate(24, 24)">
                  <rect x="3" y="0" width="2" height="8" fill="#000000" />
                  <rect x="0" y="3" width="8" height="2" fill="#000000" />
                  <rect x="2" y="2" width="4" height="4" fill="#000000" />
                  <rect x="3" y="3" width="2" height="2" fill="#EAB308" />
                </g>
                {/* Smaller secondary pixel dot */}
                <rect x="4" y="4" width="2" height="2" fill="#000000" />
                <rect x="44" y="36" width="2" height="2" fill="#000000" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#retro-star-pattern)" />
          </svg>

          {/* Floating & Twinkling 8-Bit Pixel Stars */}
          {/* Big Golden Star - Top Left */}
          <div className="absolute top-[10%] left-[8%] animate-star-twinkle-1 animate-star-float-1 opacity-80">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
              <rect x="7" y="0" width="2" height="16" fill="#EAB308" />
              <rect x="0" y="7" width="16" height="2" fill="#EAB308" />
              <rect x="5" y="5" width="6" height="6" fill="#FACC15" />
              <rect x="6" y="6" width="4" height="4" fill="#FEF08A" />
              <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Emerald Pixel Star - Top Right */}
          <div className="absolute top-[16%] right-[10%] animate-star-twinkle-2 animate-star-float-2 opacity-75">
            <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
              <rect x="7" y="1" width="2" height="14" fill="#16A34A" />
              <rect x="1" y="7" width="14" height="2" fill="#16A34A" />
              <rect x="5" y="5" width="6" height="6" fill="#22C55E" />
              <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Golden 4-Point Star - Center Left */}
          <div className="absolute top-[45%] left-[6%] animate-star-twinkle-3 opacity-70">
            <svg width="24" height="24" viewBox="0 0 12 12" fill="none">
              <rect x="5" y="0" width="2" height="12" fill="#CA8A04" />
              <rect x="0" y="5" width="12" height="2" fill="#CA8A04" />
              <rect x="4" y="4" width="4" height="4" fill="#FACC15" />
              <rect x="5" y="5" width="2" height="2" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Diamond Sparkle - Center Right */}
          <div className="absolute top-[42%] right-[8%] animate-star-twinkle-1 opacity-85">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <rect x="7" y="0" width="2" height="16" fill="#EAB308" />
              <rect x="0" y="7" width="16" height="2" fill="#EAB308" />
              <rect x="5" y="5" width="6" height="6" fill="#FDE047" />
              <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Small Twinkle Star - Bottom Left */}
          <div className="absolute bottom-[20%] left-[14%] animate-star-twinkle-2 animate-star-float-1 opacity-75">
            <svg width="20" height="20" viewBox="0 0 10 10" fill="none">
              <rect x="4" y="0" width="2" height="10" fill="#16A34A" />
              <rect x="0" y="4" width="10" height="2" fill="#16A34A" />
              <rect x="3" y="3" width="4" height="4" fill="#4ADE80" />
            </svg>
          </div>

          {/* Golden Pixel Star - Bottom Right */}
          <div className="absolute bottom-[16%] right-[12%] animate-star-twinkle-3 animate-star-float-2 opacity-80">
            <svg width="30" height="30" viewBox="0 0 16 16" fill="none">
              <rect x="7" y="0" width="2" height="16" fill="#EAB308" />
              <rect x="0" y="7" width="16" height="2" fill="#EAB308" />
              <rect x="5" y="5" width="6" height="6" fill="#FACC15" />
              <rect x="6" y="6" width="4" height="4" fill="#FEF08A" />
              <rect x="7" y="7" width="2" height="2" fill="#FFFFFF" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
