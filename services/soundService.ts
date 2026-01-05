
class SoundService {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playShoot() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx!.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  playExplosion() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  playBaseDamage() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx!.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.5);
  }

  playUpgrade() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx!.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.2);
  }

  playClick() {
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.frequency.setValueAtTime(1200, this.ctx!.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.05);
  }

  startMusic() {
    this.init();
    if (this.musicInterval) return;

    // Более быстрая и насыщенная версия "Коробейников"
    const melody = [
      { f: 659.25, d: 0.3 }, { f: 493.88, d: 0.15 }, { f: 523.25, d: 0.15 }, { f: 587.33, d: 0.3 }, { f: 523.25, d: 0.15 }, { f: 493.88, d: 0.15 },
      { f: 440.00, d: 0.3 }, { f: 440.00, d: 0.15 }, { f: 523.25, d: 0.15 }, { f: 659.25, d: 0.3 }, { f: 587.33, d: 0.15 }, { f: 523.25, d: 0.15 },
      { f: 493.88, d: 0.45 }, { f: 523.25, d: 0.15 }, { f: 587.33, d: 0.3 }, { f: 659.25, d: 0.3 },
      { f: 523.25, d: 0.3 }, { f: 440.00, d: 0.3 }, { f: 440.00, d: 0.6 },
    ];

    const bass = [
      { f: 164.81, d: 0.3 }, { f: 164.81, d: 0.3 }, { f: 123.47, d: 0.3 }, { f: 123.47, d: 0.3 },
      { f: 110.00, d: 0.3 }, { f: 110.00, d: 0.3 }, { f: 164.81, d: 0.3 }, { f: 164.81, d: 0.3 },
    ];

    let noteIndex = 0;
    let bassIndex = 0;

    const playLoop = () => {
      // Канал мелодии
      const note = melody[noteIndex];
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + note.d * 0.9);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start();
      osc.stop(this.ctx!.currentTime + note.d);

      // Канал баса (каждые 0.3 сек)
      if (noteIndex % 2 === 0) {
        const b = bass[bassIndex];
        const bOsc = this.ctx!.createOscillator();
        const bGain = this.ctx!.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(b.f, this.ctx!.currentTime);
        bGain.gain.setValueAtTime(0.08, this.ctx!.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.3);
        bOsc.connect(bGain);
        bGain.connect(this.ctx!.destination);
        bOsc.start();
        bOsc.stop(this.ctx!.currentTime + 0.3);
        bassIndex = (bassIndex + 1) % bass.length;
      }

      // Канал перкуссии (белый шум)
      if (noteIndex % 4 === 0) {
        const bufferSize = this.ctx!.sampleRate * 0.05;
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx!.createGain();
        noiseGain.gain.setValueAtTime(0.015, this.ctx!.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.05);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx!.destination);
        noise.start();
      }

      this.musicInterval = window.setTimeout(() => {
        noteIndex = (noteIndex + 1) % melody.length;
        playLoop();
      }, note.d * 1000);
    };

    playLoop();
  }

  stopMusic() {
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundService();
