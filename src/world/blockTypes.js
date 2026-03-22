import { ATLAS_COLUMNS, ATLAS_ROWS } from "../utils/constants.js";

export const BLOCK = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  PLANKS: 4,
  LOG: 5,
  LEAVES: 6,
  SAND: 7,
  BRICK: 8,
  BEDROCK: 9,
  WATER: 10,
});

const TILE_BY_NAME = Object.freeze({
  grass_top: { x: 0, y: 0 },
  grass_side: { x: 1, y: 0 },
  dirt: { x: 2, y: 0 },
  stone: { x: 3, y: 0 },
  planks: { x: 0, y: 1 },
  log_side: { x: 1, y: 1 },
  log_top: { x: 2, y: 1 },
  leaves: { x: 3, y: 1 },
  sand: { x: 0, y: 2 },
  brick: { x: 1, y: 2 },
  bedrock: { x: 2, y: 2 },
  water: { x: 3, y: 2 },
});

const BLOCK_DEFS = Object.freeze({
  [BLOCK.AIR]: {
    id: BLOCK.AIR,
    name: "air",
    displayName: "air",
    solid: false,
    transparent: true,
    render: false,
    breakable: false,
    replaceable: true,
    uiColor: "#000000",
    textures: { all: "dirt" },
  },
  [BLOCK.GRASS]: {
    id: BLOCK.GRASS,
    name: "grass",
    displayName: "grass",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#66b149",
    textures: { top: "grass_top", bottom: "dirt", side: "grass_side" },
  },
  [BLOCK.DIRT]: {
    id: BLOCK.DIRT,
    name: "dirt",
    displayName: "dirt",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#7e4c25",
    textures: { all: "dirt" },
  },
  [BLOCK.STONE]: {
    id: BLOCK.STONE,
    name: "stone",
    displayName: "stone",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#868686",
    textures: { all: "stone" },
  },
  [BLOCK.PLANKS]: {
    id: BLOCK.PLANKS,
    name: "planks",
    displayName: "planks",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#bd9151",
    textures: { all: "planks" },
  },
  [BLOCK.LOG]: {
    id: BLOCK.LOG,
    name: "log",
    displayName: "log",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#8b653f",
    textures: { top: "log_top", bottom: "log_top", side: "log_side" },
  },
  [BLOCK.LEAVES]: {
    id: BLOCK.LEAVES,
    name: "leaves",
    displayName: "leaves",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#4f8b43",
    textures: { all: "leaves" },
  },
  [BLOCK.SAND]: {
    id: BLOCK.SAND,
    name: "sand",
    displayName: "sand",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#ddca84",
    textures: { all: "sand" },
  },
  [BLOCK.BRICK]: {
    id: BLOCK.BRICK,
    name: "brick",
    displayName: "brick",
    solid: true,
    transparent: false,
    render: true,
    breakable: true,
    replaceable: false,
    uiColor: "#9e5342",
    textures: { all: "brick" },
  },
  [BLOCK.BEDROCK]: {
    id: BLOCK.BEDROCK,
    name: "bedrock",
    displayName: "bedrock",
    solid: true,
    transparent: false,
    render: true,
    breakable: false,
    replaceable: false,
    uiColor: "#545454",
    textures: { all: "bedrock" },
  },
  [BLOCK.WATER]: {
    id: BLOCK.WATER,
    name: "water",
    displayName: "water",
    solid: false,
    transparent: true,
    render: true,
    breakable: false,
    replaceable: true,
    uiColor: "#4f83d8",
    textures: { all: "water" },
  },
});

export function getBlockType(id) {
  return BLOCK_DEFS[id] || BLOCK_DEFS[BLOCK.AIR];
}

export function getBlockDisplayName(id) {
  return getBlockType(id).displayName;
}

export function isBlockSolid(id) {
  return getBlockType(id).solid;
}

export function isBlockTransparent(id) {
  return getBlockType(id).transparent;
}

export function isBlockRenderable(id) {
  return getBlockType(id).render;
}

export function isBlockBreakable(id) {
  return getBlockType(id).breakable;
}

export function isBlockReplaceable(id) {
  return getBlockType(id).replaceable;
}

export function getHotbarColor(id) {
  return getBlockType(id).uiColor;
}

export function getFaceTile(id, faceName) {
  const def = getBlockType(id);
  const textures = def.textures;
  if (typeof textures === "string") {
    return TILE_BY_NAME[textures] || TILE_BY_NAME.dirt;
  }
  const textureName = textures[faceName] || textures.side || textures.all || "dirt";
  return TILE_BY_NAME[textureName] || TILE_BY_NAME.dirt;
}

export function getAtlasUV(tile) {
  const uStep = 1 / ATLAS_COLUMNS;
  const vStep = 1 / ATLAS_ROWS;

  // Small inset prevents texture bleeding at tile borders.
  const insetU = uStep * 0.02;
  const insetV = vStep * 0.02;

  const u0 = tile.x * uStep + insetU;
  const v0 = 1 - (tile.y + 1) * vStep + insetV;
  const u1 = (tile.x + 1) * uStep - insetU;
  const v1 = 1 - tile.y * vStep - insetV;

  return { u0, v0, u1, v1 };
}
