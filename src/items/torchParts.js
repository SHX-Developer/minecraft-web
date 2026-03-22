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
      part(0.0, 0.34, 0.46, 0.12, 0.46, 0.54, "torch_stick"),
      part(0.1, 0.4, 0.46, 0.56, 0.52, 0.54, "torch_stick"),
      part(0.5, 0.44, 0.4, 0.68, 0.64, 0.6, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_EAST) {
    return [
      part(0.88, 0.34, 0.46, 1.0, 0.46, 0.54, "torch_stick"),
      part(0.44, 0.4, 0.46, 0.9, 0.52, 0.54, "torch_stick"),
      part(0.32, 0.44, 0.4, 0.5, 0.64, 0.6, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_NORTH) {
    return [
      part(0.46, 0.34, 0.0, 0.54, 0.46, 0.12, "torch_stick"),
      part(0.46, 0.4, 0.1, 0.54, 0.52, 0.56, "torch_stick"),
      part(0.4, 0.44, 0.5, 0.6, 0.64, 0.68, "torch_head"),
    ];
  }
  if (blockId === BLOCK.TORCH_SOUTH) {
    return [
      part(0.46, 0.34, 0.88, 0.54, 0.46, 1.0, "torch_stick"),
      part(0.46, 0.4, 0.44, 0.54, 0.52, 0.9, "torch_stick"),
      part(0.4, 0.44, 0.32, 0.6, 0.64, 0.5, "torch_head"),
    ];
  }

  return [
    part(0.46, 0.08, 0.46, 0.54, 0.78, 0.54, "torch_stick"),
    part(0.4, 0.78, 0.4, 0.6, 0.96, 0.6, "torch_head"),
  ];
}
