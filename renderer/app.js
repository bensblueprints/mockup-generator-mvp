/* Mockcraft renderer — UI glue around the shared raster/template engine. */
'use strict';

const R = window.MockcraftRaster;
const T = window.MockcraftTemplates;

const state = {
  templateId: T.TEMPLATES[0].id,
  design: null,       // raster image {width,height,data}
  designName: null,
  scale: 1, offsetX: 0, offsetY: 0, rotation: 0, fit: 'cover',
  garment: T.GARMENT_COLORS[0].hex,
  batch: new Set(),
};

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const status = $('status');

// ---------- demo design so the app never opens on an empty stage ----------
function makeDemoDesign() {
  const c = document.createElement('canvas');
  c.width = 900; c.height = 900;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 900, 900);
  grad.addColorStop(0, '#7c6cff');
  grad.addColorStop(1, '#4ecdc4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 900, 900);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(150 + i * 130, 700 - i * 90, 60, 0, 7); g.fill(); }
  g.fillStyle = '#fff';
  g.font = '700 92px Segoe UI, sans-serif';
  g.textAlign = 'center';
  g.fillText('YOUR', 450, 400);
  g.fillText('DESIGN', 450, 510);
  g.font = '400 34px Segoe UI, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.fillText('drop an image to replace', 450, 590);
  return canvasToRaster(c);
}

function canvasToRaster(c) {
  const g = c.getContext('2d');
  const id = g.getImageData(0, 0, c.width, c.height);
  return { width: c.width, height: c.height, data: id.data };
}

function rasterToCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return c;
}

function loadImageFromDataUrl(dataUrl, name) {
  const im = new Image();
  im.onload = () => {
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    c.getContext('2d').drawImage(im, 0, 0);
    state.design = canvasToRaster(c);
    state.designName = name;
    $('design-meta').textContent = `${name} — ${c.width}×${c.height}`;
    setStatus(`Loaded ${name}`);
    schedulePreview();
    renderGallery(); // thumbnails show the new design
  };
  im.src = dataUrl;
}

// ---------- rendering ----------
let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 30);
}

function currentOpts(resolution) {
  return {
    resolution,
    scale: state.scale, offsetX: state.offsetX, offsetY: state.offsetY,
    rotation: state.rotation, fit: state.fit, garment: state.garment,
  };
}

function renderPreview() {
  const tpl = T.getTemplate(state.templateId);
  const t0 = performance.now();
  const img = T.renderTemplate(tpl, state.design || demoDesign, currentOpts(0.55));
  preview.width = img.width; preview.height = img.height;
  preview.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  setStatus(`${tpl.name} — preview ${img.width}×${img.height} · rendered in ${Math.round(performance.now() - t0)} ms · export at ${tpl.width}×${tpl.height}`);
}

function setStatus(msg) { status.textContent = msg; }

// ---------- gallery ----------
function renderGallery() {
  const list = $('template-list');
  list.innerHTML = '';
  const cats = { devices: 'Devices', apparel: 'Apparel', print: 'Print' };
  for (const [cat, label] of Object.entries(cats)) {
    const h = document.createElement('h4');
    h.textContent = label;
    list.appendChild(h);
    for (const tpl of T.TEMPLATES.filter((t) => t.category === cat)) {
      const card = document.createElement('div');
      card.className = 'tpl-card' + (tpl.id === state.templateId ? ' active' : '');
      const img = T.renderTemplate(tpl, state.design || demoDesign, currentOpts(0.12));
      const c = rasterToCanvas(img);
      card.appendChild(c);
      const name = document.createElement('div');
      name.className = 'tpl-name';
      name.textContent = tpl.name;
      card.appendChild(name);
      card.onclick = () => {
        state.templateId = tpl.id;
        document.querySelectorAll('.tpl-card').forEach((el) => el.classList.remove('active'));
        card.classList.add('active');
        $('garment-section').style.display = tpl.colorable ? '' : 'none';
        renderPreview();
      };
      list.appendChild(card);
    }
  }
}

// ---------- garment swatches ----------
function renderSwatches() {
  const wrap = $('swatches');
  wrap.innerHTML = '';
  for (const gc of T.GARMENT_COLORS) {
    const s = document.createElement('div');
    s.className = 'swatch' + (gc.hex === state.garment ? ' active' : '');
    s.style.background = gc.hex;
    s.title = gc.id;
    s.onclick = () => {
      state.garment = gc.hex;
      document.querySelectorAll('.swatch').forEach((el) => el.classList.remove('active'));
      s.classList.add('active');
      schedulePreview();
    };
    wrap.appendChild(s);
  }
}

