import { BLOCK_DEFAULTS, WOOD_PALETTE, PROJECT_SCHEMA_VERSION } from './constants.js';

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file);
  });
}

export function downloadJSON(obj, filename = 'cutting-board-project.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function normaliseStripeDividers(data) {
  let dividers = parseInt(data.density, 10) || 1;
  dividers = clamp(dividers, 1, 4);
  
  let currentDividers = Array.isArray(data.stripeDividers) ? [...data.stripeDividers] : [];

  if (currentDividers.length !== dividers) {
    currentDividers = [];
    for (let i = 1; i <= dividers; i++) {
      currentDividers.push(Math.round((i * 100) / (dividers + 1)));
    }
  }

  currentDividers = currentDividers
    .map(p => clamp(parseInt(p, 10) || 50, 5, 95))
    .sort((a, b) => a - b);

  for (let i = 0; i < currentDividers.length; i++) {
    const minVal = i === 0 ? 5 : currentDividers[i - 1] + 1;
    const maxVal = i === currentDividers.length - 1 ? 95 : currentDividers[i + 1] - 1;
    currentDividers[i] = clamp(currentDividers[i], minVal, maxVal);
  }
  return { density: dividers, stripeDividers: currentDividers };
}

//grid string helpers 
//grid format - rows joined by "/", example "AABBCCDD/AABBCCDD/..."
//empty cells are spaces.

export function gridToString(cols, rows, cellValues) {
  const rowStrings = [];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      const val = (cellValues[r * cols + c] || '').toUpperCase();
      row += val.length === 1 ? val : ' ';
    }
    rowStrings.push(row);
  }
  return rowStrings.join('/');
}

export function gridFromString(gridStr, cols, rows) {
  const flat = [];
  const rowStrings = gridStr.split('/');
  for (let r = 0; r < rows; r++) {
    const rowStr = rowStrings[r] || '';
    for (let c = 0; c < cols; c++) {
      const ch = rowStr[c] || '';
      flat.push(ch === ' ' ? '' : ch);
    }
  }
  return flat;
}

// block serialization (save)
// only writes fields that differ from BLOCK_DEFAULTS
// zones: omits colour when it matches the wood palette entry

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function serialiseBlock(code, data) {
  const out = { code };

  if (data.pattern !== BLOCK_DEFAULTS.pattern) out.pattern = data.pattern;
  if (data.angle && data.angle !== BLOCK_DEFAULTS.angle) out.angle = data.angle;
  if ((data.density ?? 1) !== BLOCK_DEFAULTS.density) out.density = data.density;

  if (!arraysEqual(data.stripeDividers, BLOCK_DEFAULTS.stripeDividers)) {
    out.stripeDividers = data.stripeDividers;
  }

  const cx = data.cross?.x ?? 50;
  const cy = data.cross?.y ?? 50;
  if (cx !== BLOCK_DEFAULTS.cross.x || cy !== BLOCK_DEFAULTS.cross.y) {
    out.cross = { x: cx, y: cy };
  }

  out.zones = (data.zones || []).map(z => {
    const paletteColor = WOOD_PALETTE[z.wood]?.color;
    if (z.wood !== 'custom' && paletteColor && paletteColor === z.color) {
      return { wood: z.wood };
    }
    return { wood: z.wood, color: z.color };
  });

  return out;
}

//block hydration (load)
//merges saved data with defaults, resolves palette colours

export function hydrateBlock(saved) {
  const base = structuredClone(BLOCK_DEFAULTS);
  return {
    ...base,
    pattern: saved.pattern ?? base.pattern,
    angle: saved.angle ?? base.angle,
    density: saved.density ?? base.density,
    stripeDividers: saved.stripeDividers ? [...saved.stripeDividers] : [...base.stripeDividers],
    cross: saved.cross ? { ...base.cross, ...saved.cross } : { ...base.cross },
    // Runtime fields
    used: 0,
    isSolid: false,
    limit: 0, //set dynamically after load
    //zones — resolve colours from palette
    zones: (saved.zones || []).map(z => ({
      wood: z.wood,
      color: z.color ?? WOOD_PALETTE[z.wood]?.color ?? '#fff'
    }))
  };
}

