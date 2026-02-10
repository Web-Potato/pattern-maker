import { 
  WOOD_PALETTE, 
  PROJECT_SCHEMA_VERSION, 
  USER_PRESETS_KEY 
} from './constants.js';

import { 
  clamp, 
  downloadJSON, 
  readFileAsText, 
  getGradientStyleForBlock, 
  normaliseStripeDividers 
} from './utils.js';

// STATE
let config = { cols: 8, rows: 6 };
let activeBlockCodes = ['A', 'B'];
const blockData = {};

// DOM ELEMENTS
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

// INIT
function init() {
  activeBlockCodes = ['A', 'B', 'C'];
  initializeBlockData('A', { preset: 'stripes_demo' });
  initializeBlockData('B', { preset: 'cross_demo' });
  initializeBlockData('C', { preset: 'diag_demo' });

  setupDelegation();
  setupProjectIO();
  loadPresets();
  renderUserPresets();

  //restore Gridlines
  const saved = JSON.parse(localStorage.getItem('gridlines') || '{}');
  if (saved.thickness && gridThickness) gridThickness.value = saved.thickness;
  if (saved.mode && gridMode) gridMode.value = saved.mode;
  setGridlines(!!saved.on);
  updateGridlines();

  renderControls();
  updateGridSize();
  updateCapacityPot();
  setupPresetTabs();
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

  //apply presets
  if (opts.preset === 'stripes_demo') {
  //defaults already set above
  } else if (opts.preset === 'cross_demo') {
    blockData[code].pattern = 'cross';
    blockData[code].zones.push(
      { wood: 'cherry', color: WOOD_PALETTE.cherry.color },
      { wood: 'sapele', color: WOOD_PALETTE.sapele.color }
    );
  } else if (opts.preset === 'diag_demo') {
    blockData[code].pattern = 'diag_cross';
    blockData[code].zones.push(
      { wood: 'cherry', color: WOOD_PALETTE.cherry.color },
      { wood: 'sapele', color: WOOD_PALETTE.sapele.color }
    );
  } else if (opts.preset === 'solid_new') {
    blockData[code].zones = [{ wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color }];
  }
}

//CORE FUNCTIONS

function updateAllVisuals() {
  // update block previews
  activeBlockCodes.forEach(type => {
    const preview = document.getElementById(`preview-${type}`);
    if (preview) preview.style.cssText = getGradientStyleForBlock(blockData[type]);
  });

  //update grid cells
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    const row = parseInt(input.dataset.row, 10);
    const col = parseInt(input.dataset.col, 10);
    const linearIndex = (row * config.cols) + col;
    handleGridInput(linearIndex, input.value);
  });

  renderBlockPalette();
}

function ensureStripeDividers(type) {
  const data = blockData[type];
  if (!data) return;
  const result = normaliseStripeDividers(data);
  data.density = result.density;
  data.stripeDividers = result.stripeDividers;
}

// EVENT HANDLERS
const blockActions = {
  'rotate-angle': (type) => {
    let current = blockData[type].angle;
    current = ((current + 45) % 360 + 360) % 360;
    blockData[type].angle = current;
    renderControls();
    updateAllVisuals();
  },
  'zone-add': (type) => {
    blockData[type].zones.push({ wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color });
    if (blockData[type].pattern === 'stripes') {
      const needed = Math.min(4, blockData[type].zones.length - 1);
      if((blockData[type].density||1) < needed) blockData[type].density = needed;
      ensureStripeDividers(type);
    }
    renderControls();
    updateAllVisuals();
  },
  'zone-remove': (type) => {
    if (blockData[type].zones.length > 1) {
      blockData[type].zones.pop();
      renderControls();
      updateAllVisuals();
    }
  },
  'cycle-colors': (type) => {
    const last = blockData[type].zones.pop();
    blockData[type].zones.unshift(last);
    renderControls();
    updateAllVisuals();
  },
  'rotate': (type, d) => rotateBlockDef(type, d.dir),
  'flip': (type, d) => flipBlockDef(type, d.axis),
  'duplicate': (type) => duplicateBlockType(type),
  'duplicate-mirror': (type, d) => duplicateMirroredBlock(type, d.axis),
  'delete': (type) => deleteBlockType(type),
  'reset-dividers': (type) => {
    const data = blockData[type];
    if (!data || data.pattern !== 'stripes') return;
    data.stripeDividers = []; 
    ensureStripeDividers(type);
    renderControls();
    updateAllVisuals();
  }
};

