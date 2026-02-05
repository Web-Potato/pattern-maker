/**
 * CUTTING BOARD DESIGNER v9
 */

const WOOD_PALETTE = {
    "custom": { name: "Custom Color", color: "#ffffff", group: "Basic" },
    "maple_hard": { name: "Maple (Hard)", color: "#F2DCB3", group: "Domestic" },
    "walnut_black": { name: "Walnut (Dark)", color: "#5D4037", group: "Domestic" },
    "walnut_sap": { name: "Walnut (Sapwood)", color: "#A68B6C", group: "Domestic" },
    "cherry": { name: "Cherry", color: "#A65E44", group: "Domestic" },
    "oak_white": { name: "Oak (White)", color: "#C2B280", group: "Domestic" },
    "oak_red": { name: "Oak (Red)", color: "#D6AD85", group: "Domestic" },
    "ash": { name: "Ash", color: "#E0D3AF", group: "Domestic" },
    "hickory": { name: "Hickory", color: "#BAA084", group: "Domestic" },
    "beech": { name: "Beech", color: "#E2CBA6", group: "Domestic" },
    "birch": { name: "Birch", color: "#F7E6D0", group: "Domestic" },

    // IMPORTED & EXOTIC
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

// --- INITIALIZATION ---

function init() {
    // Reset in case (handy during dev refreshes)
    activeBlockCodes = ['A', 'B', 'C'];

    initializeBlockData('A', { preset: 'stripes_demo' });
    initializeBlockData('B', { preset: 'cross_demo' });
    initializeBlockData('C', { preset: 'diag_demo' });

    applySizeBtn.addEventListener('click', updateGridSize);
    addBlockBtn.addEventListener('click', addNewBlockType);

    renderControls();
    updateGridSize();
}

function initializeBlockData(code, opts = {}) {
    // Base defaults
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

    // Presets (for onboarding)
    if (opts.preset === 'stripes_demo') {
        blockData[code].pattern = 'stripes';
        blockData[code].density = 1;   // 1 divider => 2 stripes
        blockData[code].angle = 0;     // vertical stripes (use 90 if you prefer horizontal)
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

    // New-block preset: single-zone "solid"
    if (opts.preset === 'solid_new') {
        blockData[code].pattern = 'stripes';
        blockData[code].density = 1;
        blockData[code].angle = 0;
        blockData[code].zones = [
            { wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color }
        ];
    }
}

// --- GRID LOGIC ---

function updateGridSize() {
    let newCols = parseInt(colsInput.value);
    let newRows = parseInt(rowsInput.value);
    
    if(newCols < 2) newCols = 2; if(newCols > 20) newCols = 20;
    if(newRows < 2) newRows = 2; if(newRows > 20) newRows = 20;

    config.cols = newCols;
    config.rows = newRows;

    // Calculate Ratio for Cells
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

    const totalCells = config.cols * config.rows;

    // --- 1. VISUAL GRID (Standard) ---
    for (let i = 0; i < totalCells; i++) {
        const vCell = document.createElement('div');
        vCell.className = 'visual-cell';
        vCell.id = `v-cell-${i}`;
        visualGrid.appendChild(vCell);
    }

    // --- 2. INPUT GRID (With Headers) ---
    
    // Top Left Corner (Empty)
    const corner = document.createElement('div');
    corner.className = 'grid-header-cell';
    inputGrid.appendChild(corner);

  // Column Headers (A, B, C...) + Copy Dropdown
    for (let c = 0; c < config.cols; c++) {
      const colHeader = document.createElement('div');
      colHeader.className = 'grid-header-cell';

      // Build dropdown options (copy from any column except itself)
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
              <select class="copy-select" onchange="copyColPattern(${c}, this.value); this.value='';">
                  ${optionHTML}
              </select>
          </div>
      `;

      inputGrid.appendChild(colHeader);
    }

    // Rows (Number Header + Inputs)
    for (let r = 0; r < config.rows; r++) {
        // Row Header
        const rowHeader = document.createElement('div');
        rowHeader.className = 'grid-header-cell';
        
        // --- Copy Logic Dropdown ---
        // We create a hidden select that covers the cell.
        let optionHTML = `<option value="" disabled selected>${r + 1}</option>`;
        
        // Add options to copy from previous rows? Or any row? 
        // Let's allow copying from any row except itself.
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
                <select class="copy-select" onchange="copyRowPattern(${r}, this.value); this.value='';">
                    ${optionHTML}
                </select>
            </div>
        `;
        
        inputGrid.appendChild(rowHeader);

        // Input Cells for this row
        for (let c = 0; c < config.cols; c++) {
            const index = (r * config.cols) + c;
            const iCell = document.createElement('input');
            iCell.type = 'text';
            iCell.className = 'input-cell';
            iCell.id = `i-cell-${index}`;
            iCell.dataset.row = r; // Store row for logic
            iCell.dataset.col = c;
            iCell.maxLength = 1;
            iCell.addEventListener('input', (e) => handleGridInput(index, e.target.value));
            inputGrid.appendChild(iCell);
        }
    }
}

// --- COPY ROW LOGIC ---
window.copyRowPattern = function(targetRowIdx, sourceRowIdx) {
    sourceRowIdx = parseInt(sourceRowIdx);
    
    for (let c = 0; c < config.cols; c++) {
        // Find Source ID
        const sourceCellId = `i-cell-${(sourceRowIdx * config.cols) + c}`;
        const targetCellId = `i-cell-${(targetRowIdx * config.cols) + c}`;
        
        const sourceVal = document.getElementById(sourceCellId).value;
        const targetInput = document.getElementById(targetCellId);
        
        targetInput.value = sourceVal;
        
        // Trigger visual update for this specific cell
        handleGridInput((targetRowIdx * config.cols) + c, sourceVal);
    }
    updateCapacityPot();
}

// --- COPY COLUMN LOGIC ---
window.copyColPattern = function(targetColIdx, sourceColIdx) {
    sourceColIdx = parseInt(sourceColIdx);

    for (let r = 0; r < config.rows; r++) {
        const sourceCellId = `i-cell-${(r * config.cols) + sourceColIdx}`;
        const targetCellId = `i-cell-${(r * config.cols) + targetColIdx}`;

        const sourceVal = document.getElementById(sourceCellId).value;
        const targetInput = document.getElementById(targetCellId);

        targetInput.value = sourceVal;

        // Trigger visual update for this specific cell
        handleGridInput((r * config.cols) + targetColIdx, sourceVal);
    }
    updateCapacityPot();
};

function handleGridInput(index, value) {
    const vCell = document.getElementById(`v-cell-${index}`);
    const code = value.toUpperCase(); 

    if (activeBlockCodes.includes(code)) {
        vCell.style = getGradientStyle(code);
    } else {
        vCell.style = "";
        vCell.style.backgroundColor = "#fff";
    }
    // We only update total counts once (debouncing could be added here for performance, but straightforward for now)
    updateInventoryCounts();
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
    handleGridInput(parseInt(input.id.replace('i-cell-','')), '');
  });
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
    // zones order: [TL, TR, BL, BR]
    const z = data.zones;

    if (axis === 'h') {
      // flip left-right: [TR, TL, BR, BL]
      data.zones = [z[1], z[0], z[3], z[2]];

      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - x, y };
    } else {
      // flip top-bottom: [BL, BR, TL, TR]
      data.zones = [z[2], z[3], z[0], z[1]];

      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x, y: 100 - y };
    }

    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));

  } else if (data.pattern === 'diag_cross') {
    // zones order: [Top, Right, Bottom, Left]
    const z = data.zones;

    if (axis === 'h') {
      // left-right mirror: swap Right/Left
      data.zones = [z[0], z[3], z[2], z[1]];
    } else {
      // top-bottom mirror: swap Top/Bottom
      data.zones = [z[2], z[1], z[0], z[3]];
    }

  } else {
    // stripes (gradient angle mirror)
    let a = data.angle ?? 0;
    if (axis === 'h') a = (360 - a) % 360;   // mirror left-right
    else a = (180 - a) % 360;                // mirror top-bottom
    data.angle = ((a % 360) + 360) % 360;

    // if (data.pattern === 'stripes' && Array.isArray(data.stripeDividers) && data.stripeDividers.length) {
    //   data.stripeDividers = data.stripeDividers
    //     .map(p => 100 - p)
    //     .sort((x, y) => x - y);
    // }
  }
}



