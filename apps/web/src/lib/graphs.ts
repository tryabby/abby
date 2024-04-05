import colors from 'tailwindcss/colors';

const forbiddenColors: Array<keyof typeof colors> = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'black',
  'blueGray',
  'coolGray',
  'warmGray',
  'current',
  'inherit',
  'transparent',
];

const COLORS = Object.keys(colors)
  .flatMap((key) => {
    const currentColor = key as keyof typeof colors;
    if (forbiddenColors.includes(currentColor)) return [];
    return colors[currentColor][300];
  })
  .filter(Boolean);

export function getColorByIndex(index: number) {
  return COLORS[index % COLORS.length];
}
