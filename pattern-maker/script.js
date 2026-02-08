const WOOD_PALETTE = {
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

let config = { cols: 8, rows: 6 };
let activeBlockCodes = ['A', 'B'];
const blockData = {};

const visualGrid = document.getElementById('visual-grid');
const inputGrid = document.getElementById('input-grid');
const controlsArea = document.getElementById('controls-area');
const rowsInput = document.getElementById('grid-rows');
const colsInput = document.getElementById('grid-cols');
const applySizeBtn = document.getElementById('apply-size-btn');
const addBlockBtn = document.getElementById('add-block-btn');
const capacityDisplay = document.getElementById('capacity-pot');
const blockPalette = document.getElementById('block-palette');
const gridToggleBtn = document.getElementById('toggle-gridlines-btn');
const gridThickness = document.getElementById('gridline-thickness');
const gridMode = document.getElementById('gridline-mode');
const clearPatternBtn = document.getElementById('clear-pattern-btn');

const exportProjectBtn = document.getElementById('export-project-btn');
const importProjectBtn = document.getElementById('import-project-btn');
const importProjectFile = document.getElementById('import-project-file');
const presetListDemo = document.getElementById('preset-list-demo');
const presetListUser = document.getElementById('preset-list-user');
const savePresetBtn = document.getElementById('save-preset-btn');
const clearSavedPresetsBtn = document.getElementById('clear-saved-presets-btn');


//EVENT DELEGATION
const blockActions = {
  'rotate-angle':     (type) => rotateBlockAngle(type),
  'zone-add':         (type) => addZone(type),
  'zone-remove':      (type) => removeZone(type),
  'cycle-colors':     (type) => cycleColors(type),
  'rotate':           (type, d) => rotateBlockDef(type, d.dir),
  'flip':             (type, d) => flipBlockDef(type, d.axis),
  'duplicate':        (type) => duplicateBlockType(type),
  'duplicate-mirror': (type, d) => duplicateMirroredBlock(type, d.axis),
  'delete':           (type) => deleteBlockType(type),
  'reset-dividers':   (type) => resetStripeDividersEven(type),
};

/**
 * Change/input handlers for controlsArea delegation.
 */
const blockChangeActions = {
  'zone-wood':        (type, d, el) => updateZoneWood(type, parseInt(d.index), el.value),
  'zone-color':       (type, d, el) => updateZoneColor(type, parseInt(d.index), el.value),
  'pattern-type':     (type, d, el) => updatePatternType(type, el.value),
  'stripe-divider':   (type, d, el) => updateStripeDivider(type, parseInt(d.index), el.value),
  'cross-setting':    (type, d, el) => updateCrossSetting(type, d.axis, el.value),
  'setting-density':  (type, d, el) => updateSetting(type, 'density', el.value),
  'setting-limit':    (type, d, el) => updateSetting(type, 'limit', el.value),
};

function setupDelegation() {
  // controls area
  controlsArea.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;
    const { action, type, ...rest } = trigger.dataset;
    if (blockActions[action]) blockActions[action](type, rest);
  });

  // controls area - change and input delegation
  // (covers selects, color pickers, range sliders, number inputs)
  controlsArea.addEventListener('input', handleControlChange);
  controlsArea.addEventListener('change', handleControlChange);

  //input grid: copy row/column dropdowns
  inputGrid.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.classList.contains('copy-select')) return;

    const { copyTarget, copyType } = el.dataset;
    const targetIdx = parseInt(copyTarget);
    const sourceIdx = parseInt(el.value);

    if (copyType === 'row') {
      copyRowPattern(targetIdx, sourceIdx);
    } else if (copyType === 'col') {
      copyColPattern(targetIdx, sourceIdx);
    }

    el.value = '';
  });

  // header buttons
  clearPatternBtn.addEventListener('click', clearGrid);
  applySizeBtn.addEventListener('click', updateGridSize);
  addBlockBtn.addEventListener('click', addNewBlockType);

  // gridline controls
  if (gridToggleBtn && gridThickness && gridMode) {
    gridToggleBtn.addEventListener('click', () => {
      const isOn = gridToggleBtn.dataset.on === 'true';
      setGridlines(!isOn);
    });
    gridThickness.addEventListener('change', updateGridlines);
    gridMode.addEventListener('change', updateGridlines);
  }
}

function setupProjectIO() {
  if (exportProjectBtn) {
    exportProjectBtn.addEventListener('click', () => {
      const project = serializeProject();

      const name = prompt('Project name?', project.name || 'Untitled Project');
      if (name) project.name = name;

      const filename =
        (project.name || 'cutting-board-project')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      downloadJSON(project, `${filename}.json`);
    });
  }

  if (importProjectBtn && importProjectFile) {
    importProjectBtn.addEventListener('click', () => importProjectFile.click());

    importProjectFile.addEventListener('change', async () => {
      const file = importProjectFile.files?.[0];
      importProjectFile.value = '';
      if (!file) return;

      try {
        const text = await readFileAsText(file);
        const project = JSON.parse(text);
        loadProject(project);
      } catch (err) {
        console.error(err);
        alert('Could not import JSON file.');
      }
    });
  }
}


function handleControlChange(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, type, ...rest } = el.dataset;
  if (!type) return;

  const handler = blockChangeActions[action];
  if (!handler) return;

  handler(type, rest, el);
}

// PRESET LOGIC

const PROJECT_SCHEMA_VERSION = 1;
const USER_PRESETS_KEY = 'cb_user_presets_v1';

function serializeProject() {
  const total = config.cols * config.rows;

  // grid from DOM
  const inputs = document.querySelectorAll('.input-cell');
  const grid = new Array(total);
  inputs.forEach((input, i) => {
    grid[i] = (input.value || '').toUpperCase().slice(0, 1);
  });

  //blocks
  const data = {};
  activeBlockCodes.forEach(code => {
    const b = blockData[code];
    if (!b) return;
    data[code] = {
      pattern: b.pattern,
      stripeDividers: Array.isArray(b.stripeDividers) ? [...b.stripeDividers] : [50],
      density: b.density ?? 1,
      isSolid: !!b.isSolid,
      angle: b.angle ?? 0,
      limit: b.limit ?? 0,
      cross: b.cross ? { x: b.cross.x ?? 50, y: b.cross.y ?? 50 } : { x: 50, y: 50 },
      zones: Array.isArray(b.zones) ? b.zones.map(z => ({ wood: z.wood ?? 'custom', color: z.color ?? '#ffffff' })) : []
    };
  });

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: "Untitled Project",
    board: { cols: config.cols, rows: config.rows, grid },
    blocks: { active: [...activeBlockCodes], data }
  };
}

