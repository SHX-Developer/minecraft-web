import { BLOCK } from "../world/blockTypes.js";

function part(minX, minY, minZ, maxX, maxY, maxZ, tile) {
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    tile,
  };
}

export function getTorchParts(blockId = BLOCK.TORCH) {
  if (blockId === BLOCK.TORCH_WEST) {
    return [
      part(0.0, 0.45, 0.44, 0.1, 0.58, 0.56, "planks"),
      part(0.1, 0.4, 0.46, 0.36, 0.52, 0.54, "planks"),
      part(0.26, 0.5, 0.46, 0.54, 0.62, 0.54, "planks"),
      part(0.44, 0.56, 0.38, 0.64, 0.76, 0.62, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_EAST) {
    return [
      part(0.9, 0.45, 0.44, 1.0, 0.58, 0.56, "planks"),
      part(0.64, 0.4, 0.46, 0.9, 0.52, 0.54, "planks"),
      part(0.46, 0.5, 0.46, 0.74, 0.62, 0.54, "planks"),
      part(0.36, 0.56, 0.38, 0.56, 0.76, 0.62, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_NORTH) {
    return [
      part(0.44, 0.45, 0.0, 0.56, 0.58, 0.1, "planks"),
      part(0.46, 0.4, 0.1, 0.54, 0.52, 0.36, "planks"),
      part(0.46, 0.5, 0.26, 0.54, 0.62, 0.54, "planks"),
      part(0.38, 0.56, 0.44, 0.62, 0.76, 0.64, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_SOUTH) {
    return [
      part(0.44, 0.45, 0.9, 0.56, 0.58, 1.0, "planks"),
      part(0.46, 0.4, 0.64, 0.54, 0.52, 0.9, "planks"),
      part(0.46, 0.5, 0.46, 0.54, 0.62, 0.74, "planks"),
      part(0.38, 0.56, 0.36, 0.62, 0.76, 0.56, "torch_head"),
    ];
  }

  return [
    part(0.45, 0.04, 0.45, 0.55, 0.78, 0.55, "planks"),
    part(0.39, 0.78, 0.39, 0.61, 0.96, 0.61, "torch_head"),
  ];
}
