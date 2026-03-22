export class SfxManager {
  constructor({ masterVolume, breakVolume, footstepVolume }) {
    this.masterVolume = masterVolume;
    this.breakVolume = breakVolume;
    this.footstepVolume = footstepVolume;

    this.audioContext = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.unlocked = false;
    this.stepTimer = 0;
  }

  unlockFromUserGesture() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      this.audioContext = new AudioCtx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.unlocked = true;
  }

  updateFootsteps(delta, movement) {
    if (!this.unlocked || !this.audioContext || !movement.active) {
      return;
    }

    const moving = movement.horizontalSpeed > 0.1 && (movement.onGround || movement.inWater);
    if (!moving) {
      this.stepTimer = 0;
      return;
    }

    let interval = 0.46;
    if (movement.inWater) {
      interval = 0.52;
    } else if (movement.isSprinting) {
      interval = 0.29;
    } else if (movement.isCrouching) {
      interval = 0.66;
    }

    this.stepTimer += delta;
    if (this.stepTimer < interval) {
      return;
    }

    this.stepTimer = 0;
    this.playFootstep(movement.inWater);
  }

  playBlockBreak() {
    if (!this.unlocked || !this.audioContext) {
      return;
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(260, now);
    noiseFilter.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(this.breakVolume * 0.22, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    const click = ctx.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(220 + Math.random() * 120, now);
    click.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.001, now);
    clickGain.gain.linearRampToValueAtTime(this.breakVolume * 0.18, now + 0.006);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);
    click.connect(clickGain).connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.14);
    click.start(now);
    click.stop(now + 0.14);
  }

  playFootstep(inWater) {
    if (!this.unlocked || !this.audioContext) {
      return;
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(inWater ? 110 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(inWater ? 70 : 95, now + 0.1);

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, now);
    toneGain.gain.linearRampToValueAtTime(this.footstepVolume * (inWater ? 0.12 : 0.18), now + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = inWater ? "lowpass" : "bandpass";
    noiseFilter.frequency.setValueAtTime(inWater ? 420 : 900, now);
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(this.footstepVolume * (inWater ? 0.08 : 0.1), now + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(toneGain).connect(this.masterGain);
    noise.connect(noiseFilter).connect(noiseGain).connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  getNoiseBuffer() {
    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const ctx = this.audioContext;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.9;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  destroy() {
    if (!this.audioContext) {
      return;
    }
    this.audioContext.close();
    this.audioContext = null;
  }
}