const blockChangeActions = {
  'zone-wood': (type, d, el) => {
    blockData[type].zones[d.index].wood = el.value;
    blockData[type].zones[d.index].color = WOOD_PALETTE[el.value].color;
    const picker = el.parentElement.querySelector('input[type="color"]');
    if(picker) picker.value = WOOD_PALETTE[el.value].color;
    updateAllVisuals();
  },
  'zone-color': (type, d, el) => {
    blockData[type].zones[d.index].color = el.value;
    blockData[type].zones[d.index].wood = 'custom';
    const select = el.parentElement.querySelector('select.wood-dropdown');
    if(select) select.value = 'custom';
    updateAllVisuals();
  },
  'pattern-type': (type, d, el) => {
    blockData[type].pattern = el.value;
    if (!blockData[type].cross) blockData[type].cross = { x: 50, y: 50 };
    if (el.value.includes('cross')) {
      while (blockData[type].zones.length < 4) {
        const last = blockData[type].zones[blockData[type].zones.length - 1];
        blockData[type].zones.push({ ...last });
      }
    }
    renderControls();
    updateAllVisuals();
  },
  'stripe-divider': (type, d, el) => {
    ensureStripeDividers(type);
    const idx = parseInt(d.index);
    let v = parseInt(el.value, 10);

    const data = blockData[type];
    const lower = idx === 0 ? 5 : data.stripeDividers[idx - 1] + 1;
    const upper = idx === data.stripeDividers.length - 1 ? 95 : data.stripeDividers[idx + 1] - 1;
    v = clamp(v, lower, upper);
    data.stripeDividers[idx] = v;
    const readout = document.getElementById(`stripe-${type}-d${idx}`);
    if(readout) readout.textContent = v;
    updateAllVisuals();
  },
  'cross-setting': (type, d, el) => {
    let v = clamp(parseInt(el.value) || 50, 5, 95);
    if(!blockData[type].cross) blockData[type].cross = {x:50,y:50};
    blockData[type].cross[d.axis] = v;
    const readout = document.getElementById(`cross-${type}-${d.axis}`);
    if(readout) readout.textContent = v;
    updateAllVisuals();
  },
  'setting-density': (type, d, el) => {
    blockData[type].density = clamp(parseInt(el.value)||1, 1, 4);
    if(blockData[type].pattern === 'stripes') ensureStripeDividers(type);
    renderControls();
    updateAllVisuals();
  },
  'setting-limit': (type, d, el) => {
    blockData[type].limit = parseInt(el.value) || 0;
    updateInventoryCounts();
    updateCapacityPot();
  }
};

function setupDelegation() {
  controlsArea.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action]');
    if (!trigger) return;
    const { action, type, ...rest } = trigger.dataset;
    if (blockActions[action]) blockActions[action](type, rest);
  });

  controlsArea.addEventListener('input', handleControlChange);
  controlsArea.addEventListener('change', handleControlChange);

  //copy dropdowns in input grid
  inputGrid.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.classList.contains('copy-select')) return;
    const { copyTarget, copyType } = el.dataset;
    const targetIdx = parseInt(copyTarget);
    const sourceIdx = parseInt(el.value);
    if (copyType === 'row') copyRowPattern(targetIdx, sourceIdx);
    else if (copyType === 'col') copyColPattern(targetIdx, sourceIdx);
    el.value = '';
  });

  //global buttons
  clearPatternBtn.addEventListener('click', clearGrid);
  applySizeBtn.addEventListener('click', updateGridSize);
  addBlockBtn.addEventListener('click', addNewBlockType);

  if (gridToggleBtn) {
    gridToggleBtn.addEventListener('click', () => {
      const isOn = gridToggleBtn.dataset.on === 'true';
      setGridlines(!isOn);
    });
  }
  if(gridThickness) gridThickness.addEventListener('change', updateGridlines);
  if(gridMode) gridMode.addEventListener('change', updateGridlines);
}

function handleControlChange(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, type, ...rest } = el.dataset;
  if (blockChangeActions[action]) blockChangeActions[action](type, rest, el);
}

// GRID LOGIC

