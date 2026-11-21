import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { PixelIconRenderer, PIXEL_ICONS } from './PixelIconSelector';
import {
  Skull,
  Ghost,
  Coins,
  Gem,
  Tag,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface RetroIconProps {
  name?: string;
  categoryName?: string;
  type?: 'EXPENSE' | 'INCOME';
  className?: string;
}

export const RetroIcon: React.FC<RetroIconProps> = ({
  name = 'Tag',
  categoryName = '',
  type = 'EXPENSE',
  className = 'h-3.5 w-3.5',
}) => {
  const { theme } = useTheme();

  // If icon matches a PixelIcon ID, render it
  if (name && PIXEL_ICONS.some((p) => p.id === name)) {
    return <PixelIconRenderer iconId={name} className={className} />;
  }

  const lowerCat = categoryName.toLowerCase();

  // Spooky theme (Black/White monochrome arcade with spooky icons for expense)
  if (theme === 'theme-spooky') {
    if (lowerCat.includes('tagihan') || lowerCat.includes('listrik') || lowerCat.includes('air') || lowerCat.includes('bill')) {
      return <Skull className={className} />;
    }
    if (lowerCat.includes('belanja') || lowerCat.includes('fashion') || lowerCat.includes('baju')) {
      return <Flame className={className} />;
    }
    if (lowerCat.includes('darurat') || lowerCat.includes('medis') || lowerCat.includes('obat')) {
      return <AlertCircle className={className} />;
    }
    if (type === 'EXPENSE') {
      return <Ghost className={className} />;
    }
    return <Coins className={className} />;
  }

  // Prosper theme or standard
  if (type === 'INCOME') {
    return <Gem className={className} />;
  }

  if (name && name !== 'Tag') {
    return <PixelIconRenderer iconId={`Pixel${name}`} className={className} />;
  }

  return <Tag className={className} />;
};
