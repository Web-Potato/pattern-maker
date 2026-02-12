export const PROJECT_SCHEMA_VERSION = 1;
export const USER_PRESETS_KEY = 'cb_user_presets_v1';

// Block defaults — on save, only non-default values are serialized.
// On load, missing keys are filled from here.
export const BLOCK_DEFAULTS = {
  pattern: 'stripes',
  stripeDividers: [50],
  density: 1,
  angle: 0,
  cross: { x: 50, y: 50 },
};

export const WOOD_PALETTE = {
  "custom": { name: "Custom Color", color: "#ffffff", group: "Basic" },
  "maple_hard": { name: "Maple (Hard)", color: "#F2DCB3", group: "Domestic" },
  "walnut_black": { name: "Walnut (Dark)", color: "#5D4037", group: "Domestic" },
  "walnut_sap": { name: "Walnut (Sapwood)", color: "#A68B6C", group: "Domestic" },
  "cherry": { name: "Cherry", color: "#A65E44", group: "Domestic" },
  "oak_white": { name: "Oak (White)", color: "#C2B280", group: "Domestic" },
  "oak_red": { name: "Oak (Red)", color: "#D6AD85", group: "Domestic" },
  "ash": { name: "Ash", color: "#eee9db", group: "Domestic" },
  "hickory": { name: "Hickory", color: "#BAA084", group: "Domestic" },
  "beech": { name: "Beech", color: "#E2CBA6", group: "Domestic" },
  "birch": { name: "Birch", color: "#F7E6D0", group: "Domestic" },
  //IMPORTED & EXOTIC
  "mahogany_gen": { name: "Mahogany (Genuine)", color: "#6D3728", group: "Exotic" },
  "mahogany_santos": { name: "Mahogany (Santos)", color: "#804030", group: "Exotic" },
  "sapele": { name: "Sapele", color: "#8A4B38", group: "Exotic" },
  "padauk": { name: "Padauk", color: "#D14828", group: "Exotic" },
  "purpleheart": { name: "Purpleheart", color: "#6A3762", group: "Exotic" },
  "bloodwood": { name: "Bloodwood", color: "#6E1C1C", group: "Exotic" },
  "yellowheart": { name: "Yellowheart", color: "#F5C71A", group: "Exotic" },
  "wenge": { name: "Wenge", color: "#362823", group: "Exotic" },
  "bubinga": { name: "Bubinga", color: "#8F4E45", group: "Exotic" },
  "zebrawood": { name: "Zebrawood", color: "#B89358", group: "Exotic" },
  "teak": { name: "Teak", color: "#8F6038", group: "Exotic" },
  "jatoba": { name: "Jatoba (Braz. Cherry)", color: "#8F3E30", group: "Exotic" },
  "canarywood": { name: "Canarywood", color: "#D9A84E", group: "Exotic" },
  "iroko": { name: "Iroko", color: "#A07838", group: "Exotic" },
  // EXTREMES
  "holly": { name: "Holly (White)", color: "#FDFDF8", group: "Accent" },
  "ebony": { name: "Ebony (Black)", color: "#1A1A1A", group: "Accent" }
};

// ── Schema Migrations (future use) ─────────────────────────────
// Each key migrates from that version to the next.
// for future use if project schema changes. When loading, the project is migrated up to the latest version via migrateProject().
//   1: (p) => { /* transform v1→v2 */ p.v = 2; return p; }
export const MIGRATIONS = {
  // 1: (project) => { ... project.v = 2; return project; },
};

export function migrateProject(project) {
  let p = structuredClone(project);
  let version = p.v ?? 1;

  while (version < PROJECT_SCHEMA_VERSION) {
    const fn = MIGRATIONS[version];
    if (!fn) throw new Error(`No migration path from schema v${version}`);
    p = fn(p);
    version = p.v ?? version + 1;
  }

  return p;
}