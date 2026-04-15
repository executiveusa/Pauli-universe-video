export type ColorPreset =
  | 'cinematic-gold'
  | 'cool-blue'
  | 'warm-sunset'
  | 'noir-contrast'
  | 'pastel-dream'
  | 'high-saturation'
  | 'desaturated'
  | 'sepia-tone'
  | 'neon-glow'
  | 'vintage-film'
  | 'color-graded-pro'
  | 'nature-green';

export interface ColorGrade {
  name: ColorPreset;
  contrast: number;
  saturation: number;
  brightness: number;
  temperature: number;
  shadows: number;
  highlights: number;
  vibrance: number;
}

const PRESETS: Record<ColorPreset, ColorGrade> = {
  'cinematic-gold': {
    name: 'cinematic-gold',
    contrast: 1.2,
    saturation: 1.15,
    brightness: 0.05,
    temperature: 50,
    shadows: -0.1,
    highlights: -0.15,
    vibrance: 0.2,
  },
  'cool-blue': {
    name: 'cool-blue',
    contrast: 1.1,
    saturation: 1.05,
    brightness: 0,
    temperature: -80,
    shadows: 0,
    highlights: 0,
    vibrance: 0.1,
  },
  'warm-sunset': {
    name: 'warm-sunset',
    contrast: 1.15,
    saturation: 1.25,
    brightness: 0.1,
    temperature: 150,
    shadows: -0.2,
    highlights: -0.1,
    vibrance: 0.3,
  },
  'noir-contrast': {
    name: 'noir-contrast',
    contrast: 1.5,
    saturation: 0,
    brightness: -0.1,
    temperature: 0,
    shadows: -0.3,
    highlights: 0.2,
    vibrance: 0,
  },
  'pastel-dream': {
    name: 'pastel-dream',
    contrast: 0.8,
    saturation: 0.85,
    brightness: 0.15,
    temperature: 30,
    shadows: 0.1,
    highlights: -0.05,
    vibrance: -0.1,
  },
  'high-saturation': {
    name: 'high-saturation',
    contrast: 1.1,
    saturation: 1.5,
    brightness: 0,
    temperature: 0,
    shadows: 0,
    highlights: 0,
    vibrance: 0.4,
  },
  desaturated: {
    name: 'desaturated',
    contrast: 1.05,
    saturation: 0.5,
    brightness: 0,
    temperature: 0,
    shadows: 0,
    highlights: 0,
    vibrance: 0,
  },
  'sepia-tone': {
    name: 'sepia-tone',
    contrast: 1.1,
    saturation: 0.3,
    brightness: 0.05,
    temperature: 100,
    shadows: 0.05,
    highlights: -0.1,
    vibrance: 0,
  },
  'neon-glow': {
    name: 'neon-glow',
    contrast: 1.3,
    saturation: 1.4,
    brightness: 0.2,
    temperature: -50,
    shadows: -0.2,
    highlights: 0.3,
    vibrance: 0.5,
  },
  'vintage-film': {
    name: 'vintage-film',
    contrast: 0.95,
    saturation: 0.9,
    brightness: 0.08,
    temperature: 70,
    shadows: 0.1,
    highlights: -0.2,
    vibrance: -0.05,
  },
  'color-graded-pro': {
    name: 'color-graded-pro',
    contrast: 1.25,
    saturation: 1.1,
    brightness: 0.02,
    temperature: 20,
    shadows: -0.15,
    highlights: -0.08,
    vibrance: 0.15,
  },
  'nature-green': {
    name: 'nature-green',
    contrast: 1.1,
    saturation: 1.2,
    brightness: 0.05,
    temperature: -40,
    shadows: 0.05,
    highlights: -0.1,
    vibrance: 0.25,
  },
};

export function getPreset(presetName: ColorPreset): ColorGrade {
  return PRESETS[presetName];
}

export function listPresets(): ColorPreset[] {
  return Object.keys(PRESETS) as ColorPreset[];
}

export function applyColorGrade(grade: ColorGrade): string {
  return JSON.stringify(grade);
}

export function customGrade(
  contrast: number,
  saturation: number,
  brightness: number,
  temperature: number
): ColorGrade {
  return {
    name: 'cinematic-gold',
    contrast,
    saturation,
    brightness,
    temperature,
    shadows: 0,
    highlights: 0,
    vibrance: 0,
  };
}
