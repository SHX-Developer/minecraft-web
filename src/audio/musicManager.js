export class MusicManager {
  constructor({ tracks, volume }) {
    this.playlist = tracks.filter((track) => typeof track === "string" && track.trim().length > 0);
    this.volume = volume;
    this.started = false;
    this.currentIndex = 0;
    this.failedStreak = 0;

    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.preload = "auto";
    this.audio.volume = this.volume;
    this.audio.addEventListener("ended", () => {
      this.failedStreak = 0;
      this.playNext();
    });
    this.audio.addEventListener("error", () => {
      this.handleTrackError();
    });
  }

  startFromUserGesture() {
    if (this.started || this.playlist.length === 0) {
      return;
    }
    this.started = true;
    this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    this.playCurrent();
  }

  async playCurrent() {
    if (this.playlist.length === 0) {
      return;
    }

    const track = this.playlist[this.currentIndex];
    this.audio.src = track;
    this.audio.volume = this.volume;

    try {
      await this.audio.play();
      this.failedStreak = 0;
    } catch (_error) {
      // If autoplay is still blocked, next user gesture can call startFromUserGesture again.
      this.started = false;
    }
  }

  async playNext() {
    if (this.playlist.length === 0) {
      return;
    }
    if (this.playlist.length === 1) {
      this.currentIndex = 0;
    } else {
      let nextIndex = this.currentIndex;
      while (nextIndex === this.currentIndex) {
        nextIndex = Math.floor(Math.random() * this.playlist.length);
      }
      this.currentIndex = nextIndex;
    }
    await this.playCurrent();
  }

  async handleTrackError() {
    if (this.playlist.length === 0) {
      this.started = false;
      return;
    }

    this.failedStreak += 1;
    if (this.failedStreak >= this.playlist.length) {
      // Stop trying when every configured track fails.
      this.started = false;
      this.audio.pause();
      return;
    }
    await this.playNext();
  }

  setVolume(volume) {
    this.volume = volume;
    this.audio.volume = volume;
  }

  destroy() {
    this.audio.pause();
    this.audio.src = "";
  }
}