function updateGridSize() {
  config.cols = clamp(parseInt(colsInput.value), 2, 20);
  config.rows = clamp(parseInt(rowsInput.value), 2, 20);
  const cellRatio = (4 * config.rows) / (3 * config.cols);
  document.documentElement.style.setProperty('--cell-ratio', cellRatio);
  createGrids();
  updateAllVisuals();
  updateCapacityPot();
}

function createGrids() {
  document.documentElement.style.setProperty('--grid-cols', config.cols);
  document.documentElement.style.setProperty('--grid-rows', config.rows);
  visualGrid.innerHTML = '';
  inputGrid.innerHTML = '';
    
  //create visual cells
  for (let i = 0; i < config.cols * config.rows; i++) {
    const vCell = document.createElement('div');
    vCell.className = 'visual-cell';
    vCell.id = `v-cell-${i}`;
    visualGrid.appendChild(vCell);
  }

  //create input headers
  const corner = document.createElement('div');
  corner.className = 'grid-header-cell';
  inputGrid.appendChild(corner);

  //columns
  for (let c = 0; c < config.cols; c++) {
    const colHeader = document.createElement('div');
    colHeader.className = 'grid-header-cell';
    let optionHTML = `<option value="" disabled selected>${String.fromCharCode(65 + c)}</option>`;
    if(config.cols > 1) {
      optionHTML += `<optgroup label="Copy From...">`;
      for(let cc=0; cc<config.cols; cc++) {
        if(cc!==c) optionHTML += `<option value="${cc}">Col ${String.fromCharCode(65+cc)}</option>`;
      }
      optionHTML += `</optgroup>`;
    }
    colHeader.innerHTML = `<div class="row-header-content">
      <span class="row-label-text">${String.fromCharCode(65 + c)}</span>
      <span class="copy-icon">▼</span>
      <select class="copy-select" data-copy-type="col" data-copy-target="${c}">${optionHTML}</select>
    </div>`;
    inputGrid.appendChild(colHeader);
  }

    //rows and inputs
  for (let r = 0; r < config.rows; r++) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'grid-header-cell';
    let optionHTML = `<option value="" disabled selected>${r + 1}</option>`;
    if(config.rows > 1) {
      optionHTML += `<optgroup label="Copy From...">`;
      for(let rr=0; rr<config.rows; rr++) {
        if(rr!==r) optionHTML += `<option value="${rr}">Row ${rr+1}</option>`;
      }
      optionHTML += `</optgroup>`;
    }
    rowHeader.innerHTML = `<div class="row-header-content">
      <span class="row-label-text">${r + 1}</span>
      <span class="copy-icon">▼</span>
      <select class="copy-select" data-copy-type="row" data-copy-target="${r}">${optionHTML}</select>
    </div>`;
    inputGrid.appendChild(rowHeader);

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
        const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
        if (allowed.includes(k) || e.ctrlKey || e.metaKey) return;
        if (!/^[a-zA-Z]$/.test(k)) e.preventDefault();
      });
      iCell.addEventListener('input', (e) => {
        const v = (e.target.value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
        e.target.value = v;
        handleGridInput(index, v);
        updateInventoryCounts();
      });
      inputGrid.appendChild(iCell);
    }
  }
}

function handleGridInput(index, value) {
  const vCell = document.getElementById(`v-cell-${index}`);
  const code = (value || '').toUpperCase();
  if (activeBlockCodes.includes(code)) {
    vCell.style.cssText = getGradientStyleForBlock(blockData[code]);
  } else {
    vCell.style.cssText = 'background-color: #fff;';
  }
}

function clearGrid() {
  document.querySelectorAll('.input-cell').forEach(input => {
    input.value = '';
    handleGridInput(parseInt(input.id.replace('i-cell-',''), 10), '');
  });
  updateInventoryCounts();
}

function copyRowPattern(targetRow, sourceRow) {
  for (let c = 0; c < config.cols; c++) {
    const srcId = `i-cell-${(sourceRow * config.cols) + c}`;
    const tgtId = `i-cell-${(targetRow * config.cols) + c}`;
    const val = document.getElementById(srcId).value;
    const tgt = document.getElementById(tgtId);
    tgt.value = val;
    handleGridInput((targetRow * config.cols) + c, val);
  }
  updateInventoryCounts();
}