// full project serialization
export function serialiseProject(config, activeBlockCodes, blockData) {
  //collect grid values from DOM
  const cells = document.querySelectorAll('.input-cell');
  const total = config.cols * config.rows;
  const cellValues = new Array(total);
  cells.forEach((input, i) => {
    cellValues[i] = (input.value || '').toUpperCase().slice(0, 1);
  });

  return {
    v: PROJECT_SCHEMA_VERSION,
    board: {
      cols: config.cols,
      rows: config.rows,
      grid: gridToString(config.cols, config.rows, cellValues)
    },
    blocks: activeBlockCodes.map(code => serialiseBlock(code, blockData[code]))
  };
}

//core visual engine
export function getGradientStyleForBlock(block, ratio = 1) {
    //solid check
    const isActuallySolid = block.isSolid || (block.zones?.length === 1);
    if (isActuallySolid) {
        return `background: ${block.zones?.[0]?.color ?? '#fff'};`;
    }

    //cross pattern
    if (block.pattern === 'cross') {
      const x = Math.max(5, Math.min(95, block.cross?.x ?? 50));
      const y = Math.max(5, Math.min(95, block.cross?.y ?? 50));
        
      //map zones to positions
      const c0 = block.zones?.[0]?.color ?? '#fff';
      const c1 = block.zones?.[1]?.color ?? c0;
      const c2 = block.zones?.[2]?.color ?? c0; 
      const c3 = block.zones?.[3]?.color ?? c0; 
      
      return `background: conic-gradient(at ${x}% ${y}%, 
        ${c1} 0deg 90deg, 
        ${c3} 90deg 180deg, 
        ${c2} 180deg 270deg, 
        ${c0} 270deg 360deg
      );`.replace(/\s+/g, ' ').trim();
    }

    //diagonal cross
    if (block.pattern === 'diag_cross') {
        const cTop = block.zones?.[0]?.color ?? '#fff';
        const cRight = block.zones?.[1]?.color ?? cTop;
        const cBottom = block.zones?.[2]?.color ?? cTop;
        const cLeft = block.zones?.[3]?.color ?? cTop;
        return `background: conic-gradient(from -45deg at 50% 50%, ${cTop} 0deg 90deg, ${cRight} 90deg 180deg, ${cBottom} 180deg 270deg, ${cLeft} 270deg 360deg );`.replace(/\s+/g, ' ').trim();
    }

    //3-way radial split
    if (block.pattern === 'radial_3') {
        const angle = block.angle ?? 0;
        const c1 = block.zones?.[0]?.color ?? '#fff'; // left wedge
        const c2 = block.zones?.[1]?.color ?? c1;     // top wedge
        const c3 = block.zones?.[2]?.color ?? c2;     // bottom wedge

        //calculate angle to corner based on width/height ratio
        const cornerRad = Math.atan(ratio);
        const cornerDeg = cornerRad * (180 / Math.PI);

        //calculate corners relative to 0deg (top)
        const degTL = 360 - cornerDeg;
        const degBL = 180 + cornerDeg;

        return `background: conic-gradient(from ${angle}deg at 50% 50%, 
            ${c2} 0deg 90deg, 
            ${c3} 90deg ${degBL}deg, 
            ${c1} ${degBL}deg ${degTL}deg, 
            ${c2} ${degTL}deg 360deg
        );`.replace(/\s+/g, ' ').trim();
    }

    //stripes
    const { density, stripeDividers } = normaliseStripeDividers(block);
    const angle = block.angle ?? 0;
    const colors = (block.zones || []).map(z => z.color);
    const numColors = colors.length || 1;

    const cuts = [0, ...stripeDividers, 100].slice(0, density + 2);
    const stops = [];
    for (let i = 0; i < cuts.length - 1; i++) {
        const start = cuts[i];
        const end = cuts[i + 1];
        const color = colors[i % numColors] ?? '#fff';
        stops.push(`${color} ${start}%, ${color} ${end}%`);
    }
    return `background: linear-gradient(${angle}deg, ${stops.join(', ')});`;
}