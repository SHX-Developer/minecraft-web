import { BLOCK } from "./blockTypes.js";
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, CHUNK_VOLUME } from "../utils/constants.js";

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_VOLUME);
  }

  index(x, y, z) {
    return x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
  }

  inBounds(x, y, z) {
    return (
      x >= 0 &&
      x < CHUNK_SIZE_X &&
      y >= 0 &&
      y < CHUNK_SIZE_Y &&
      z >= 0 &&
      z < CHUNK_SIZE_Z
    );
  }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) {
      return BLOCK.AIR;
    }
    return this.blocks[this.index(x, y, z)];
  }

  set(x, y, z, id) {
    if (!this.inBounds(x, y, z)) {
      return false;
    }
    const idx = this.index(x, y, z);
    if (this.blocks[idx] === id) {
      return false;
    }
    this.blocks[idx] = id;
    return true;
  }
}