function copyColPattern(targetCol, sourceCol) {
  for (let r = 0; r < config.rows; r++) {
    const srcId = `i-cell-${(r * config.cols) + sourceCol}`;
    const tgtId = `i-cell-${(r * config.cols) + targetCol}`;
    const val = document.getElementById(srcId).value;
    const tgt = document.getElementById(tgtId);
    tgt.value = val;
    handleGridInput((r * config.cols) + targetCol, val);
  }
  updateInventoryCounts();
}

// BLOCK & INVENTORY LOGIC

function updateInventoryCounts() {
  activeBlockCodes.forEach(t => blockData[t].used = 0);
  document.querySelectorAll('.input-cell').forEach(input => {
    const code = input.value.toUpperCase();
    if (activeBlockCodes.includes(code)) blockData[code].used++;
  });
  activeBlockCodes.forEach(type => {
    const statusEl = document.getElementById(`status-${type}`);
    if(statusEl) {
      const d = blockData[type];
      statusEl.textContent = `${d.used} / ${d.limit}`;
      statusEl.className = d.used > d.limit ? 'status-over' : 'status-ok';
    }
  });
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

function addNewBlockType() {
  let nextChar = null;
  for (let code = 65; code <= 90; code++) {
    const candidate = String.fromCharCode(code);
    if (!activeBlockCodes.includes(candidate)) { nextChar = candidate; break; }
  }
  if (!nextChar) return;
  
  activeBlockCodes.push(nextChar);
  initializeBlockData(nextChar, { preset: 'solid_new' });
  renderControls();
  updateAllVisuals();
  updateCapacityPot();
}

function deleteBlockType(type) {
  if (activeBlockCodes.length <= 1) {
    alert("You must have at least one block type.");
    return;
  }
  if (!confirm(`Delete Block ${type}? This will clear it from the grid.`)) return;
  
  document.querySelectorAll('.input-cell').forEach(input => {
    if (input.value.toUpperCase() === type) {
      input.value = '';
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      handleGridInput((row * config.cols) + col, '');
    }
  });
  
  activeBlockCodes = activeBlockCodes.filter(c => c !== type);
  delete blockData[type];
  renderControls();
  updateInventoryCounts();
  updateCapacityPot();
  updateAllVisuals();
}

// TRANSFORMATIONS (Flip/Rotate)

function rotateBlockDef(type, dir) {
  const data = blockData[type];
  if (data.pattern === 'cross') {
    const z = data.zones;
    if (dir === 'right') {
      data.zones = [z[2], z[0], z[3], z[1]];
      data.cross = { x: 100 - (data.cross.y||50), y: (data.cross.x||50) };
    } else {
      data.zones = [z[1], z[3], z[0], z[2]];
      data.cross = { x: (data.cross.y||50), y: 100 - (data.cross.x||50) };
    }
  } else if (data.pattern === 'diag_cross') {
    const z = data.zones;
    if (dir === 'right') data.zones = [z[3], z[0], z[1], z[2]];
    else data.zones = [z[1], z[2], z[3], z[0]];
  } else {
    const delta = (dir === 'right') ? 90 : -90;
    data.angle = ((data.angle + delta) % 360 + 360) % 360;
  }
  renderControls();
  updateAllVisuals();
}

function flipBlockDef(type, axis) {
  const data = blockData[type];
  if (data.pattern === 'cross') {
    const z = data.zones;
    const x = data.cross?.x ?? 50; 
    const y = data.cross?.y ?? 50;
    if (axis === 'h') {
      data.zones = [z[1], z[0], z[3], z[2]];
      data.cross.x = 100 - x;
    } else {
      data.zones = [z[2], z[3], z[0], z[1]];
      data.cross.y = 100 - y;
    }
  } else if (data.pattern === 'diag_cross') {
    const z = data.zones;
    if (axis === 'h') data.zones = [z[0], z[3], z[2], z[1]];
    else data.zones = [z[2], z[1], z[0], z[3]];
  } else {
    let a = data.angle ?? 0;
    if (axis === 'h') a = (360 - a) % 360;
    else a = (180 - a) % 360;
    data.angle = a;
  }
  renderControls();
  updateAllVisuals();
}

function duplicateBlockType(sourceType) {
  let nextChar = null;
  for (let c = 65; c <= 90; c++) {
    if (!activeBlockCodes.includes(String.fromCharCode(c))) { nextChar = String.fromCharCode(c); break; }
  }
  if(!nextChar) { alert("No block letters available."); return; }
  
  blockData[nextChar] = JSON.parse(JSON.stringify(blockData[sourceType]));
  blockData[nextChar].used = 0;
  
  // insert after source
  const idx = activeBlockCodes.indexOf(sourceType);
  activeBlockCodes.splice(idx + 1, 0, nextChar);
  
  renderControls();
  updateAllVisuals();
  updateCapacityPot();
}

function duplicateMirroredBlock(sourceType, axis) {
  duplicateBlockType(sourceType);
  const idx = activeBlockCodes.indexOf(sourceType);
  const newType = activeBlockCodes[idx + 1];
  flipBlockDef(newType, axis);
}

// RENDER CONTROLS (HTML Gen)

function getWoodOptionsHTML(selectedKey) {
  let html = ``;
  const groups = [...new Set(Object.values(WOOD_PALETTE).map(w => w.group))];
  groups.forEach(groupName => {
    html += `<optgroup label="${groupName}">`;
    for (const [key, wood] of Object.entries(WOOD_PALETTE)) {
      if (wood.group === groupName) {
        html += `<option value="${key}" ${key === selectedKey ? 'selected' : ''}>${wood.name}</option>`;
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
    const isSolid = data.isSolid || data.zones.length === 1;
    const isCross = data.pattern === 'cross';
    const isDiag = data.pattern === 'diag_cross';
    
    const div = document.createElement('div');
    div.className = 'block-control';

    //wood options
    const woodRows = data.zones.map((zone, idx) => `
        <div class="zone-row">
            <span class="zone-label">${idx + 1}</span>
            <select data-action="zone-wood" data-type="${type}" data-index="${idx}" class="wood-dropdown">
                ${getWoodOptionsHTML(zone.wood)}
            </select>
            <input type="color" value="${zone.color}" data-action="zone-color" data-type="${type}" data-index="${idx}">
        </div>
    `).join('');

      //divider sliders
    const dividersHTML = (data.stripeDividers || []).map((pos, idx) => `
        <div style="display:flex; flex-direction:column; gap:4px;">
            <span class="label-sm" style="margin:0; font-weight:600;">Divider ${idx+1}: <span id="stripe-${type}-d${idx}">${pos}</span>%</span>
            <input type="range" min="5" max="95" step="1" value="${pos}" data-action="stripe-divider" data-type="${type}" data-index="${idx}">
        </div>
    `).join('');

    div.innerHTML = `
        <div class="block-header">
            <span>Block <span class="block-name">${type}</span></span>
            <span id="status-${type}" class="status-ok">0 / ${data.limit}</span>
        </div>
        <div class="block-content">
            <div class="block-preview" id="preview-${type}"></div>
            <div class="zones-container">${woodRows}</div>
            <div class="actions-row">
                <div>
                    <button class="btn btn-sm" data-action="zone-add" data-type="${type}" title="Add Zone">+</button>
                    <button class="btn btn-sm" data-action="zone-remove" data-type="${type}" title="Remove Zone" ${data.zones.length <= 1 ? 'disabled' : ''}>-</button>
                </div>
                ${ (!isSolid && !isCross && !isDiag) ? `<button class="btn btn-sm" data-action="cycle-colors" data-type="${type}">Cycle ↻</button>` : '<span></span>'}
            </div>
            
            <!-- Pattern Type -->
            <div class="settings-row">
                <div class="setting-group" style="width:100%">
                    <span class="label-sm">Pattern Type</span>
                    <select data-action="pattern-type" data-type="${type}">
                        <option value="stripes" ${data.pattern==='stripes'?'selected':''}>Stripes / Block (single color)</option>
                        <option value="cross" ${data.pattern==='cross'?'selected':''}>Cross Cut (4 regions)</option>
                        <option value="diag_cross" ${data.pattern==='diag_cross'?'selected':''}>Diagonal Cross</option>
                    </select>
                </div>
            </div>

            <!-- Cross Settings -->
            <div class="settings-row ${(!isCross || isSolid) ? 'hidden-control' : ''}">
                  <div class="setting-group">
                    <span class="label-sm">V-Split: <span id="cross-${type}-x">${data.cross?.x||50}</span>%</span>
                    <input type="range" min="5" max="95" step="1" value="${data.cross?.x||50}" data-action="cross-setting" data-type="${type}" data-axis="x">
                </div>
                <div class="setting-group">
                    <span class="label-sm">H-Split: <span id="cross-${type}-y">${data.cross?.y||50}</span>%</span>
                    <input type="range" min="5" max="95" step="1" value="${data.cross?.y||50}" data-action="cross-setting" data-type="${type}" data-axis="y">
                </div>
            </div>

            <!-- Stripe Settings -->
            <div class="settings-row ${(isSolid || isCross || isDiag) ? 'hidden-control' : ''}">
                <div class="setting-group">
                    <span class="label-sm">Dividers</span>
                    <select data-action="setting-density" data-type="${type}">
                        <option value="1" ${data.density===1?'selected':''}>1 Divider</option>
                        <option value="2" ${data.density===2?'selected':''}>2 Dividers</option>
                        <option value="3" ${data.density===3?'selected':''}>3 Dividers</option>
                        <option value="4" ${data.density===4?'selected':''}>4 Dividers</option>
                    </select>
                </div>
                <div class="setting-group radial-wrapper">
                    <span class="label-sm">Angle (${data.angle||0}°)</span>
                    <div class="radial-dial" data-action="rotate-angle" data-type="${type}" title="Click to rotate 45°">
                        <div class="dial-pointer" style="transform: translate(-50%, -50%) rotate(${data.angle||0}deg);"></div>
                    </div>
                </div>
            </div>
            
            <div class="settings-row ${(!isSolid && data.pattern === 'stripes' && data.zones.length > 1) ? '' : 'hidden-control'}">
                <div class="divider-section" style="width:100%">
                    ${dividersHTML}
                    <div class="divider-actions" style="margin-top:5px;">
                        <button class="btn btn-sm btn-center" data-action="reset-dividers" data-type="${type}">Center / Even</button>
                    </div>
                </div>
            </div>

            <!-- Transforms -->
            <div class="settings-row ${isSolid ? 'hidden-control' : ''}">
                <div class="setting-group" style="width:100%">
                    <span class="label-sm">Orientation</span>
                    <div class="btn-row">
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
                            <button class="btn btn-sm btn-danger" data-action="delete" data-type="${type}" title="Delete this block" ${activeBlockCodes.length<=1?'disabled':''}>
                                <span class="btn-icon-delete">✕</span> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="allocated-qty">
              <div class="setting-group" style="width:100%">
                <span class="label-sm">Allocated Quantity</span>
                <input type="number" value="${data.limit}" data-action="setting-limit" data-type="${type}" min="0">
              </div>
        </div>
    `;
    controlsArea.appendChild(div);
    
    //render preview
    const pObj = document.getElementById(`preview-${type}`);
    if(pObj) pObj.style.cssText = getGradientStyleForBlock(data);
  });
}

function renderBlockPalette() {
  if (!blockPalette) return;
  blockPalette.innerHTML = '';
  activeBlockCodes.forEach(code => {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.innerHTML = `<div class="palette-letter">${code}</div><div class="palette-swatch" style="${getGradientStyleForBlock(blockData[code])}"></div>`;
    blockPalette.appendChild(item);
  });
}

// PROJECT IO (Save/Load)

function serialiseProject() {
  const total = config.cols * config.rows;
  const grid = new Array(total);
  document.querySelectorAll('.input-cell').forEach((input, i) => {
    grid[i] = (input.value || '').toUpperCase().slice(0, 1);
  });
  
  //clean block data for export
  const exportData = {};
  activeBlockCodes.forEach(code => {
      const b = blockData[code];
      exportData[code] = {
        pattern: b.pattern,
        stripeDividers: b.stripeDividers,
        density: b.density,
        angle: b.angle,
        limit: b.limit,
        cross: b.cross,
        zones: b.zones.map(z => ({ wood: z.wood, color: z.color }))
      };
  });

  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: "Untitled Project",
    board: { cols: config.cols, rows: config.rows, grid },
    blocks: { active: [...activeBlockCodes], data: exportData }
  };
}

function setupProjectIO() {
  if (exportProjectBtn) {
    exportProjectBtn.addEventListener('click', () => {
      const project = serialiseProject();
      const name = prompt('Project name?', project.name || 'Untitled Project');
      if (name) project.name = name;

      const filename = (project.name || 'cutting-board-project')
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
        loadProject(JSON.parse(text));
      } catch (err) {
        console.error(err);
        alert('Invalid JSON file.');
      }
    });
  }
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => {
      const project = serialiseProject();
      const name = prompt('Preset name?', 'My Preset');
      if (!name) return;
      project.name = name;
      const presets = getUserPresets();
      presets.unshift({ id: Date.now(), name, project });
      localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(presets));
      renderUserPresets();
    });
  }
  if (clearSavedPresetsBtn) {
    clearSavedPresetsBtn.addEventListener('click', () => {
      if(confirm('Clear all saved presets?')) {
        localStorage.setItem(USER_PRESETS_KEY, '[]');
        renderUserPresets();
      }
    });
  }
}

