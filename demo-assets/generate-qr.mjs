// Branded Waft QR generator.
//
// Renders a scannable, on-brand QR: deep-indigo gradient modules as rounded
// dots on a white rounded tile, rounded finder "eyes", and a center ribbon-W
// knockout. Error correction is level H (~30% recovery) so the center logo
// never breaks scannability. Output is an SVG rasterized to PNG via headless
// Chrome (same pipeline as the poster).
//
// Usage:  node demo-assets/generate-qr.mjs
//   Regenerates the standard set below. Add a job to `JOBS` for a new event.
//   Each job: { url, out, size } (size = output px, default 1000).

import QRCode from "qrcode";
import { writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const HERE = resolve(new URL(".", import.meta.url).pathname);
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Brand: deep periwinkle→indigo modules (dark enough for high contrast on the
// white tile), white ground, periwinkle ribbon-W. Matches DESIGN.md.
const MOD_TOP = "#2f3a86";
const MOD_BOT = "#141b40";
const TILE = "#ffffff";
const W_TOP = "#8ba2ff";
const W_BOT = "#4c6bff";

const JOBS = [
  { url: "https://getwaft.app/e/ycss2026", out: "qr-event.png" },
  { url: "https://getwaft.app/c/x7W_R7LqZ-", out: "qr-card.png" },
  { url: "https://testflight.apple.com/join/WeqhVkZm", out: "qr-testflight.png" },
];

// True if module (r,c) belongs to one of the three 7x7 finder patterns — we
// render those as smooth rounded frames instead of dots (premium + scans well).
function inFinder(r, c, n) {
  const tl = r < 7 && c < 7;
  const tr = r < 7 && c >= n - 7;
  const bl = r >= n - 7 && c < 7;
  return tl || tr || bl;
}

// A rounded, brand-colored finder eye: outer 7x7 ring + inner 3x3 pip.
function finderEye(x, y, cell) {
  const s = 7 * cell;
  const outerR = cell * 2;
  const ring = cell; // ring thickness
  const innerX = x + 2 * cell;
  const innerY = y + 2 * cell;
  const innerS = 3 * cell;
  const innerR = cell * 1.1;
  return `
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${outerR}" fill="url(#mod)"/>
    <rect x="${x + ring}" y="${y + ring}" width="${s - 2 * ring}" height="${s - 2 * ring}" rx="${outerR - ring}" fill="${TILE}"/>
    <rect x="${innerX}" y="${innerY}" width="${innerS}" height="${innerS}" rx="${innerR}" fill="url(#mod)"/>`;
}

function buildSvg(url, px) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const quiet = 4; // quiet zone in modules
  const cells = n + quiet * 2;
  const cell = px / cells;
  const off = quiet * cell;
  const tileR = px * 0.09;

  let dots = "";
  // Data modules as rounded dots (skip finder regions — drawn separately).
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!data[r * n + c]) continue;
      if (inFinder(r, c, n)) continue;
      const x = off + c * cell;
      const y = off + r * cell;
      // Full-cell modules with corner rounding: adjacent dark modules touch, so
      // the decoder sees solid runs (reliable) while the rounding keeps the
      // styled look. Gappy "dots" scan marginally — don't shrink these.
      const rad = cell * 0.33;
      dots += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${rad.toFixed(2)}" fill="url(#mod)"/>`;
    }
  }

  const eyes =
    finderEye(off, off, cell) +
    finderEye(off + (n - 7) * cell, off, cell) +
    finderEye(off, off + (n - 7) * cell, cell);

  // Center ribbon-W on a white knockout. Kept ≈ 22% of the QR so ECC-H recovers
  // the covered modules. W drawn as a bold round-joined stroke.
  const logoS = px * 0.225;
  const lx = (px - logoS) / 2;
  const ly = (px - logoS) / 2;
  const logoR = logoS * 0.28;
  // W path in a 100x100 local box, scaled into the knockout.
  const wPath = "M22,30 L39,74 L50,48 L61,74 L78,30";
  const wStroke = logoS * 0.11;
  const scale = logoS / 100;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <defs>
    <linearGradient id="mod" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${MOD_TOP}"/>
      <stop offset="1" stop-color="${MOD_BOT}"/>
    </linearGradient>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${W_TOP}"/>
      <stop offset="1" stop-color="${W_BOT}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${px}" height="${px}" rx="${tileR}" fill="${TILE}"/>
  ${dots}
  ${eyes}
  <rect x="${lx}" y="${ly}" width="${logoS}" height="${logoS}" rx="${logoR}" fill="${TILE}"/>
  <g transform="translate(${lx},${ly}) scale(${scale})">
    <path d="${wPath}" fill="none" stroke="url(#wg)" stroke-width="${wStroke / scale}" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
</svg>`;
}

const tmp = mkdtempSync(join(tmpdir(), "waft-qr-"));
for (const job of JOBS) {
  const px = job.size ?? 1000;
  const svg = buildSvg(job.url, px);
  const svgPath = join(tmp, job.out.replace(/\.png$/, ".svg"));
  writeFileSync(svgPath, svg);
  const outPath = join(HERE, job.out);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-extensions",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--screenshot=${outPath}`,
      `--window-size=${px},${px}`,
      `file://${svgPath}`,
    ],
    { stdio: "ignore" }
  );
  console.log(`✓ ${job.out}  ←  ${job.url}`);
}
console.log("Done. Verify a scan before printing.");