// --- CONTROLS & VISUALS ---

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

    // Delete button visibility rule
    const canDelete = activeBlockCodes.length > 1; // optionally: && type !== 'A' && type !== 'B';

    const div = document.createElement('div');
    div.className = 'block-control';

    // --- HEADER (Copy/Delete + Status) ---
    let headerHtml = `
      <div class="block-header">
        <span>Block <span class="block-name">${type}</span></span>
        <span id="status-${type}" class="status-ok">0 / ${data.limit}</span>
      </div>
    `;

    // --- PREVIEW ---
    let previewHtml = `<div class="block-preview" id="preview-${type}"></div>`;

    // --- ZONES ---
    let zonesHtml = `<div class="zones-container">`;
    data.zones.forEach((zone, index) => {
        zonesHtml += `
            <div class="zone-row">
                <span class="zone-label">${index + 1}</span>
                <select onchange="updateZoneWood('${type}', ${index}, this.value)" class="wood-dropdown">
                    ${getWoodOptionsHTML(zone.wood)}
                </select>
                <input type="color" value="${zone.color}" oninput="updateZoneColor('${type}', ${index}, this.value)">
            </div>
        `;
    });
    zonesHtml += `</div>`;

    // --- ACTIONS (Zones + Cycle) ---
    // Cycle button only makes sense for non-solid and (for now) non-cross patterns
    const showCycle = !isActuallySolid && !isCross && !isDiag;
    let actionsHtml = `
        <div class="actions-row">
            <div>
                <button class="btn btn-sm" onclick="addZone('${type}')" title="Add Zone">+</button>
                <button class="btn btn-sm" onclick="removeZone('${type}')" title="Remove Zone" ${data.zones.length <= 1 ? 'disabled' : ''}>-</button>
            </div>
            ${showCycle ? `<button class="btn btn-sm" onclick="cycleColors('${type}')" title="Cycle Colors">Cycle ↻</button>` : `<span></span>`}
        </div>
    `;

    // --- TRANSFORM CONTROLS ---
    const hiddenTransformControls = isActuallySolid ? 'hidden-control' : '';

    let transformHtml = `
      <div class="settings-row ${hiddenTransformControls}">
        <div class="setting-group" style="width:100%">
          <span class="label-sm">Orientation</span>

          <!-- Row 1: Transform (equal buttons) -->
          <div class="btn-row" style="margin-top:6px;">
            <button class="btn btn-sm" onclick="rotateBlockDef('${type}', 'left')" title="Rotate 90° left">
              <span class="btn-icon">⟲</span> Rotate
            </button>
            <button class="btn btn-sm" onclick="rotateBlockDef('${type}', 'right')" title="Rotate 90° right">
              <span class="btn-icon">⟳</span> Rotate
            </button>
            <button class="btn btn-sm" onclick="flipBlockDef('${type}', 'h')" title="Flip left-right">
              <span class="btn-icon">↔</span> Flip
            </button>
            <button class="btn btn-sm" onclick="flipBlockDef('${type}', 'v')" title="Flip top-bottom">
              <span class="btn-icon">↕</span> Flip
            </button>
          </div>

          <!-- Row 2: Variants + Manage (split with divider) -->
          <span class="label-sm">Copy Variants</span>
          <div class="btn-row-split" style="margin-top:8px;">
            <div class="btn-group">
              <button class="btn btn-sm btn-primary" onclick="duplicateMirroredBlock('${type}', 'h')" title="Create mirrored copy (left-right)">
                <span class="btn-icon">↔</span> Copy Flip
              </button>
              <button class="btn btn-sm btn-primary" onclick="duplicateMirroredBlock('${type}', 'v')" title="Create mirrored copy (top-bottom)">
                <span class="btn-icon">↕</span> Copy Flip
              </button>
            </div>

            <div class="btn-divider-vert"></div>

            <div class="btn-group">
              <button class="btn btn-sm" onclick="duplicateBlockType('${type}')" title="Duplicate this block">
                <span class="btn-icon">⎘</span> Copy
              </button>
              ${canDelete ? `
                <button class="btn btn-sm btn-danger" onclick="deleteBlockType('${type}')" title="Delete this block">
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

    // --- PATTERN SELECTOR ---
    let patternHtml = `
        <div class="settings-row">
            <div class="setting-group" style="width:100%">
                <span class="label-sm">Pattern Type</span>
                <select onchange="updatePatternType('${type}', this.value)">
                    <option value="stripes" ${data.pattern === 'stripes' ? 'selected' : ''}>Stripes</option>
                    <option value="cross" ${data.pattern === 'cross' ? 'selected' : ''}>Cross Cut (4 regions)</option>
                    <option value="diag_cross" ${data.pattern === 'diag_cross' ? 'selected' : ''}>Diagonal Cross (4 triangles)</option>
                </select>
            </div>
        </div>
    `;

    // --- CROSS SETTINGS ---
    let crossHtml = `
        <div class="settings-row ${hiddenCrossControls}">
            <div class="setting-group">
                <span class="label-sm">
                    Vertical Split: <span id="cross-${type}-x">${data.cross?.x ?? 50}</span>%
                </span>
                <input type="range"
                    min="5" max="95" step="1"
                    value="${data.cross?.x ?? 50}"
                    oninput="updateCrossSetting('${type}', 'x', this.value)">
            </div>
            <div class="setting-group">
                <span class="label-sm">
                    Horizontal Split: <span id="cross-${type}-y">${data.cross?.y ?? 50}</span>%
                </span>
                <input type="range"
                    min="5" max="95" step="1"
                    value="${data.cross?.y ?? 50}"
                    oninput="updateCrossSetting('${type}', 'y', this.value)">
            </div>
        </div>
    `;

    // --- STRIPES SETTINGS (Density + Angle), hidden when solid OR cross ---
    let stripesSettingsHtml = `
        <div class="settings-row">
            <div class="setting-group ${hiddenStripesControls}">
                <span class="label-sm">Dividers</span>
                <select onchange="updateSetting('${type}', 'density', this.value)">
                  <option value="1" ${data.density === 1 ? 'selected' : ''}>1 Divider</option>
                  <option value="2" ${data.density === 2 ? 'selected' : ''}>2 Dividers</option>
                  <option value="3" ${data.density === 3 ? 'selected' : ''}>3 Dividers</option>
                  <option value="4" ${data.density === 4 ? 'selected' : ''}>4 Dividers</option>
                </select>
            </div>
            <div class="setting-group radial-wrapper ${hiddenStripesControls}">
                <span class="label-sm">Angle (${data.angle}°)</span>
                <div class="radial-dial" onclick="rotateBlockAngle('${type}')" title="Click to rotate 45°">
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
                oninput="updateStripeDivider('${type}', ${idx}, this.value)">
            </div>
          `).join('')}

          <div class="divider-actions">
            <button class="btn btn-sm btn-center" onclick="resetStripeDividersEven('${type}')" title="Reset dividers to equal spacing">
              Center / Even
            </button>
          </div>
        </div>
      </div>
    `;

    // --- QUANTITY (Always visible) ---
    let qtyHtml = `
      <div class="settings-row allocated-qty">
        <div class="setting-group" style="width:100%">
          <span class="label-sm">Allocated Quantity</span>
          <input type="number"
            value="${data.limit}"
            oninput="updateSetting('${type}', 'limit', this.value)"
            min="0">
        </div>
      </div>
    `;

    // Combine settings
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
  });
}


// --- GLOBAL HANDLERS ---
window.rotateBlockAngle = function(type) {
  let current = blockData[type].angle;
  current += 45;
  current = ((current % 360) + 360) % 360;
  blockData[type].angle = current;
  renderControls();
  updateAllVisuals();
}

window.updateZoneWood = function(type, index, woodKey) {
  blockData[type].zones[index].wood = woodKey;
  blockData[type].zones[index].color = WOOD_PALETTE[woodKey].color;
  const idx = activeBlockCodes.indexOf(type);
  const colorInput = document.querySelectorAll('.block-control')[idx]?.querySelectorAll('input[type="color"]')[index];
  if(colorInput) colorInput.value = WOOD_PALETTE[woodKey].color;
  updateAllVisuals();
};

window.updateZoneColor = function(type, index, hex) {
  blockData[type].zones[index].color = hex;
  blockData[type].zones[index].wood = 'custom';
  const idx = activeBlockCodes.indexOf(type);
  const select = document.querySelectorAll('.block-control')[idx]?.querySelectorAll('select.wood-dropdown')[index];
  if(select) select.value = 'custom';
  updateAllVisuals();
};

window.addZone = function(type) {
  blockData[type].zones.push({ wood: 'maple_hard', color: WOOD_PALETTE.maple_hard.color });

  const data = blockData[type];

  // If this is stripes, ensure divider count can accommodate the number of zones (up to 4 dividers)
  if (data.pattern === 'stripes' && data.zones.length > 1) {
    const neededDividers = Math.min(4, data.zones.length - 1);
    if ((data.density || 1) < neededDividers) data.density = neededDividers;
    ensureStripeDividers(type);
  }

  renderControls();
  updateAllVisuals();
};

window.removeZone = function(type) {
  if (blockData[type].zones.length > 1) {
    blockData[type].zones.pop();
    renderControls();
    updateAllVisuals();
  }
};

window.cycleColors = function(type) {
  const last = blockData[type].zones.pop();
  blockData[type].zones.unshift(last);
  renderControls();
  updateAllVisuals();
};

window.updatePatternType = function(type, pattern) {
  blockData[type].pattern = pattern;

  // Ensure cross params exist
  if (!blockData[type].cross) blockData[type].cross = { x: 50, y: 50 };

  if (pattern === 'cross' || pattern === 'diag_cross') {
      while (blockData[type].zones.length < 4) {
          const last = blockData[type].zones[blockData[type].zones.length - 1];
          blockData[type].zones.push({ wood: last.wood, color: last.color });
      }
  }

  renderControls();
  updateAllVisuals();
};

window.updateStripeDivider = function(type, idx, value) {
  const data = blockData[type];
  if (!data) return;

  ensureStripeDividers(type);

  let v = parseInt(value, 10);
  if (isNaN(v)) v = data.stripeDividers[idx] ?? 50;

  const lower = idx === 0 ? 5 : data.stripeDividers[idx - 1] + 1;
  const upper = idx === data.stripeDividers.length - 1 ? 95 : data.stripeDividers[idx + 1] - 1;

  v = clamp(v, lower, upper);
  data.stripeDividers[idx] = v;

  // Update readout live
  const readout = document.getElementById(`stripe-${type}-d${idx}`);
  if (readout) readout.textContent = v;

  updateAllVisuals();
};


window.updateCrossSetting = function(type, axis, value) {
  let v = parseInt(value, 10);
  if (isNaN(v)) v = 50;

  // Clamp so it don't create zero-sized regions
  if (v < 5) v = 5;
  if (v > 95) v = 95;

  if (!blockData[type].cross) blockData[type].cross = { x: 50, y: 50 };
  blockData[type].cross[axis] = v;

  // Update the visible % next to the label without re-rendering controls
  const readout = document.getElementById(`cross-${type}-${axis}`);
  if (readout) readout.textContent = v;

  // Live update preview + grid visuals
  updateAllVisuals();
};

window.rotateBlockDef = function(type, dir) {
  const data = blockData[type];
  if (!data || (data.isSolid || data.zones.length === 1)) return;

  if (data.pattern === 'cross') {
    // zones order: [TL, TR, BL, BR]
    const z = data.zones;

    if (dir === 'right') {
      // clockwise: new [TL,TR,BL,BR] = [old TR, old BR, old TL, old BL]
      data.zones = [z[2], z[0], z[3], z[1]];

      // rotate cross split: x' = 100 - y, y' = x
      // rotate cross split: (x', y') = (1 - y, x)
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - y, y: x };
    } else {
      // COUNTER-CLOCKWISE (90°):
      // [TL,TR,BL,BR]
      data.zones = [z[1], z[3], z[0], z[2]];

      // rotate cross split: (x', y') = (y, 1 - x)
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: y, y: 100 - x };
    }

    // clamp just in case
    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));

  } else if (data.pattern === 'diag_cross') {
    const z = data.zones; // [Top, Right, Bottom, Left]

    if (dir === 'right') {
        // clockwise
        data.zones = [z[3], z[0], z[1], z[2]];
    } else {
        // counterclockwise
        data.zones = [z[1], z[2], z[3], z[0]];
    }

  } else {
    // default: stripes (and other gradient-like patterns later)
    // Rotate 90°
    const delta = (dir === 'right') ? 90 : -90;
    let a = (data.angle ?? 0) + delta;

    // keep your existing 0..179 style (wrap)
    a = ((a % 360) + 360) % 360;
    data.angle = a;
  }

  renderControls();
  updateAllVisuals();
};

window.flipBlockDef = function(type, axis) {
  const data = blockData[type];
  if (!data || (data.isSolid || data.zones.length === 1)) return;

  if (data.pattern === 'cross') {
    // zones order: [TL, TR, BL, BR]
    const z = data.zones;

    if (axis === 'h') {
      // flip left-right: [TR, TL, BR, BL]
      data.zones = [z[1], z[0], z[3], z[2]];

      // geometry mirror: x' = 100 - x
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: 100 - x, y: y };
    } else {
      // flip top-bottom: [BL, BR, TL, TR]
      data.zones = [z[2], z[3], z[0], z[1]];

      // geometry mirror: y' = 100 - y
      const x = data.cross?.x ?? 50;
      const y = data.cross?.y ?? 50;
      data.cross = { x: x, y: 100 - y };
    }

    data.cross.x = Math.max(5, Math.min(95, data.cross.x));
    data.cross.y = Math.max(5, Math.min(95, data.cross.y));
    } else if (data.pattern === 'diag_cross') {
      const z = data.zones; // [Top, Right, Bottom, Left]

      if (axis === 'h') {
          // left-right mirror: swap Right/Left
          data.zones = [z[0], z[3], z[2], z[1]];
      } else {
          // top-bottom mirror: swap Top/Bottom
          data.zones = [z[2], z[1], z[0], z[3]];
      }

    } else {
      let a = data.angle ?? 0;

      if (axis === 'h') {
        // Flip left-right (mirror across vertical axis)
        a = (360 - a) % 360;
      } else {
        // Flip top-bottom (mirror across horizontal axis)
        a = (180 - a) % 360;
      }

      data.angle = ((a % 360) + 360) % 360;
      // if (data.pattern === 'stripes' && Array.isArray(data.stripeDividers) && data.stripeDividers.length) {
      //   data.stripeDividers = data.stripeDividers
      //     .map(p => 100 - p)
      //     .sort((x, y) => x - y);
      // }
  }

  renderControls();
  updateAllVisuals();
};

window.resetStripeDividersEven = function(type) {
  const data = blockData[type];
  if (!data || data.pattern !== 'stripes') return;

  // Clamp divider count
  data.density = clamp(parseInt(data.density, 10) || 1, 1, 4);

  // Rebuild evenly spaced positions
  data.stripeDividers = [];
  for (let i = 1; i <= data.density; i++) {
    data.stripeDividers.push(Math.round((i * 100) / (data.density + 1)));
  }

  renderControls();
  updateAllVisuals();
};

window.updateSetting = function(type, setting, value) {
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
};

window.duplicateBlockType = function(sourceType) {
    // Find next available letter (A–Z)
    let nextChar = null;
    for (let code = 65; code <= 90; code++) {
        const candidate = String.fromCharCode(code);
        if (!activeBlockCodes.includes(candidate)) {
            nextChar = candidate;
            break;
        }
    }
    if (!nextChar) return;

    // Deep clone
    const src = blockData[sourceType];
    const clone = JSON.parse(JSON.stringify(src));
    clone.used = 0;

    // Register
    blockData[nextChar] = clone;

    // Insert right after source block
    const srcIndex = activeBlockCodes.indexOf(sourceType);
    if (srcIndex >= 0) {
        activeBlockCodes.splice(srcIndex + 1, 0, nextChar);
    } else {
        activeBlockCodes.push(nextChar);
    }

    renderControls();
    updateAllVisuals();
    updateCapacityPot();
    updateInventoryCounts();
};

window.duplicateMirroredBlock = function(sourceType, axis) {
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
};

window.deleteBlockType = function(type) {
  // Optional: prevent deleting base blocks
  // if (type === 'A' || type === 'B') return;

  // Don't allow deleting if it would leave you with no blocks
  if (activeBlockCodes.length <= 1) {
    alert("You must have at least one block type.");
    return;
  }

  // Confirm
  const ok = confirm(`Delete Block ${type}? Any ${type} cells in the grid will be cleared.`);
  if (!ok) return;

  // 1) Clear all grid inputs that use this block code
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach(input => {
    if (input.value.toUpperCase() === type) {
      input.value = '';
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      const linearIndex = (row * config.cols) + col;
      handleGridInput(linearIndex, ''); // clears visual
    }
  });

  // 2) Remove from active list
  activeBlockCodes = activeBlockCodes.filter(c => c !== type);

  // 3) Remove data
  delete blockData[type];

  // 4) Refresh UI + counts + capacity
  renderControls();
  updateAllVisuals();
  updateInventoryCounts();
  updateCapacityPot();
};

// --- HELPERS ---

function getGradientStyle(type) {
  const data = blockData[type];
  const isActuallySolid = data.isSolid || data.zones.length === 1;

  if (isActuallySolid) return `background: ${data.zones[0].color};`;

  // ---- CROSS CUT ----
  if (data.pattern === 'cross') {
    const x = Math.max(5, Math.min(95, data.cross?.x ?? 50));
    const y = Math.max(5, Math.min(95, data.cross?.y ?? 50));

    const leftW = x;
    const rightW = 100 - x;
    const topH = y;
    const bottomH = 100 - y;

    // Zones map:
    // 0 = top-left, 1 = top-right, 2 = bottom-left, 3 = bottom-right
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

  // ---- DIAGONAL CROSS (4 TRIANGLES) ----
  if (data.pattern === 'diag_cross') {
    // zones order: [Top, Right, Bottom, Left]
    const cTop = data.zones[0]?.color ?? '#fff';
    const cRight = data.zones[1]?.color ?? cTop;
    const cBottom = data.zones[2]?.color ?? cTop;
    const cLeft = data.zones[3]?.color ?? cTop;

    // from 45deg makes the boundaries align with diagonals (45/135/225/315)
    return `background: conic-gradient(from -45deg at 50% 50%,
      ${cTop} 0deg 90deg,
      ${cRight} 90deg 180deg,
      ${cBottom} 180deg 270deg,
      ${cLeft} 270deg 360deg
    );`.replace(/\s+/g, ' ').trim();
  }

  // ---- STRIPES (divider-based logic) ----
  ensureStripeDividers(type);

  const dividers = clamp(parseInt(data.density, 10) || 1, 1, 4);
  const angle = data.angle ?? 0;
  const colors = data.zones.map(z => z.color);
  const numColors = colors.length;

  // boundaries: 0, d1, d2, ..., 100
  const cuts = [0, ...(data.stripeDividers || []), 100].slice(0, dividers + 2);
  // (slice defensively: should already match)

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

  // dividers count is stored in data.density in your app
  let dividers = parseInt(data.density, 10) || 1;
  dividers = clamp(dividers, 1, 4);
  data.density = dividers;

  if (!Array.isArray(data.stripeDividers)) data.stripeDividers = [];

  // If count mismatch, rebuild evenly spaced
  if (data.stripeDividers.length !== dividers) {
    data.stripeDividers = [];
    for (let i = 1; i <= dividers; i++) {
      data.stripeDividers.push(Math.round((i * 100) / (dividers + 1)));
    }
  }

  // Sanitize: sorted & spaced
  data.stripeDividers = data.stripeDividers
    .map(p => clamp(parseInt(p, 10) || 50, 5, 95))
    .sort((a, b) => a - b);

  // Enforce strictly increasing by nudging if needed
  for (let i = 0; i < data.stripeDividers.length; i++) {
    const minVal = i === 0 ? 5 : data.stripeDividers[i - 1] + 1;
    const maxVal = i === data.stripeDividers.length - 1 ? 95 : data.stripeDividers[i + 1] - 1;
    data.stripeDividers[i] = clamp(data.stripeDividers[i], minVal, maxVal);
  }
}


function updateAllVisuals() {
  activeBlockCodes.forEach(type => {
    const preview = document.getElementById(`preview-${type}`);
    if(preview) preview.style = getGradientStyle(type);
  });
  const inputs = document.querySelectorAll('.input-cell');
  inputs.forEach((input, index) => {
    // We need to re-calc index based on grid excluding headers? 
    // No, the inputs are stored linearly.
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
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

  // Show blocks in the same order as controls (activeBlockCodes)
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