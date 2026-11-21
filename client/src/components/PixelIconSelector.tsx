import React from "react";
import {
  Utensils,
  Coffee,
  Pizza,
  Cake,
  Shirt,
  ShoppingBag,
  Watch,
  Glasses,
  Car,
  Fuel,
  Bus,
  Plane,
  Bike,
  Zap,
  Droplets,
  Wifi,
  Home,
  Gamepad2,
  Film,
  Music,
  Ticket,
  Heart,
  Pill,
  Activity,
  ShieldPlus,
  Coins,
  Gem,
  Briefcase,
  Trophy,
  Wallet,
  Gift,
  Sparkles,
  BookOpen,
  GraduationCap,
  Tag,
} from "lucide-react";

export interface PixelIconDefinition {
  id: string;
  name: string;
  group:
    | "Food"
    | "Fashion"
    | "Transport"
    | "Bills"
    | "Entertainment"
    | "Health"
    | "Income"
    | "General";
  icon: React.ComponentType<{ className?: string }>;
}

export const PIXEL_ICONS: PixelIconDefinition[] = [
  // Fashion & Belanja
  { id: "PixelShirt", name: "Baju / Kaos", group: "Fashion", icon: Shirt },
  { id: "PixelBag", name: "Tas Belanja", group: "Fashion", icon: ShoppingBag },
  { id: "PixelWatch", name: "Jam Tangan", group: "Fashion", icon: Watch },
  { id: "PixelGlasses", name: "Kacamata", group: "Fashion", icon: Glasses },
  { id: "PixelTag", name: "Label Tag", group: "Fashion", icon: Tag },

  // Food & Drinks
  { id: "PixelBurger", name: "Makanan / Resto", group: "Food", icon: Utensils },
  { id: "PixelCoffee", name: "Kopi / Cafe", group: "Food", icon: Coffee },
  { id: "PixelPizza", name: "Pizza / Jajan", group: "Food", icon: Pizza },
  { id: "PixelCake", name: "Kue / Dessert", group: "Food", icon: Cake },

  // Transport
  { id: "PixelCar", name: "Mobil Pribadi", group: "Transport", icon: Car },
  { id: "PixelFuel", name: "Bensin / BBM", group: "Transport", icon: Fuel },
  { id: "PixelBus", name: "Bus / Kereta", group: "Transport", icon: Bus },
  { id: "PixelBike", name: "Motor / Sepeda", group: "Transport", icon: Bike },
  {
    id: "PixelPlane",
    name: "Pesawat / Travel",
    group: "Transport",
    icon: Plane,
  },

  // Bills & Utilities
  { id: "PixelFlash", name: "Listrik PLN", group: "Bills", icon: Zap },
  { id: "PixelDrop", name: "Air PDAM", group: "Bills", icon: Droplets },
  { id: "PixelWifi", name: "Internet / Wifi", group: "Bills", icon: Wifi },
  { id: "PixelHome", name: "Sewa / Rumah", group: "Bills", icon: Home },

  // Entertainment
  {
    id: "PixelGamepad",
    name: "Game / Steam",
    group: "Entertainment",
    icon: GameGamepad,
  },
  {
    id: "PixelMovie",
    name: "Bioskop / Film",
    group: "Entertainment",
    icon: Film,
  },
  {
    id: "PixelMusic",
    name: "Musik / Spotify",
    group: "Entertainment",
    icon: Music,
  },
  {
    id: "PixelTicket",
    name: "Tiket Event",
    group: "Entertainment",
    icon: Ticket,
  },

  // Health
  { id: "PixelHeart", name: "Kesehatan", group: "Health", icon: Heart },
  { id: "PixelPill", name: "Obat / Apotek", group: "Health", icon: Pill },
  {
    id: "PixelActivity",
    name: "Gym / Fitness",
    group: "Health",
    icon: Activity,
  },
  { id: "PixelShield", name: "Asuransi", group: "Health", icon: ShieldPlus },

  // Income
  { id: "PixelCoinBag", name: "Gaji Pokok", group: "Income", icon: Coins },
  { id: "PixelGem", name: "Bonus / Dividen", group: "Income", icon: Gem },
  {
    id: "PixelBriefcase",
    name: "Proyek / Freelance",
    group: "Income",
    icon: Briefcase,
  },
  { id: "PixelTrophy", name: "Hadiah / Reward", group: "Income", icon: Trophy },
  { id: "PixelWallet", name: "Pemasukan Tunai", group: "Income", icon: Wallet },

  // General & Education
  { id: "PixelBook", name: "Buku / Kursus", group: "General", icon: BookOpen },
  {
    id: "PixelGrad",
    name: "Kuliah / Sekolah",
    group: "General",
    icon: GraduationCap,
  },
  { id: "PixelGift", name: "Donasi / Kado", group: "General", icon: Gift },
  { id: "PixelSparkle", name: "Lain-lain", group: "General", icon: Sparkles },
];

function GameGamepad(props: { className?: string }) {
  return <Gamepad2 {...props} />;
}

export const PixelIconRenderer: React.FC<{
  iconId?: string;
  className?: string;
}> = ({ iconId = "PixelTag", className = "h-4 w-4" }) => {
  const found = PIXEL_ICONS.find((item) => item.id === iconId);
  if (found) {
    const Component = found.icon;
    return <Component className={className} />;
  }
  return <Tag className={className} />;
};

interface PixelIconSelectorProps {
  selectedIcon: string;
  onSelect: (iconId: string) => void;
}

export const PixelIconSelector: React.FC<PixelIconSelectorProps> = ({
  selectedIcon,
  onSelect,
}) => {
  const [selectedGroup, setSelectedGroup] = React.useState<string>("ALL");

  const groups = [
    "ALL",
    "Fashion",
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Health",
    "Income",
    "General",
  ];

  const filteredIcons =
    selectedGroup === "ALL"
      ? PIXEL_ICONS
      : PIXEL_ICONS.filter((item) => item.group === selectedGroup);

  return (
    <div className="space-y-2">
      {/* Group Pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 text-[8px] font-pixel">
        {groups.map((grp) => (
          <button
            key={grp}
            type="button"
            onClick={() => setSelectedGroup(grp)}
            className={`px-2 py-1 border transition shrink-0 ${
              selectedGroup === grp
                ? "bg-[var(--accent-color)] text-[var(--accent-text)] border-[var(--border-color)]"
                : "bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Icons Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 border-2 border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
        {filteredIcons.map((item) => {
          const IconComp = item.icon;
          const isSelected = selectedIcon === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={item.name}
              className={`p-2 flex flex-col items-center justify-center border transition aspect-square ${
                isSelected
                  ? "bg-[var(--accent-color)] text-[var(--accent-text)] border-[var(--border-color)] ring-2 ring-[var(--border-color)] scale-105"
                  : "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--accent-color)] hover:text-[var(--accent-text)]"
              }`}
            >
              <IconComp className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <div className="font-arcade text-xs text-[var(--text-muted)] flex items-center justify-between">
        <span>Ikon Terpilih:</span>
        <span className="font-bold text-[var(--text-primary)]">
          {PIXEL_ICONS.find((i) => i.id === selectedIcon)?.name || selectedIcon}
        </span>
      </div>
    </div>
  );
};
