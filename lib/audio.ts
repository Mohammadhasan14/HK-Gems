/** Quiet filtered ambience, started only by the visitor's Sound control. */
export const audio = { enabled: false };
let context: AudioContext | undefined;
let gain: GainNode | undefined;

export async function setAmbientSound(enabled: boolean) {
  if (enabled && !context) {
    context = new AudioContext();
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < samples.length; i++) {
      last = (last + (Math.random() * 2 - 1) * .025) / 1.025;
      samples[i] = last;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 360;
    gain = context.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  }
  if (context && gain) {
    if (enabled) await context.resume();
    gain.gain.setTargetAtTime(enabled ? .24 : 0, context.currentTime, .3);
  }
  audio.enabled = enabled;
}