function loadProject(project) {
  if (!project || project.schemaVersion !== PROJECT_SCHEMA_VERSION) {
    alert('Unsupported project format.');
    return;
  }
  config.cols = project.board.cols;
  config.rows = project.board.rows;
  rowsInput.value = config.rows;
  colsInput.value = config.cols;

  const cellRatio = (4 * config.rows) / (3 * config.cols);
  document.documentElement.style.setProperty('--cell-ratio', cellRatio);
  
  activeBlockCodes = [...project.blocks.active];
  for (const k of Object.keys(blockData)) delete blockData[k];
  
  //rehydrate blocks
  activeBlockCodes.forEach(code => {
    const b = project.blocks.data[code];
    blockData[code] = {
      ...b,
      used: 0,
      isSolid: false,
      stripeDividers: b.stripeDividers || [50],
      cross: b.cross || {x:50, y:50}
    };
    ensureStripeDividers(code);
  });

  createGrids();
  renderControls();

  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach((input, i) => {
    const v = (project.board.grid[i] || '').toUpperCase();
    input.value = v;
    handleGridInput(i, v);
  });
  
  updateAllVisuals();
  updateInventoryCounts();
  updateCapacityPot();
}

function setupPresetTabs() {
  const tabs = document.querySelectorAll('.preset-tab');
  const panels = document.querySelectorAll('.preset-tab-panel');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('active', t === btn));
      panels.forEach(p => p.classList.toggle('hidden', p.dataset.panel !== btn.dataset.tab));
    });
  });
}

