export class FallDamageSystem {
  constructor(playerController, playerHealth, gameModeManager) {
    this.playerController = playerController;
    this.playerHealth = playerHealth;
    this.gameModeManager = gameModeManager;

    this.fallStartY = null;
    this.wasFalling = false;
    this.wasInWater = false;
  }

  update() {
    const player = this.playerController.player;

    if (!this.gameModeManager.hasFallDamage()) {
      this.fallStartY = null;
      this.wasFalling = false;
      return;
    }

    if (player.isFlying) {
      this.fallStartY = null;
      this.wasFalling = false;
      return;
    }

    if (player.inWater) {
      this.fallStartY = null;
      this.wasFalling = false;
      this.wasInWater = true;
      return;
    }

    const isFalling = player.velocity.y < -0.5 && !player.onGround;

    if (isFalling && !this.wasFalling) {
      this.fallStartY = player.position.y;
      this.wasInWater = false;
    }

    if (player.onGround && this.wasFalling && this.fallStartY !== null) {
      if (!this.wasInWater) {
        const fallDistance = this.fallStartY - player.position.y;
        if (fallDistance >= 4) {
          const damage = Math.floor(fallDistance - 3);
          this.playerHealth.takeDamage(damage);
        }
      }
      this.fallStartY = null;
    }

    this.wasFalling = isFalling;
  }
}
