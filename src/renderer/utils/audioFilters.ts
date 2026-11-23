import type { EqPreset } from '../stores/playerStore';

interface EqNodeBundle {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;
}

const nodeMap = new WeakMap<HTMLAudioElement, EqNodeBundle>();

/**
 * Connects an HTMLAudioElement to a 3-band Web Audio EQ filter chain
 * and applies the requested EQ preset.
 */
export function applyEqPreset(audioEl: HTMLAudioElement | null, preset: EqPreset): void {
  if (!audioEl) return;

  try {
    let bundle = nodeMap.get(audioEl);

    if (!bundle) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioEl);

      // Low Shelf (Bass / Warmth)
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.value = 250;
      lowFilter.gain.value = 0;

      // Peaking (Vocal Clarity / Speech intelligibility)
      const midFilter = ctx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 3000;
      midFilter.Q.value = 1.0;
      midFilter.gain.value = 0;

      // High Shelf (De-hiss / Air)
      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.value = 6000;
      highFilter.gain.value = 0;

      // Connect source -> low -> mid -> high -> destination
      source.connect(lowFilter);
      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(ctx.destination);

      bundle = { ctx, source, lowFilter, midFilter, highFilter };
      nodeMap.set(audioEl, bundle);
    }

    if (bundle.ctx.state === 'suspended') {
      bundle.ctx.resume().catch(console.error);
    }

    const { lowFilter, midFilter, highFilter } = bundle;
    const now = bundle.ctx.currentTime;

    switch (preset) {
      case 'clarity':
        // Reduce low rumble/mud, enhance vocal clarity frequencies
        lowFilter.gain.setValueAtTime(-3.5, now);
        midFilter.gain.setValueAtTime(4.5, now);
        highFilter.gain.setValueAtTime(2.0, now);
        break;

      case 'cassette':
        // Old tape recording enhancement: reduce high tape hiss, add slight warm low body
        lowFilter.gain.setValueAtTime(2.0, now);
        midFilter.gain.setValueAtTime(1.0, now);
        highFilter.gain.setValueAtTime(-7.0, now);
        break;

      case 'bass':
        // Rich vocal warmth / nasheed depth
        lowFilter.gain.setValueAtTime(5.5, now);
        midFilter.gain.setValueAtTime(-1.0, now);
        highFilter.gain.setValueAtTime(-1.5, now);
        break;

      case 'normal':
      default:
        // Flat transparent bypass
        lowFilter.gain.setValueAtTime(0, now);
        midFilter.gain.setValueAtTime(0, now);
        highFilter.gain.setValueAtTime(0, now);
        break;
    }
  } catch (err) {
    console.warn('Audio EQ filter processing not available or already connected:', err);
  }
}