// ---------- batch ----------
function renderBatchList() {
  const wrap = $('batch-list');
  wrap.innerHTML = '';
  for (const tpl of T.TEMPLATES) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = state.batch.has(tpl.id);
    cb.onchange = () => {
      cb.checked ? state.batch.add(tpl.id) : state.batch.delete(tpl.id);
      $('batch-count').textContent = state.batch.size;
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(tpl.name));
    wrap.appendChild(label);
  }
  $('batch-count').textContent = state.batch.size;
}

function rasterToPngBase64(img) {
  const c = rasterToCanvas(img);
  return c.toDataURL('image/png').split(',')[1];
}

// ---------- wiring ----------
const demoDesign = makeDemoDesign();

$('btn-upload').onclick = async () => {
  const res = await window.mockcraft.openImage();
  if (res) loadImageFromDataUrl(res.dataUrl, res.name);
};

$('btn-export').onclick = async () => {
  const tpl = T.getTemplate(state.templateId);
  setStatus('Rendering full-resolution export…');
  await new Promise((r) => setTimeout(r, 20));
  const img = T.renderTemplate(tpl, state.design || demoDesign, currentOpts(1));
  const base64 = rasterToPngBase64(img);
  const file = await window.mockcraft.savePng(`mockcraft-${tpl.id}.png`, base64);
  setStatus(file ? `Exported ${file}` : 'Export cancelled');
};

$('btn-batch').onclick = async () => {
  if (!state.batch.size) { setStatus('Select at least one template for batch export.'); return; }
  const files = [];
  let i = 0;
  for (const id of state.batch) {
    const tpl = T.getTemplate(id);
    setStatus(`Batch rendering ${++i}/${state.batch.size} — ${tpl.name}…`);
    await new Promise((r) => setTimeout(r, 20));
    const img = T.renderTemplate(tpl, state.design || demoDesign, currentOpts(1));
    files.push({ name: `mockcraft-${tpl.id}.png`, base64: rasterToPngBase64(img) });
  }
  const res = await window.mockcraft.saveBatch(files);
  setStatus(res ? `Batch exported ${res.count} mockups to ${res.dir}` : 'Batch export cancelled');
};

$('btn-reset').onclick = () => {
  state.scale = 1; state.offsetX = 0; state.offsetY = 0; state.rotation = 0;
  $('ctl-scale').value = 1; $('ctl-offx').value = 0; $('ctl-offy').value = 0; $('ctl-rot').value = 0;
  syncSliderLabels();
  schedulePreview();
};

function syncSliderLabels() {
  $('val-scale').textContent = Number(state.scale).toFixed(2);
  $('val-offx').textContent = Number(state.offsetX).toFixed(2);
  $('val-offy').textContent = Number(state.offsetY).toFixed(2);
  $('val-rot').textContent = `${state.rotation}°`;
}

for (const [id, key] of [['ctl-scale', 'scale'], ['ctl-offx', 'offsetX'], ['ctl-offy', 'offsetY'], ['ctl-rot', 'rotation']]) {
  $(id).oninput = (e) => {
    state[key] = parseFloat(e.target.value);
    syncSliderLabels();
    schedulePreview();
  };
}

document.querySelectorAll('.chip[data-fit]').forEach((chip) => {
  chip.onclick = () => {
    state.fit = chip.dataset.fit;
    document.querySelectorAll('.chip[data-fit]').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    schedulePreview();
  };
});

// drag & drop anywhere
const dz = $('drop-zone');
dz.onclick = () => $('btn-upload').onclick();
for (const el of [document.body, dz]) {
  el.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
  el.addEventListener('dragleave', () => dz.classList.remove('over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('over');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => loadImageFromDataUrl(reader.result, f.name);
    reader.readAsDataURL(f);
  });
}

// pre-select a nice batch default
['phone-front', 'laptop-front', 'tshirt-flat'].forEach((id) => state.batch.add(id));

renderGallery();
renderSwatches();
renderBatchList();
syncSliderLabels();
renderPreview();
