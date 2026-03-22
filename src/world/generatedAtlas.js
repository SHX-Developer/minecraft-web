import * as THREE from "three";
import { ATLAS_COLUMNS, ATLAS_ROWS } from "../utils/constants.js";

const TILE_SIZE = 32;

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967295;
  };
}

function fillNoiseTile(ctx, px, py, palette, seed = 1, noise = 0.22) {
  const rnd = makeRng(seed);
  const p = palette.map((color) => {
    const c = new THREE.Color(color);
    return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
  });

  for (let y = 0; y < TILE_SIZE; y += 1) {
    for (let x = 0; x < TILE_SIZE; x += 1) {
      const base = p[(x + y) % p.length];
      const f = 1 + (rnd() - 0.5) * noise;
      const r = Math.max(0, Math.min(255, Math.round(base[0] * f)));
      const g = Math.max(0, Math.min(255, Math.round(base[1] * f)));
      const b = Math.max(0, Math.min(255, Math.round(base[2] * f)));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(px + x, py + y, 1, 1);
    }
  }
}

function drawHorizontalPlanks(ctx, px, py, base, line, seed = 1) {
  fillNoiseTile(ctx, px, py, [base], seed, 0.12);
  ctx.fillStyle = line;
  for (let y = 5; y < TILE_SIZE; y += 8) {
    ctx.fillRect(px, py + y, TILE_SIZE, 1);
  }
}

function drawBricks(ctx, px, py, base, line, seed = 1) {
  fillNoiseTile(ctx, px, py, [base], seed, 0.1);
  ctx.fillStyle = line;
  for (let y = 0; y < TILE_SIZE; y += 8) {
    ctx.fillRect(px, py + y, TILE_SIZE, 1);
  }
  for (let y = 0; y < TILE_SIZE; y += 8) {
    const offset = (y / 8) % 2 === 0 ? 0 : 8;
    for (let x = offset; x < TILE_SIZE; x += 16) {
      ctx.fillRect(px + x, py + y, 1, 8);
    }
  }
}

function drawBookshelf(ctx, px, py) {
  fillNoiseTile(ctx, px, py, ["#a07443"], 3331, 0.16);
  ctx.fillStyle = "#5f3d22";
  for (let x = 0; x < TILE_SIZE; x += 8) {
    ctx.fillRect(px + x, py, 1, TILE_SIZE);
  }
  const bookColors = ["#4b78c8", "#aa3a33", "#e8d26e", "#4fa45f"];
  for (let x = 1; x < TILE_SIZE - 2; x += 4) {
    ctx.fillStyle = bookColors[(x >> 2) % bookColors.length];
    ctx.fillRect(px + x, py + 4, 2, TILE_SIZE - 8);
  }
}

function drawGlass(ctx, px, py) {
  ctx.fillStyle = "#b1d6f0";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (let i = 0; i < TILE_SIZE; i += 7) {
    ctx.fillRect(px + i, py, 1, TILE_SIZE);
    ctx.fillRect(px, py + i, TILE_SIZE, 1);
  }
}

function drawWater(ctx, px, py) {
  fillNoiseTile(ctx, px, py, ["#3e73c6", "#3568b6"], 9022, 0.22);
  ctx.fillStyle = "rgba(153, 197, 255, 0.22)";
  for (let y = 2; y < TILE_SIZE; y += 6) {
    ctx.fillRect(px, py + y, TILE_SIZE, 1);
  }
}

function drawTorch(ctx, px, py) {
  ctx.clearRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#5f4932";
  ctx.fillRect(px + 14, py + 10, 4, 20);
  ctx.fillStyle = "#e6b34c";
  ctx.fillRect(px + 12, py + 6, 8, 6);
  ctx.fillStyle = "#fff2ab";
  ctx.fillRect(px + 13, py + 4, 6, 3);
}

function drawGrassTop(ctx, px, py) {
  fillNoiseTile(ctx, px, py, ["#6ab748", "#4f9f3a"], 1001, 0.2);
}

function drawGrassSide(ctx, px, py) {
  fillNoiseTile(ctx, px, py, ["#8f6438"], 1002, 0.18);
  ctx.fillStyle = "#5dae43";
  ctx.fillRect(px, py, TILE_SIZE, 9);
}

function paintTile(ctx, x, y, painter) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  painter(ctx, px, py);
}

export function createGeneratedAtlasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_SIZE * ATLAS_COLUMNS;
  canvas.height = TILE_SIZE * ATLAS_ROWS;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  paintTile(ctx, 0, 0, drawGrassTop);
  paintTile(ctx, 1, 0, drawGrassSide);
  paintTile(ctx, 2, 0, (c, x, y) => fillNoiseTile(c, x, y, ["#845229", "#6e441f"], 1203, 0.2));
  paintTile(ctx, 3, 0, (c, x, y) => fillNoiseTile(c, x, y, ["#8a8a8c", "#707174"], 1204, 0.2));
  paintTile(ctx, 4, 0, (c, x, y) => drawHorizontalPlanks(c, x, y, "#b58a4c", "#8f6a38", 1205));
  paintTile(ctx, 5, 0, (c, x, y) => drawHorizontalPlanks(c, x, y, "#8d6940", "#664a2d", 1206));
  paintTile(ctx, 6, 0, (c, x, y) => drawHorizontalPlanks(c, x, y, "#b48952", "#6a4b2f", 1207));
  paintTile(ctx, 7, 0, (c, x, y) => fillNoiseTile(c, x, y, ["#4e8b46", "#3f7c3b"], 1208, 0.2));

  paintTile(ctx, 0, 1, (c, x, y) => fillNoiseTile(c, x, y, ["#dbca84", "#ccb973"], 1301, 0.12));
  paintTile(ctx, 1, 1, (c, x, y) => drawBricks(c, x, y, "#a35745", "#74342a", 1302));
  paintTile(ctx, 2, 1, (c, x, y) => fillNoiseTile(c, x, y, ["#565656", "#464646"], 1303, 0.24));
  paintTile(ctx, 3, 1, drawWater);
  paintTile(ctx, 4, 1, drawTorch);
  paintTile(ctx, 5, 1, (c, x, y) => fillNoiseTile(c, x, y, ["#7e8288", "#6f7378"], 1305, 0.24));
  paintTile(ctx, 6, 1, drawGlass);
  paintTile(ctx, 7, 1, (c, x, y) => drawHorizontalPlanks(c, x, y, "#8a6641", "#63472d", 1307));

  paintTile(ctx, 0, 2, (c, x, y) => drawBricks(c, x, y, "#8a9097", "#6c7278", 1401));
  paintTile(ctx, 1, 2, (c, x, y) => fillNoiseTile(c, x, y, ["#8f8882", "#7f7872"], 1402, 0.24));
  paintTile(ctx, 2, 2, (c, x, y) => fillNoiseTile(c, x, y, ["#ecf4fb", "#dce7f2"], 1403, 0.1));
  paintTile(ctx, 3, 2, (c, x, y) => fillNoiseTile(c, x, y, ["#9ca7bf", "#8f9ab2"], 1404, 0.14));
  paintTile(ctx, 4, 2, drawBookshelf);
  paintTile(ctx, 5, 2, (c, x, y) => drawHorizontalPlanks(c, x, y, "#a77f4f", "#7d5f3a", 1406));
  paintTile(ctx, 6, 2, (c, x, y) => fillNoiseTile(c, x, y, ["#392f63", "#281d45"], 1407, 0.18));

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
