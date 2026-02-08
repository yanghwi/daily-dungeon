import type { ItemRarity } from '@round-midnight/shared';

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-gold',
};

export const RARITY_BORDERS: Record<ItemRarity, string> = {
  common: 'border-slate-600',
  uncommon: 'border-green-700',
  rare: 'border-blue-700',
  legendary: 'border-gold',
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  legendary: '전설',
};

export const TYPE_LABELS: Record<string, string> = {
  weapon: '무기',
  top: '상의',
  bottom: '하의',
  hat: '모자',
  accessory: '악세서리',
  consumable: '소모품',
};