function downloadJSON(obj, filename = 'cutting-board-project.json') {
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

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsText(file);
  });
}

function setupPresetTabs() {
  const tabs = document.querySelectorAll('.preset-tab');
  const panels = document.querySelectorAll('.preset-tab-panel');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // button active state
      tabs.forEach(t => t.classList.toggle('btn-active', t === btn));

      // show/hide panels
      panels.forEach(p => {
        p.classList.toggle('hidden', p.dataset.panel !== tab);
      });
    });
  });
}

function loadProject(project) {
  //minimal validation
  if (!project || project.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    alert('Unsupported project format/version.');
    return;
  }

  const cols = project.board?.cols;
  const rows = project.board?.rows;
  const grid = project.board?.grid;

  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 2 || cols > 20 || rows < 2 || rows > 20) {
    alert('Invalid board size in project.');
    return;
  }
  if (!Array.isArray(grid) || grid.length !== cols * rows) {
    alert('Invalid grid data in project.');
    return;
  }

  const active = project.blocks?.active;
  const data = project.blocks?.data;
  if (!Array.isArray(active) || !data || typeof data !== 'object') {
    alert('Invalid blocks data in project.');
    return;
  }

  //replace state
  config.cols = cols;
  config.rows = rows;
  colsInput.value = String(cols);
  rowsInput.value = String(rows);

  //reset blockData
  for (const k of Object.keys(blockData)) delete blockData[k];
  activeBlockCodes = [...active];

  //load blocks
  activeBlockCodes.forEach(code => {
    if (!data[code]) return;
    const b = data[code];

    blockData[code] = {
      pattern: b.pattern ?? 'stripes',
      stripeDividers: Array.isArray(b.stripeDividers) ? [...b.stripeDividers] : [50],
      density: b.density ?? 1,
      isSolid: !!b.isSolid,
      angle: b.angle ?? 0,
      limit: b.limit ?? 0,
      used: 0,
      cross: b.cross ? { x: b.cross.x ?? 50, y: b.cross.y ?? 50 } : { x: 50, y: 50 },
      zones: Array.isArray(b.zones) ? b.zones.map(z => ({ wood: z.wood ?? 'custom', color: z.color ?? '#ffffff' })) : []
    };

    //keep divider constraints
    if (blockData[code].pattern === 'stripes') ensureStripeDividers(code);
  });

  //rebuild grids
  const cellRatio = (4 * config.rows) / (3 * config.cols);
  document.documentElement.style.setProperty('--cell-ratio', cellRatio);

  createGrids();
  renderControls();

  //fill grid inputs and paint
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach((input, i) => {
    const v = (grid[i] || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    input.value = v;
    handleGridInput(i, v);
  });

  // update derived UI
  updateAllVisuals();
  updateInventoryCounts();
  updateCapacityPot();
  renderBlockPalette();
}

function getUserPresets() {
  try {
    return JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || '[]');
  } catch {
    return [];
  }
}

function setUserPresets(list) {
  localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(list));
}

function renderUserPresets() {
  if (!presetListUser) return;

  const presets = getUserPresets();
  presetListUser.innerHTML = '';

  if (presets.length === 0) {
    presetListUser.textContent = 'No saved presets yet.';
    return;
  }

  presets.forEach(p => presetListUser.appendChild(renderPresetCard(p)));
}

function setupUserPresets() {
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => {
      const project = serializeProject();
      const name = prompt('Preset name?', project.name || 'My Preset');
      if (!name) return;

      project.name = name;

      const preset = {
        id: (crypto.randomUUID?.() ?? String(Date.now())),
        name,
        project
      };

      const list = getUserPresets();
      list.unshift(preset);
      setUserPresets(list);
      renderUserPresets();
    });
  }

  if (clearSavedPresetsBtn) {
    clearSavedPresetsBtn.addEventListener('click', () => {
      const ok = confirm('Clear all saved presets from this browser?');
      if (!ok) return;
      setUserPresets([]);
      renderUserPresets();
    });
  }

  renderUserPresets();
}

function getGradientStyleForBlock(block) {
  const isActuallySolid = block.isSolid || (block.zones?.length === 1);
  if (isActuallySolid) return `background: ${(block.zones?.[0]?.color ?? '#fff')};`;

  if (block.pattern === 'cross') {
    const x = Math.max(5, Math.min(95, block.cross?.x ?? 50));
    const y = Math.max(5, Math.min(95, block.cross?.y ?? 50));

    const leftW = x, rightW = 100 - x, topH = y, bottomH = 100 - y;
    const c0 = block.zones?.[0]?.color ?? '#fff';
    const c1 = block.zones?.[1]?.color ?? c0;
    const c2 = block.zones?.[2]?.color ?? c0;
    const c3 = block.zones?.[3]?.color ?? c0;

    return `
      background-image:
        linear-gradient(${c0}, ${c0}),
        linear-gradient(${c1}, ${c1}),
        linear-gradient(${c2}, ${c2}),
        linear-gradient(${c3}, ${c3});
      background-size:
        ${leftW}% ${topH}%,
        ${rightW}% ${topH}%,
        ${leftW}% ${bottomH}%,
        ${rightW}% ${bottomH}%;
      background-position:
        0% 0%,
        100% 0%,
        0% 100%,
        100% 100%;
      background-repeat: no-repeat;
    `.replace(/\s+/g, ' ').trim();
  }

  if (block.pattern === 'diag_cross') {
    const cTop = block.zones?.[0]?.color ?? '#fff';
    const cRight = block.zones?.[1]?.color ?? cTop;
    const cBottom = block.zones?.[2]?.color ?? cTop;
    const cLeft = block.zones?.[3]?.color ?? cTop;

    return `background: conic-gradient(from -45deg at 50% 50%,
      ${cTop} 0deg 90deg,
      ${cRight} 90deg 180deg,
      ${cBottom} 180deg 270deg,
      ${cLeft} 270deg 360deg
    );`.replace(/\s+/g, ' ').trim();
  }

  //stripes
  const dividers = clamp(parseInt(block.density, 10) || 1, 1, 4);
  const angle = block.angle ?? 0;
  const colors = (block.zones || []).map(z => z.color);
  const numColors = colors.length || 1;

  //check dividers exist
  let stripeDividers = Array.isArray(block.stripeDividers) ? [...block.stripeDividers] : [];
  if (stripeDividers.length !== dividers) {
    stripeDividers = [];
    for (let i = 1; i <= dividers; i++) stripeDividers.push(Math.round((i * 100) / (dividers + 1)));
  }
  stripeDividers = stripeDividers
    .map(p => clamp(parseInt(p, 10) || 50, 5, 95))
    .sort((a, b) => a - b);

  const cuts = [0, ...stripeDividers, 100].slice(0, dividers + 2);

  const stops = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const start = cuts[i];
    const end = cuts[i + 1];
    const color = colors[i % numColors] ?? '#fff';
    stops.push(`${color} ${start}%`, `${color} ${end}%`);
  }

  return `background: linear-gradient(${angle}deg, ${stops.join(', ')});`;
}

