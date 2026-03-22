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
      part(0.03, 0.2, 0.44, 0.15, 0.45, 0.56, "torch_stick"),
      part(0.14, 0.45, 0.44, 0.27, 0.7, 0.56, "torch_stick"),
      part(0.24, 0.7, 0.4, 0.4, 0.9, 0.6, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_EAST) {
    return [
      part(0.85, 0.2, 0.44, 0.97, 0.45, 0.56, "torch_stick"),
      part(0.73, 0.45, 0.44, 0.86, 0.7, 0.56, "torch_stick"),
      part(0.6, 0.7, 0.4, 0.76, 0.9, 0.6, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_NORTH) {
    return [
      part(0.44, 0.2, 0.03, 0.56, 0.45, 0.15, "torch_stick"),
      part(0.44, 0.45, 0.14, 0.56, 0.7, 0.27, "torch_stick"),
      part(0.4, 0.7, 0.24, 0.6, 0.9, 0.4, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_SOUTH) {
    return [
      part(0.44, 0.2, 0.85, 0.56, 0.45, 0.97, "torch_stick"),
      part(0.44, 0.45, 0.73, 0.56, 0.7, 0.86, "torch_stick"),
      part(0.4, 0.7, 0.6, 0.6, 0.9, 0.76, "torch_head"),
    ];
  }

  return [
    part(0.44, 0.08, 0.44, 0.56, 0.72, 0.56, "torch_stick"),
    part(0.39, 0.72, 0.39, 0.61, 0.9, 0.61, "torch_head"),
  ];
}

