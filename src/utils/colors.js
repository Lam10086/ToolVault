// Category color palette — OKLCH values for each named color key
export const CATEGORY_COLORS = {
  'cat-coral':  'oklch(68% 0.2 30)',
  'cat-amber':  'oklch(74% 0.17 68)',
  'cat-lime':   'oklch(72% 0.2 135)',
  'cat-cyan':   'oklch(74% 0.17 200)',
  'cat-violet': 'oklch(68% 0.24 295)',
  'cat-pink':   'oklch(70% 0.22 340)',
  'cat-sky':    'oklch(74% 0.18 230)',
  'cat-orange': 'oklch(72% 0.2 50)',
  'cat-teal':   'oklch(72% 0.18 185)',
  'cat-rose':   'oklch(68% 0.22 10)',
};

export const CATEGORY_COLOR_OPTIONS = [
  { key: 'cat-violet', label: '紫',   color: 'oklch(68% 0.24 295)' },
  { key: 'cat-cyan',   label: '青',   color: 'oklch(74% 0.17 200)' },
  { key: 'cat-pink',   label: '粉',   color: 'oklch(70% 0.22 340)' },
  { key: 'cat-lime',   label: '绿',   color: 'oklch(72% 0.2 135)'  },
  { key: 'cat-amber',  label: '黄',   color: 'oklch(74% 0.17 68)'  },
  { key: 'cat-coral',  label: '红',   color: 'oklch(68% 0.2 30)'   },
  { key: 'cat-sky',    label: '蓝',   color: 'oklch(74% 0.18 230)' },
  { key: 'cat-orange', label: '橙',   color: 'oklch(72% 0.2 50)'   },
  { key: 'cat-teal',   label: '青绿', color: 'oklch(72% 0.18 185)' },
  { key: 'cat-rose',   label: '玫红', color: 'oklch(68% 0.22 10)'  },
];

export function getCatColor(colorKey) {
  return CATEGORY_COLORS[colorKey] ?? 'oklch(68% 0.24 295)';
}

// Generate a color-mix based dim version of a category color
export function getCatDim(colorKey, alpha = 0.12) {
  const base = getCatColor(colorKey);
  return `color-mix(in oklch, ${base} ${Math.round(alpha * 100)}%, transparent)`;
}

export function getCatBorder(colorKey, alpha = 0.3) {
  const base = getCatColor(colorKey);
  return `color-mix(in oklch, ${base} ${Math.round(alpha * 100)}%, transparent)`;
}