async function loadPresets() {
  if (!presetListDemo) return;

  presetListDemo.textContent = 'Loading presets...';

  try {
    const res = await fetch('./presets.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const presets = Array.isArray(data.presets) ? data.presets : [];
    presetListDemo.innerHTML = '';

    presets.forEach(p => presetListDemo.appendChild(renderPresetCard(p)));

    if (presets.length === 0) presetListDemo.textContent = 'No presets found.';
  } catch (err) {
    console.error(err);
    presetListDemo.textContent = 'Failed to load presets.';
  }
}

function renderPresetCard(preset) {
  const card = document.createElement('div');
  card.className = 'preset-card';
  
  const thumb = renderPresetThumbnail(preset.project, 250);
  card.appendChild(thumb);
  
  card.addEventListener('click', () => loadProject(preset.project));
  
  return card;
}

function renderPresetThumbnail(project, width = 250) {
  const cols = project?.board?.cols ?? 1;
  const rows = project?.board?.rows ?? 1;
  const grid = project?.board?.grid ?? [];
  const blocks = project?.blocks?.data ?? {};

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display:grid;
    grid-template-columns: repeat(${cols}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    width: 100%;
    aspect-ratio: 4 / 3;
    border: 1px solid #333;
  `;

  const total = cols * rows;
  for (let i = 0; i < total; i++) {
    const cell = document.createElement('div');
    const code = (grid[i] || '').toUpperCase();
    const block = blocks[code];

    cell.style.cssText = block ? getGradientStyleForBlock(block) : 'background:#fff;';
    wrap.appendChild(cell);
  }

  return wrap;
}


// ─── INIT ───────────────────────────────────────────────────────────

function init() {
  activeBlockCodes = ['A', 'B', 'C'];

  initializeBlockData('A', { preset: 'stripes_demo' });
  initializeBlockData('B', { preset: 'cross_demo' });
  initializeBlockData('C', { preset: 'diag_demo' });

  setupDelegation();
  setupProjectIO();
  loadPresets();

  // GRIDLINE restore
  const saved = JSON.parse(localStorage.getItem('gridlines') || '{}');
  if (saved.thickness) gridThickness.value = saved.thickness;
  if (saved.mode) gridMode.value = saved.mode;
  setGridlines(!!saved.on);
  updateGridlines();

  renderControls();
  updateGridSize();
  updateCapacityPot();
  setupPresetTabs();
  setupUserPresets();
}

function initializeBlockData(code, opts = {}) {
    //base defaults
    blockData[code] = {
        pattern: 'stripes',
        stripeDividers: [50],
        density: 1,
        isSolid: false,
        angle: 0,
        limit: 8,
        used: 0,
        cross: { x: 50, y: 50 },
        zones: [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color },
            { wood: 'walnut_black', color: WOOD_PALETTE.walnut_black.color }
        ]
    };

    // block presets
    if (opts.preset === 'stripes_demo') {
        blockData[code].pattern = 'stripes';
        blockData[code].density = 1;
        blockData[code].angle = 0;
        blockData[code].zones = [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color },
            { wood: 'walnut_black', color: WOOD_PALETTE.walnut_black.color }
        ];
    }

    if (opts.preset === 'cross_demo') {
        blockData[code].pattern = 'cross';
        blockData[code].cross = { x: 50, y: 50 };
        blockData[code].zones = [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color },
            { wood: 'walnut_black', color: WOOD_PALETTE.walnut_black.color },
            { wood: 'cherry', color: WOOD_PALETTE.cherry.color },
            { wood: 'sapele', color: WOOD_PALETTE.sapele.color }
        ];
    }

    if (opts.preset === 'diag_demo') {
        blockData[code].pattern = 'diag_cross';
        blockData[code].zones = [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color },
            { wood: 'walnut_black', color: WOOD_PALETTE.walnut_black.color },
            { wood: 'cherry', color: WOOD_PALETTE.cherry.color },
            { wood: 'sapele', color: WOOD_PALETTE.sapele.color }
        ];
    }

    //new block preset
    if (opts.preset === 'solid_new') {
        blockData[code].pattern = 'stripes';
        blockData[code].density = 1;
        blockData[code].angle = 0;
        blockData[code].zones = [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color }
        ];
    }
}

// ─── GRID LOGIC ─────────────────────────────────────────────────────

function updateGridSize() {
    let newCols = parseInt(colsInput.value);
    let newRows = parseInt(rowsInput.value);
    
    if(newCols < 2) newCols = 2; if(newCols > 20) newCols = 20;
    if(newRows < 2) newRows = 2; if(newRows > 20) newRows = 20;

    config.cols = newCols;
    config.rows = newRows;

    //calculate ratio for cells
    const cellRatio = (4 * config.rows) / (3 * config.cols);
    document.documentElement.style.setProperty('--cell-ratio', cellRatio);

    createGrids();
    updateAllVisuals();
    updateCapacityPot();
}

function setGridlines(on) {
  visualGrid.classList.toggle('show-gridlines', on);

  //update button state
  gridToggleBtn.dataset.on = on ? 'true' : 'false';
  gridToggleBtn.textContent = on ? 'Hide Grid' : 'Show Grid';
  gridToggleBtn.classList.toggle('btn-active', on);

  //persist
  localStorage.setItem('gridlines', JSON.stringify({
    on,
    thickness: gridThickness.value,
    mode: gridMode.value
  }));
}

function updateGridlines() {
  document.documentElement.style.setProperty(
    '--gridline-thickness',
    gridThickness.value + 'px'
  );

  visualGrid.classList.toggle(
    'gridlines-invert',
    gridMode.value === 'invert'
  );

  const saved = JSON.parse(localStorage.getItem('gridlines') || '{}');
  localStorage.setItem('gridlines', JSON.stringify({
    on: saved.on ?? false,
    thickness: gridThickness.value,
    mode: gridMode.value
  }));
}


function createGrids() {
  document.documentElement.style.setProperty('--grid-cols', config.cols);
  document.documentElement.style.setProperty('--grid-rows', config.rows);

  visualGrid.innerHTML = '';
  inputGrid.innerHTML = '';

  const totalCells = config.cols * config.rows;

  // VISUAL GRID
  for (let i = 0; i < totalCells; i++) {
    const vCell = document.createElement('div');
    vCell.className = 'visual-cell';
    vCell.id = `v-cell-${i}`;
    visualGrid.appendChild(vCell);
  }

  // INPUT GRID
  
  // Top Left Corner
  const corner = document.createElement('div');
  corner.className = 'grid-header-cell';
  inputGrid.appendChild(corner);

  // Column Headers + Copy Dropdown
  // Uses data attributes instead of inline onchange
  for (let c = 0; c < config.cols; c++) {
    const colHeader = document.createElement('div');
    colHeader.className = 'grid-header-cell';

    let optionHTML = `<option value="" disabled selected>${String.fromCharCode(65 + c)}</option>`;

    if (config.cols > 1) {
      optionHTML += `<optgroup label="Copy From...">`;
      for (let copyC = 0; copyC < config.cols; copyC++) {
        if (copyC !== c) {
            optionHTML += `<option value="${copyC}">Col ${String.fromCharCode(65 + copyC)}</option>`;
        }
      }
      optionHTML += `</optgroup>`;
    }

    colHeader.innerHTML = `
        <div class="row-header-content">
            <span class="row-label-text">${String.fromCharCode(65 + c)}</span>
            <span class="copy-icon">▼</span>
            <select class="copy-select"
                    data-copy-type="col"
                    data-copy-target="${c}">
                ${optionHTML}
            </select>
        </div>
    `;

    inputGrid.appendChild(colHeader);
  }

  // Rows
  for (let r = 0; r < config.rows; r++) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'grid-header-cell';
    
    let optionHTML = `<option value="" disabled selected>${r + 1}</option>`;
    
    if (config.rows > 1) {
      optionHTML += `<optgroup label="Copy From...">`;
      for (let copyR = 0; copyR < config.rows; copyR++) {
        if (copyR !== r) {
            optionHTML += `<option value="${copyR}">Row ${copyR + 1}</option>`;
        }
      }
      optionHTML += `</optgroup>`;
    }

    rowHeader.innerHTML = `
        <div class="row-header-content">
            <span class="row-label-text">${r + 1}</span>
            <span class="copy-icon">▼</span>
            <select class="copy-select"
                    data-copy-type="row"
                    data-copy-target="${r}">
                ${optionHTML}
            </select>
        </div>
    `;
    
    inputGrid.appendChild(rowHeader);

    // Input cells
    for (let c = 0; c < config.cols; c++) {
      const index = (r * config.cols) + c;
      const iCell = document.createElement('input');
      iCell.type = 'text';
      iCell.className = 'input-cell';
      iCell.id = `i-cell-${index}`;
      iCell.dataset.row = r;
      iCell.dataset.col = c;

      iCell.addEventListener('keydown', (e) => {
        const k = e.key;

        const allowed = [
          'Backspace','Delete','Tab','Enter',
          'ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'
        ];
        if (allowed.includes(k) || e.ctrlKey || e.metaKey) return;

        if (!/^[a-zA-Z]$/.test(k)) e.preventDefault();
      });

      //sanitise on input/paste
      iCell.addEventListener('input', (e) => {
        const v = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '');
        e.target.value = v.slice(0, 1);

        handleGridInput(index, e.target.value);
        updateInventoryCounts();
      });

      inputGrid.appendChild(iCell);
    }
  }
}

// ─── COPY ROW / COLUMN ──────────────────────────────────────────────

function copyRowPattern(targetRowIdx, sourceRowIdx) {
  sourceRowIdx = parseInt(sourceRowIdx, 10);

  for (let c = 0; c < config.cols; c++) {
    const sourceCellId = `i-cell-${(sourceRowIdx * config.cols) + c}`;
    const targetCellId = `i-cell-${(targetRowIdx * config.cols) + c}`;

    const sourceVal = document.getElementById(sourceCellId).value;
    const targetInput = document.getElementById(targetCellId);

    targetInput.value = sourceVal;
    handleGridInput((targetRowIdx * config.cols) + c, sourceVal);
  }

  updateInventoryCounts();
}

function copyColPattern(targetColIdx, sourceColIdx) {
  sourceColIdx = parseInt(sourceColIdx);

  for (let r = 0; r < config.rows; r++) {
    const sourceCellId = `i-cell-${(r * config.cols) + sourceColIdx}`;
    const targetCellId = `i-cell-${(r * config.cols) + targetColIdx}`;

    const sourceVal = document.getElementById(sourceCellId).value;
    const targetInput = document.getElementById(targetCellId);

    targetInput.value = sourceVal;
    handleGridInput((r * config.cols) + targetColIdx, sourceVal);
  }
  updateInventoryCounts();
}

function handleGridInput(index, value) {
  const vCell = document.getElementById(`v-cell-${index}`);
  const code = (value || '').toUpperCase();

  if (activeBlockCodes.includes(code)) {
    vCell.style.cssText = getGradientStyle(code);
  } else {
    vCell.style.cssText = 'background-color: #fff;';
  }
}

function updateCapacityPot() {
  const totalSlots = config.cols * config.rows;
  let assigned = 0;
  activeBlockCodes.forEach(code => assigned += (blockData[code].limit || 0));
  const remaining = totalSlots - assigned;

  if (remaining >= 0) {
    capacityDisplay.textContent = `Unassigned Capacity: ${remaining} blocks`;
    capacityDisplay.className = 'capacity-display pot-ok';
  } else {
    capacityDisplay.textContent = `Over Capacity by ${Math.abs(remaining)} blocks!`;
    capacityDisplay.className = 'capacity-display pot-neg';
  }
}

function clearGrid() {
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    input.value = '';
    handleGridInput(parseInt(input.id.replace('i-cell-',''), 10), '');
  });

  updateInventoryCounts();
}

function addNewBlockType() {
    const nextChar = getNextAvailableBlockCode();
    if (!nextChar) return;

    activeBlockCodes.push(nextChar);
    initializeBlockData(nextChar, { preset: 'solid_new' });

    renderControls();
    updateAllVisuals();
    updateCapacityPot();
}

function getNextAvailableBlockCode() {
  for (let code = 65; code <= 90; code++) {
    const candidate = String.fromCharCode(code);
    if (!activeBlockCodes.includes(candidate)) return candidate;
  }
  return null;
}

function duplicateBlockBase(sourceType) {
  const nextChar = getNextAvailableBlockCode();
  if (!nextChar) return null;

  const src = blockData[sourceType];
  const clone = JSON.parse(JSON.stringify(src));
  clone.used = 0;

  blockData[nextChar] = clone;

  const srcIndex = activeBlockCodes.indexOf(sourceType);
  if (srcIndex >= 0) activeBlockCodes.splice(srcIndex + 1, 0, nextChar);
  else activeBlockCodes.push(nextChar);

  return nextChar;
}

function applyFlipToBlockData(data, axis) {
  if (!data || (data.isSolid || data.zones.length === 1)) return;

  if (data.pattern === 'cross') {
    const z = data.zones;

    if (axis === 'h') {
      data.zones = [z[1], z[0], z[3], z[2]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - x, y };
    } else {
      data.zones = [z[2], z[3], z[0], z[1]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x, y: 100 - y };
    }

    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));

  } else if (data.pattern === 'diag_cross') {
    const z = data.zones;

    if (axis === 'h') {
      data.zones = [z[0], z[3], z[2], z[1]];
    } else {
      data.zones = [z[2], z[1], z[0], z[3]];
    }

  } else {
    let a = data.angle ?? 0;
    if (axis === 'h') a = (360 - a) % 360;
    else a = (180 - a) % 360;
    data.angle = ((a % 360) + 360) % 360;
  }
}


// ─── BLOCK ACTION HANDLERS ──────────────────────────────────────────
// (Previously window.* — now plain functions called via delegation)

function rotateBlockAngle(type) {
  let current = blockData[type].angle;
  current += 45;
  current = ((current % 360) + 360) % 360;
  blockData[type].angle = current;
  renderControls();
  updateAllVisuals();
}

function updateZoneWood(type, index, woodKey) {
  blockData[type].zones[index].wood = woodKey;
  blockData[type].zones[index].color = WOOD_PALETTE[woodKey].color;
  const idx = activeBlockCodes.indexOf(type);
  const colorInput = document.querySelectorAll('.block-control')[idx]?.querySelectorAll('input[type="color"]')[index];
  if(colorInput) colorInput.value = WOOD_PALETTE[woodKey].color;
  updateAllVisuals();
}

function updateZoneColor(type, index, hex) {
  blockData[type].zones[index].color = hex;
  blockData[type].zones[index].wood = 'custom';
  const idx = activeBlockCodes.indexOf(type);
  const select = document.querySelectorAll('.block-control')[idx]?.querySelectorAll('select.wood-dropdown')[index];
  if(select) select.value = 'custom';
  updateAllVisuals();
}

function addZone(type) {
  blockData[type].zones.push({ wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color });

  const data = blockData[type];

  if (data.pattern === 'stripes' && data.zones.length > 1) {
    const neededDividers = Math.min(4, data.zones.length - 1);
    if ((data.density || 1) < neededDividers) data.density = neededDividers;
    ensureStripeDividers(type);
  }

  renderControls();
  updateAllVisuals();
}

function removeZone(type) {
  if (blockData[type].zones.length > 1) {
    blockData[type].zones.pop();
    renderControls();
    updateAllVisuals();
  }
}

function cycleColors(type) {
  const last = blockData[type].zones.pop();
  blockData[type].zones.unshift(last);
  renderControls();
  updateAllVisuals();
}

function updatePatternType(type, pattern) {
  blockData[type].pattern = pattern;

  if (!blockData[type].cross) blockData[type].cross = { x: 50, y: 50 };

  if (pattern === 'cross' || pattern === 'diag_cross') {
      while (blockData[type].zones.length < 4) {
          const last = blockData[type].zones[blockData[type].zones.length - 1];
          blockData[type].zones.push({ wood: last.wood, color: last.color });
      }
  }

  renderControls();
  updateAllVisuals();
}

function updateStripeDivider(type, idx, value) {
  const data = blockData[type];
  if (!data) return;

  ensureStripeDividers(type);

  let v = parseInt(value, 10);
  if (isNaN(v)) v = data.stripeDividers[idx] ?? 50;

  const lower = idx === 0 ? 5 : data.stripeDividers[idx - 1] + 1;
  const upper = idx === data.stripeDividers.length - 1 ? 95 : data.stripeDividers[idx + 1] - 1;

  v = clamp(v, lower, upper);
  data.stripeDividers[idx] = v;

  const readout = document.getElementById(`stripe-${type}-d${idx}`);
  if (readout) readout.textContent = v;

  updateAllVisuals();
}

function updateCrossSetting(type, axis, value) {
  let v = parseInt(value, 10);
  if (isNaN(v)) v = 50;

  if (v < 5) v = 5;
  if (v > 95) v = 95;

  if (!blockData[type].cross) blockData[type].cross = { x: 50, y: 50 };
  blockData[type].cross[axis] = v;

  const readout = document.getElementById(`cross-${type}-${axis}`);
  if (readout) readout.textContent = v;

  updateAllVisuals();
}

function rotateBlockDef(type, dir) {
  const data = blockData[type];
  if (!data || (data.isSolid || data.zones.length === 1)) return;

  if (data.pattern === 'cross') {
    const z = data.zones;

    if (dir === 'right') {
      data.zones = [z[2], z[0], z[3], z[1]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - y, y: x };
    } else {
      data.zones = [z[1], z[3], z[0], z[2]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: y, y: 100 - x };
    }

    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));

  } else if (data.pattern === 'diag_cross') {
    const z = data.zones;

    if (dir === 'right') {
        data.zones = [z[3], z[0], z[1], z[2]];
    } else {
        data.zones = [z[1], z[2], z[3], z[0]];
    }

  } else {
    const delta = (dir === 'right') ? 90 : -90;
    let a = (data.angle ?? 0) + delta;
    a = ((a % 360) + 360) % 360;
    data.angle = a;
  }

  renderControls();
  updateAllVisuals();
}

function flipBlockDef(type, axis) {
  const data = blockData[type];
  if (!data || (data.isSolid || data.zones.length === 1)) return;

  if (data.pattern === 'cross') {
    const z = data.zones;

    if (axis === 'h') {
      data.zones = [z[1], z[0], z[3], z[2]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - x, y: y };
    } else {
      data.zones = [z[2], z[3], z[0], z[1]];
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: x, y: 100 - y };
    }

    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));

  } else if (data.pattern === 'diag_cross') {
    const z = data.zones;

    if (axis === 'h') {
      data.zones = [z[0], z[3], z[2], z[1]];
    } else {
      data.zones = [z[2], z[1], z[0], z[3]];
    }

  } else {
    let a = data.angle ?? 0;

    if (axis === 'h') {
      a = (360 - a) % 360;
    } else {
      a = (180 - a) % 360;
    }

    data.angle = ((a % 360) + 360) % 360;
  }

  renderControls();
  updateAllVisuals();
}

function resetStripeDividersEven(type) {
  const data = blockData[type];
  if (!data || data.pattern !== 'stripes') return;

  data.density = clamp(parseInt(data.density, 10) || 1, 1, 4);

  data.stripeDividers = [];
  for (let i = 1; i <= data.density; i++) {
    data.stripeDividers.push(Math.round((i * 100) / (data.density + 1)));
  }

  renderControls();
  updateAllVisuals();
}

function updateSetting(type, setting, value) {
  if (setting === 'limit') {
    blockData[type].limit = parseInt(value) || 0;
    updateInventoryCounts();
    updateCapacityPot();
    return;
  }

  if (setting === 'density') {
    blockData[type].density = clamp(parseInt(value, 10) || 1, 1, 4);

    if (blockData[type].pattern === 'stripes') {
      ensureStripeDividers(type);
    }

    renderControls();
    updateAllVisuals();
    return;
  }

  updateAllVisuals();
}

function duplicateBlockType(sourceType) {
  const newType = duplicateBlockBase(sourceType);
  if (!newType) {
    alert("No more block letters available (A–Z).");
    return;
  }

  renderControls();
  updateAllVisuals();
  updateCapacityPot();
  updateInventoryCounts();
}

function duplicateMirroredBlock(sourceType, axis) {
  const newType = duplicateBlockBase(sourceType);
  if (!newType) {
    alert("No more block letters available (A–Z).");
    return;
  }

  applyFlipToBlockData(blockData[newType], axis);

  renderControls();
  updateAllVisuals();
  updateInventoryCounts();
  updateCapacityPot();
}

function deleteBlockType(type) {
  if (activeBlockCodes.length <= 1) {
    alert("You must have at least one block type.");
    return;
  }

  const ok = confirm(`Delete Block ${type}? Any ${type} cells in the grid will be cleared.`);
  if (!ok) return;

  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    if (input.value.toUpperCase() === type) {
      input.value = '';
      const row = parseInt(input.dataset.row, 10);
      const col = parseInt(input.dataset.col, 10);
      const linearIndex = (row * config.cols) + col;
      handleGridInput(linearIndex, '');
    }
  });

  activeBlockCodes = activeBlockCodes.filter(c => c !== type);
  delete blockData[type];

  renderControls();
  updateAllVisuals();
  updateInventoryCounts();
  updateCapacityPot();
}


// ─── CONTROLS RENDERING ─────────────────────────────────────────────

function getWoodOptionsHTML(selectedKey) {
    let html = ``;
    const groups = [...new Set(Object.values(WOOD_PALETTE).map(w => w.group))];
    groups.forEach(groupName => {
        html += `<optgroup label="${groupName}">`;
        for (const [key, wood] of Object.entries(WOOD_PALETTE)) {
            if (wood.group === groupName) {
                const isSel = key === selectedKey ? 'selected' : '';
                html += `<option value="${key}" ${isSel}>${wood.name}</option>`;
            }
        }
        html += `</optgroup>`;
    });
    return html;
}

function renderControls() {
  controlsArea.innerHTML = '';

  activeBlockCodes.forEach(type => {
    const data = blockData[type];

    const isActuallySolid = data.isSolid || data.zones.length === 1;

    const isCross = data.pattern === 'cross';
    const isDiag = data.pattern === 'diag_cross';
    const isNonStripePattern = isCross || isDiag;

    const hiddenStripesControls = (isActuallySolid || isNonStripePattern) ? 'hidden-control' : '';
    const hiddenCrossControls = (!isCross || isActuallySolid) ? 'hidden-control' : '';

    const canDelete = activeBlockCodes.length > 1;
    const div = document.createElement('div');
    div.className = 'block-control';

    //HEADER + Status
    let headerHtml = `
      <div class="block-header">
        <span>Block <span class="block-name">${type}</span></span>
        <span id="status-${type}" class="status-ok">0 / ${data.limit}</span>
      </div>
    `;

    // PREVIEW
    let previewHtml = `<div class="block-preview" id="preview-${type}"></div>`;

    // ZONES
    let zonesHtml = `<div class="zones-container">`;
    data.zones.forEach((zone, index) => {
        zonesHtml += `
            <div class="zone-row">
                <span class="zone-label">${index + 1}</span>
                <select data-action="zone-wood" data-type="${type}" data-index="${index}" class="wood-dropdown">
                    ${getWoodOptionsHTML(zone.wood)}
                </select>
                <input type="color" value="${zone.color}"
                       data-action="zone-color" data-type="${type}" data-index="${index}">
            </div>
        `;
    });
    zonesHtml += `</div>`;

    //ACTIONS zones + cycle
    const showCycle = !isActuallySolid && !isCross && !isDiag;
    let actionsHtml = `
        <div class="actions-row">
            <div>
                <button class="btn btn-sm" data-action="zone-add" data-type="${type}" title="Add Zone">+</button>
                <button class="btn btn-sm" data-action="zone-remove" data-type="${type}" title="Remove Zone" ${data.zones.length <= 1 ? 'disabled' : ''}>-</button>
            </div>
            ${showCycle ? `<button class="btn btn-sm" data-action="cycle-colors" data-type="${type}" title="Cycle Colors">Cycle ↻</button>` : `<span></span>`}
        </div>
    `;

    //TRANSFORM CONTROLS
    const hiddenTransformControls = isActuallySolid ? 'hidden-control' : '';

    let transformHtml = `
      <div class="settings-row ${hiddenTransformControls}">
        <div class="setting-group" style="width:100%">
          <span class="label-sm">Orientation</span>

          <div class="btn-row" style="margin-top:6px;">
            <button class="btn btn-sm" data-action="rotate" data-type="${type}" data-dir="left" title="Rotate 90° left">
              <span class="btn-icon">⟲</span> Rotate
            </button>
            <button class="btn btn-sm" data-action="rotate" data-type="${type}" data-dir="right" title="Rotate 90° right">
              <span class="btn-icon">⟳</span> Rotate
            </button>
            <button class="btn btn-sm" data-action="flip" data-type="${type}" data-axis="h" title="Flip left-right">
              <span class="btn-icon">↔</span> Flip
            </button>
            <button class="btn btn-sm" data-action="flip" data-type="${type}" data-axis="v" title="Flip top-bottom">
              <span class="btn-icon">↕</span> Flip
            </button>
          </div>

          <span class="label-sm">Copy Variants</span>
          <div class="btn-row-split" style="margin-top:8px;">
            <div class="btn-group">
              <button class="btn btn-sm btn-primary" data-action="duplicate-mirror" data-type="${type}" data-axis="h" title="Create mirrored copy (left-right)">
                <span class="btn-icon">↔</span> Copy Flip
              </button>
              <button class="btn btn-sm btn-primary" data-action="duplicate-mirror" data-type="${type}" data-axis="v" title="Create mirrored copy (top-bottom)">
                <span class="btn-icon">↕</span> Copy Flip
              </button>
            </div>

            <div class="btn-divider-vert"></div>

            <div class="btn-group">
              <button class="btn btn-sm" data-action="duplicate" data-type="${type}" title="Duplicate this block">
                <span class="btn-icon">⎘</span> Copy
              </button>
              ${canDelete ? `
                <button class="btn btn-sm btn-danger" data-action="delete" data-type="${type}" title="Delete this block">
                  <span class="btn-icon-delete">✕</span> Delete
                </button>
              ` : `
                <button class="btn btn-sm btn-danger" disabled style="opacity:0.4; cursor:not-allowed;">
                  <span class="btn-icon">✕</span> Delete
                </button>
              `}
            </div>
          </div>

        </div>
      </div>
    `;

    //PATTERN SELECTOR
    let patternHtml = `
        <div class="settings-row">
            <div class="setting-group" style="width:100%">
                <span class="label-sm">Pattern Type</span>
                <select data-action="pattern-type" data-type="${type}">
                    <option value="stripes" ${data.pattern === 'stripes' ? 'selected' : ''}>Stripes</option>
                    <option value="cross" ${data.pattern === 'cross' ? 'selected' : ''}>Cross Cut (4 regions)</option>
                    <option value="diag_cross" ${data.pattern === 'diag_cross' ? 'selected' : ''}>Diagonal Cross (4 triangles)</option>
                </select>
            </div>
        </div>
    `;

    //CROSS SETTINGS
    let crossHtml = `
        <div class="settings-row ${hiddenCrossControls}">
            <div class="setting-group">
                <span class="label-sm">
                    Vertical Split: <span id="cross-${type}-x">${data.cross?.x ?? 50}</span>%
                </span>
                <input type="range"
                    min="5" max="95" step="1"
                    value="${data.cross?.x ?? 50}"
                    data-action="cross-setting" data-type="${type}" data-axis="x">
            </div>
            <div class="setting-group">
                <span class="label-sm">
                    Horizontal Split: <span id="cross-${type}-y">${data.cross?.y ?? 50}</span>%
                </span>
                <input type="range"
                    min="5" max="95" step="1"
                    value="${data.cross?.y ?? 50}"
                    data-action="cross-setting" data-type="${type}" data-axis="y">
            </div>
        </div>
    `;

    //STRIPES SETTINGS
    let stripesSettingsHtml = `
        <div class="settings-row">
            <div class="setting-group ${hiddenStripesControls}">
                <span class="label-sm">Dividers</span>
                <select data-action="setting-density" data-type="${type}">
                  <option value="1" ${data.density === 1 ? 'selected' : ''}>1 Divider</option>
                  <option value="2" ${data.density === 2 ? 'selected' : ''}>2 Dividers</option>
                  <option value="3" ${data.density === 3 ? 'selected' : ''}>3 Dividers</option>
                  <option value="4" ${data.density === 4 ? 'selected' : ''}>4 Dividers</option>
                </select>
            </div>
            <div class="setting-group radial-wrapper ${hiddenStripesControls}">
                <span class="label-sm">Angle (${data.angle}°)</span>
                <div class="radial-dial" data-action="rotate-angle" data-type="${type}" title="Click to rotate 45°">
                    <div class="dial-pointer" style="transform: translate(-50%, -50%) rotate(${data.angle}deg);"></div>
                </div>
            </div>
        </div>
    `;

    const showStripeDividers = (!isActuallySolid && data.pattern === 'stripes' && data.zones.length > 1) ? '' : 'hidden-control';

    let stripeDividersHtml = `
      <div class="settings-row ${showStripeDividers}" style="flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="divider-section">
          <span class="label-sm">Divider Positions</span>

          ${(data.stripeDividers || []).map((pos, idx) => `
            <div style="display:flex; flex-direction:column; gap:4px;">
              <span class="label-sm" style="margin:0; font-weight:600;">
                Divider ${idx + 1}: <span id="stripe-${type}-d${idx}">${pos}</span>%
              </span>
              <input type="range"
                min="5" max="95" step="1"
                value="${pos}"
                data-action="stripe-divider" data-type="${type}" data-index="${idx}">
            </div>
          `).join('')}

          <div class="divider-actions">
            <button class="btn btn-sm btn-center" data-action="reset-dividers" data-type="${type}" title="Reset dividers to equal spacing">
              Center / Even
            </button>
          </div>
        </div>
      </div>
    `;

    //QUANTITY
    let qtyHtml = `
      <div class="settings-row allocated-qty">
        <div class="setting-group" style="width:100%">
          <span class="label-sm">Allocated Quantity</span>
          <input type="number"
            value="${data.limit}"
            data-action="setting-limit" data-type="${type}"
            min="0">
        </div>
      </div>
    `;

    let settingsHtml = `
      ${patternHtml}
      ${crossHtml}
      ${transformHtml}
      ${stripesSettingsHtml}
      ${stripeDividersHtml}
    `;

    div.innerHTML = `
      ${headerHtml}
      <div class="block-content">
        ${previewHtml}
        ${zonesHtml}
        ${actionsHtml}
        ${settingsHtml}
      </div>
      ${qtyHtml}
    `;
    controlsArea.appendChild(div);
    const preview = div.querySelector(`#preview-${type}`);
    if (preview) preview.style.cssText = getGradientStyle(type);
  });
}