function renderPresetThumbnail(project) {
  const cols = project?.board?.cols ?? 1;
  const rows = project?.board?.rows ?? 1;
  const grid = project?.board?.grid ?? [];
  const blocks = project?.blocks?.data ?? {};
  
  const wrap = document.createElement('div');
  wrap.style.cssText = `display:grid; grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr); width: 100%; aspect-ratio: 4 / 3; border: 1px solid #333;`;
  
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

function renderUserPresets() {
  if (!presetListUser) return;
  const presets = getUserPresets();
  presetListUser.innerHTML = presets.length ? '' : 'No saved presets.';
  presets.forEach(p => {
    const card = document.createElement('div');
    card.className = 'preset-card';
    card.appendChild(renderPresetThumbnail(p.project));
    card.addEventListener('click', () => loadProject(p.project));
    presetListUser.appendChild(card);
  });
}

function getUserPresets() {
  try { return JSON.parse(localStorage.getItem(USER_PRESETS_KEY) || '[]'); } 
  catch { return []; }
}

async function loadPresets() {
  if (!presetListDemo) return;
  try {
    const res = await fetch('./presets.json');
    if(!res.ok) throw new Error();
    const data = await res.json();
    presetListDemo.innerHTML = '';
    data.presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.appendChild(renderPresetThumbnail(p.project));
      card.addEventListener('click', () => loadProject(p.project));
      presetListDemo.appendChild(card);
    });
  } catch (e) {
    presetListDemo.textContent = 'No demo presets found.';
  }
}


function setGridlines(on) {
  visualGrid.classList.toggle('show-gridlines', on);
  gridToggleBtn.dataset.on = on;
  gridToggleBtn.textContent = on ? 'Hide Grid' : 'Show Grid';
  gridToggleBtn.classList.toggle('btn-active', on);
  localStorage.setItem('gridlines', JSON.stringify({ 
    on, 
    thickness: gridThickness.value, 
    mode: gridMode.value 
  }));
}

function updateGridlines() {
  document.documentElement.style.setProperty('--gridline-thickness', gridThickness.value + 'px');
  visualGrid.classList.toggle('gridlines-invert', gridMode.value === 'invert');
  //save state
  const saved = JSON.parse(localStorage.getItem('gridlines')||'{}');
  saved.thickness = gridThickness.value;
  saved.mode = gridMode.value;
  localStorage.setItem('gridlines', JSON.stringify(saved));
}

init();