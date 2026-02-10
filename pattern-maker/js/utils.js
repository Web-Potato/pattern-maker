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

// The core visual engine
export function getGradientStyleForBlock(block) {
  //solid check
  const isActuallySolid = block.isSolid || (block.zones?.length === 1);
  if (isActuallySolid) {
    return `background: ${block.zones?.[0]?.color ?? '#fff'};`;
  }

  //cross pattern
  if (block.pattern === 'cross') {
    const x = Math.max(5, Math.min(95, block.cross?.x ?? 50));
    const y = Math.max(5, Math.min(95, block.cross?.y ?? 50));
    const leftW = x, rightW = 100 - x, topH = y, bottomH = 100 - y;
    const c0 = block.zones?.[0]?.color ?? '#fff';
    const c1 = block.zones?.[1]?.color ?? c0;
    const c2 = block.zones?.[2]?.color ?? c0;
    const c3 = block.zones?.[3]?.color ?? c0;
    return `background-image: linear-gradient(${c0}, ${c0}), linear-gradient(${c1}, ${c1}), linear-gradient(${c2}, ${c2}), linear-gradient(${c3}, ${c3});
        background-size: ${leftW}% ${topH}%, ${rightW}% ${topH}%, ${leftW}% ${bottomH}%, ${rightW}% ${bottomH}%;
        background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%;
        background-repeat: no-repeat;`.replace(/\s+/g, ' ').trim();
  }

  //diagonal cross
  if (block.pattern === 'diag_cross') {
    const cTop = block.zones?.[0]?.color ?? '#fff';
    const cRight = block.zones?.[1]?.color ?? cTop;
    const cBottom = block.zones?.[2]?.color ?? cTop;
    const cLeft = block.zones?.[3]?.color ?? cTop;
    return `background: conic-gradient(from -45deg at 50% 50%, ${cTop} 0deg 90deg, ${cRight} 90deg 180deg, ${cBottom} 180deg 270deg, ${cLeft} 270deg 360deg );`.replace(/\s+/g, ' ').trim();
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