// ─── HELPERS ─────────────────────────────────────────────────────────

function getGradientStyle(type) {
  const data = blockData[type];
  const isActuallySolid = data.isSolid || data.zones.length === 1;

  if (isActuallySolid) return `background: ${data.zones[0].color};`;

  // CROSS CUT
  if (data.pattern === 'cross') {
    const x = Math.max(5, Math.min(95, data.cross?.x ?? 50));
    const y = Math.max(5, Math.min(95, data.cross?.y ?? 50));

    const leftW = x;
    const rightW = 100 - x;
    const topH = y;
    const bottomH = 100 - y;

    const c0 = data.zones[0]?.color ?? '#fff';
    const c1 = data.zones[1]?.color ?? c0;
    const c2 = data.zones[2]?.color ?? c0;
    const c3 = data.zones[3]?.color ?? c0;

    return `
        background-image:
          linear-gradient(${c0}, ${c0}),
          linear-gradient(${c1}, ${c1}),
          linear-gradient(${c2}, ${c2}),
          linear-gradient(${c3}, ${c3});
        background-size:
          ${leftW}% ${topH}%,
          ${rightW}% ${topH}%,
          ${leftW}% ${bottomH}%,
          ${rightW}% ${bottomH}%;
        background-position:
          0% 0%,
          100% 0%,
          0% 100%,
          100% 100%;
        background-repeat: no-repeat;
    `.replace(/\s+/g, ' ').trim();
  }

  // DIAGONAL CROSS
  if (data.pattern === 'diag_cross') {
    const cTop = data.zones[0]?.color ?? '#fff';
    const cRight = data.zones[1]?.color ?? cTop;
    const cBottom = data.zones[2]?.color ?? cTop;
    const cLeft = data.zones[3]?.color ?? cTop;

    return `background: conic-gradient(from -45deg at 50% 50%,
      ${cTop} 0deg 90deg,
      ${cRight} 90deg 180deg,
      ${cBottom} 180deg 270deg,
      ${cLeft} 270deg 360deg
    );`.replace(/\s+/g, ' ').trim();
  }

  // STRIPES (divider logic)
  ensureStripeDividers(type);

  const dividers = clamp(parseInt(data.density, 10) || 1, 1, 4);
  const angle = data.angle ?? 0;
  const colors = data.zones.map(z => z.color);
  const numColors = colors.length;

  const cuts = [0, ...(data.stripeDividers || []), 100].slice(0, dividers + 2);

  let stops = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const start = cuts[i];
    const end = cuts[i + 1];
    const color = colors[i % numColors] ?? '#fff';
    stops.push(`${color} ${start}%`, `${color} ${end}%`);
  }

  return `background: linear-gradient(${angle}deg, ${stops.join(', ')});`;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function ensureStripeDividers(type) {
  const data = blockData[type];
  if (!data) return;

  let dividers = parseInt(data.density, 10) || 1;
  dividers = clamp(dividers, 1, 4);
  data.density = dividers;

  if (!Array.isArray(data.stripeDividers)) data.stripeDividers = [];

  if (data.stripeDividers.length !== dividers) {
    data.stripeDividers = [];
    for (let i = 1; i <= dividers; i++) {
      data.stripeDividers.push(Math.round((i * 100) / (dividers + 1)));
    }
  }

  data.stripeDividers = data.stripeDividers
    .map(p => clamp(parseInt(p, 10) || 50, 5, 95))
    .sort((a, b) => a - b);

  for (let i = 0; i < data.stripeDividers.length; i++) {
    const minVal = i === 0 ? 5 : data.stripeDividers[i - 1] + 1;
    const maxVal = i === data.stripeDividers.length - 1 ? 95 : data.stripeDividers[i + 1] - 1;
    data.stripeDividers[i] = clamp(data.stripeDividers[i], minVal, maxVal);
  }
}


