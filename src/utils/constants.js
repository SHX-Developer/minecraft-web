export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 48;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

export const WORLD_SEED = 1337;
export const WORLD_RENDER_RADIUS = 3;
export const WORLD_UNLOAD_RADIUS = WORLD_RENDER_RADIUS + 1;
export const WATER_LEVEL = 12;

export const ATLAS_COLUMNS = 4;
export const ATLAS_ROWS = 4;
export const HOTBAR_BLOCK_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const PLAYER_STAND_HEIGHT = 1.8;
export const PLAYER_CROUCH_HEIGHT = 1.5;
export const PLAYER_STAND_EYE_HEIGHT = 1.62;
export const PLAYER_CROUCH_EYE_HEIGHT = 1.32;
export const PLAYER_RADIUS = 0.35;
export const PLAYER_MOVE_SPEED = 4.8;
export const PLAYER_CROUCH_SPEED = 2.35;
export const PLAYER_SPRINT_SPEED = 7.8;
export const PLAYER_JUMP_SPEED = 7.4;
export const PLAYER_GRAVITY = 24.0;
export const PLAYER_MAX_FALL_SPEED = 32.0;
export const PLAYER_SWIM_SPEED = 2.8;
export const PLAYER_SWIM_UP_SPEED = 3.8;
export const PLAYER_SWIM_DOWN_SPEED = 2.4;
export const PLAYER_WATER_GRAVITY = 4.8;
export const PLAYER_WATER_DRAG = 3.2;
export const SPRINT_DOUBLE_TAP_WINDOW = 0.3;
export const MOUSE_SENSITIVITY = 0.0022;

export const CAMERA_FOV = 75;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 300;

export const SKY_COLOR = 0x8cc9ff;
export const FOG_NEAR = 35;
export const FOG_FAR = 180;
export const DAY_DURATION_SECONDS = 120;
export const NIGHT_DURATION_SECONDS = 120;

export const MAX_RAY_DISTANCE = 6;
export const MAX_DELTA_TIME = 0.05;

export const MUSIC_VOLUME = 0.35;
export const MUSIC_TRACKS = [
  "./assets/audio/13. Aria Math.mp3",
  "./assets/audio/track1.mp3",
  "./assets/audio/track2.mp3",
];
export const SFX_MASTER_VOLUME = 0.5;
export const SFX_BREAK_VOLUME = 0.5;
export const SFX_FOOTSTEP_VOLUME = 0.4;
