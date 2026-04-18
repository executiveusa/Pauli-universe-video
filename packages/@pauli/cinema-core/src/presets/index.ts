/**
 * 12 Cinematic Color Grading Presets
 * Based on famous film cinematography styles
 */

export interface Preset {
  id: string;
  name: string;
  description: string;
  filmReference: string;
  lutFile: string;
  saturation: number;
  brightness: number;
  contrast: number;
}

export const PRESETS: Record<string, Preset> = {
  RESERVOIR_DOGS: {
    id: "reservoir_dogs",
    name: "Reservoir Dogs",
    description: "High contrast, desaturated, cool tones",
    filmReference: "Quentin Tarantino - Reservoir Dogs",
    lutFile: "reservoir_dogs.cube",
    saturation: 0.7,
    brightness: 0,
    contrast: 1.2,
  },
  CASINO: {
    id: "casino",
    name: "Casino",
    description: "Warm, saturated, glamorous",
    filmReference: "Martin Scorsese - Casino",
    lutFile: "casino.cube",
    saturation: 1.3,
    brightness: 0.1,
    contrast: 0.9,
  },
  TAXI_DRIVER: {
    id: "taxi_driver",
    name: "Taxi Driver",
    description: "Neon noir, cool blues",
    filmReference: "Martin Scorsese - Taxi Driver",
    lutFile: "taxi_driver.cube",
    saturation: 1.0,
    brightness: -0.1,
    contrast: 1.1,
  },
  HEAT: {
    id: "heat",
    name: "Heat",
    description: "Cinematic, balanced, professional",
    filmReference: "Michael Mann - Heat",
    lutFile: "heat.cube",
    saturation: 1.0,
    brightness: 0,
    contrast: 1.0,
  },
  BRONX_TALE: {
    id: "bronx_tale",
    name: "A Bronx Tale",
    description: "Warm, nostalgic, 80s-toned",
    filmReference: "Robert De Niro - A Bronx Tale",
    lutFile: "bronx_tale.cube",
    saturation: 0.9,
    brightness: 0.15,
    contrast: 0.95,
  },
  SOPRANOS: {
    id: "sopranos",
    name: "The Sopranos",
    description: "Moody, dark, TV drama",
    filmReference: "HBO - The Sopranos",
    lutFile: "sopranos.cube",
    saturation: 0.85,
    brightness: -0.15,
    contrast: 1.15,
  },
  BLADE_RUNNER: {
    id: "blade_runner",
    name: "Blade Runner",
    description: "Sci-fi, cyan/magenta split",
    filmReference: "Ridley Scott - Blade Runner",
    lutFile: "blade_runner.cube",
    saturation: 1.1,
    brightness: -0.05,
    contrast: 1.2,
  },
  KILL_BILL: {
    id: "kill_bill",
    name: "Kill Bill",
    description: "Saturated, stylized, comic-book",
    filmReference: "Quentin Tarantino - Kill Bill",
    lutFile: "kill_bill.cube",
    saturation: 1.5,
    brightness: 0.1,
    contrast: 1.3,
  },
  DRIVE: {
    id: "drive",
    name: "Drive",
    description: "Retro, synth-wave, hot pinks",
    filmReference: "Nicolas Winding Refn - Drive",
    lutFile: "drive.cube",
    saturation: 1.2,
    brightness: 0,
    contrast: 0.95,
  },
  NEON_GENESIS: {
    id: "neon_genesis",
    name: "Neon Genesis",
    description: "Anime, vibrant, purple/blue",
    filmReference: "Hideaki Anno - Neon Genesis Evangelion",
    lutFile: "neon_genesis.cube",
    saturation: 1.4,
    brightness: 0.05,
    contrast: 1.1,
  },
  CYBERPUNK: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Dark, green tints, gritty",
    filmReference: "Cyberpunk Aesthetic",
    lutFile: "cyberpunk.cube",
    saturation: 0.9,
    brightness: -0.2,
    contrast: 1.25,
  },
  DREAMSCAPE: {
    id: "dreamscape",
    name: "Dreamscape",
    description: "Soft, warm, dreamy",
    filmReference: "David Lynch - Twin Peaks",
    lutFile: "dreamscape.cube",
    saturation: 1.1,
    brightness: 0.2,
    contrast: 0.85,
  },
};

/**
 * Get preset by ID
 */
export function getPreset(presetId: string): Preset | undefined {
  const key = Object.keys(PRESETS).find(
    (k) => PRESETS[k].id === presetId
  );
  return key ? PRESETS[key as keyof typeof PRESETS] : undefined;
}

/**
 * List all preset IDs
 */
export function listPresetIds(): string[] {
  return Object.values(PRESETS).map((p) => p.id);
}

/**
 * List all presets with metadata
 */
export function listPresets(): Preset[] {
  return Object.values(PRESETS);
}

/**
 * Get preset by name (case-insensitive)
 */
export function getPresetByName(name: string): Preset | undefined {
  return Object.values(PRESETS).find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}