function updateAllVisuals() {
  activeBlockCodes.forEach(type => {
    const preview = document.getElementById(`preview-${type}`);
    if (preview) preview.style.cssText = getGradientStyle(type);
  });

  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    const row = parseInt(input.dataset.row, 10);
    const col = parseInt(input.dataset.col, 10);
    const linearIndex = (row * config.cols) + col;
    handleGridInput(linearIndex, input.value);
  });

  renderBlockPalette();
}

function updateInventoryCounts() {
  activeBlockCodes.forEach(t => blockData[t].used = 0);
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    const code = input.value.toUpperCase();
    if (activeBlockCodes.includes(code)) blockData[code].used++;
  });
  activeBlockCodes.forEach(type => {
    const statusEl = document.getElementById(`status-${type}`);
    if(statusEl) {
      const data = blockData[type];
      statusEl.textContent = `${data.used} / ${data.limit}`;
      statusEl.className = data.used > data.limit ? 'status-over' : 'status-ok';
    }
  });
}

function renderBlockPalette() {
  if (!blockPalette) return;

  blockPalette.innerHTML = '';

  activeBlockCodes.forEach(code => {
    const item = document.createElement('div');
    item.className = 'palette-item';

    const letter = document.createElement('div');
    letter.className = 'palette-letter';
    letter.textContent = code;

    const swatch = document.createElement('div');
    swatch.className = 'palette-swatch';
    swatch.style = getGradientStyle(code);

    item.appendChild(letter);
    item.appendChild(swatch);
    blockPalette.appendChild(item);
  });
}

init();