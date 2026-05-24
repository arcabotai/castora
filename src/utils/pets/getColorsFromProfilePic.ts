import Vibrant from 'node-vibrant';

// Basic color dictionary with common colors
const colorDictionary = [
  { name: 'Pink', rgb: [255, 192, 203] },
  { name: 'Red', rgb: [255, 0, 0] },
  { name: 'Orange', rgb: [255, 165, 0] },
  { name: 'Yellow', rgb: [255, 255, 0] },
  { name: 'Lime', rgb: [0, 255, 0] },
  { name: 'Green', rgb: [0, 128, 0] },
  { name: 'Blue', rgb: [0, 0, 255] },
  { name: 'Purple', rgb: [128, 0, 128] },
  { name: 'White', rgb: [255, 255, 255] },
  { name: 'Black', rgb: [0, 0, 0] },
  { name: 'Gray', rgb: [128, 128, 128] },
];

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate the Euclidean distance between two RGB colors
function getColorDistance(color1: number[], color2: number[]): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}

// Find the closest named color
function getClosestNamedColor(rgb: number[]): string {
  let closestColor = colorDictionary[0];
  let minDistance = getColorDistance(rgb, colorDictionary[0].rgb);

  for (const color of colorDictionary) {
    const distance = getColorDistance(rgb, color.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  // If the color is very dark (close to black)
  const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
  if (brightness < 40 && closestColor.name !== 'Black') {
    return `Dark ${closestColor.name}`;
  }
  // If the color is very light (close to white)
  if (brightness > 220 && closestColor.name !== 'White') {
    return `Light ${closestColor.name}`;
  }

  return closestColor.name;
}

export async function getColorsFromProfilePic(imageUrl: string) {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    const dominantColors = Object.values(palette)
      .filter(swatch => swatch !== null)
      .slice(0, 3)
      .map(swatch => {
        // @ts-ignore
        const [r, g, b] = swatch!.rgb;
        return {
          rgb: [r, g, b],
          hex: rgbToHex(r, g, b),
          name: getClosestNamedColor([r, g, b])
        };
      });

    return dominantColors.map(color => color.name);

  } catch (error) {
    console.error('Error processing image:', error);
    return [];
  }
}