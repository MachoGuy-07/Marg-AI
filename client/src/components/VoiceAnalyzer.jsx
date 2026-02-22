import { useEffect, useRef } from "react";

export default function VoiceAnalyzer({ stream, onVoiceScore, onMetrics }) {
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);

  const lastEnergyRef = useRef(0);
  const instabilityRef = useRef(0);
  const silenceFramesRef = useRef(0);
  const totalFramesRef = useRef(0);
  const silenceRunRef = useRef(0);
  const pauseCountRef = useRef(0);
  const inPauseRef = useRef(false);
  const frameCounterRef = useRef(0);

  useEffect(() => {
    if (!stream) return;

    lastEnergyRef.current = 0;
    instabilityRef.current = 0;
    silenceFramesRef.current = 0;
    totalFramesRef.current = 0;
    silenceRunRef.current = 0;
    pauseCountRef.current = 0;
    inPauseRef.current = false;
    frameCounterRef.current = 0;

    const audioContext =
      new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const timeData = new Uint8Array(analyser.fftSize);

    audioContextRef.current = audioContext;

    const SILENCE_ENERGY = 16;
    const SILENCE_RMS = 0.018;
    const PAUSE_MIN_FRAMES = 10;

    function analyze() {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      let freqSum = 0;
      for (let i = 0; i < freqData.length; i += 1) {
        freqSum += freqData[i];
      }
      const energy = freqSum / Math.max(1, freqData.length);

      let rmsAccumulator = 0;
      for (let i = 0; i < timeData.length; i += 1) {
        const centered = (timeData[i] - 128) / 128;
        rmsAccumulator += centered * centered;
      }
      const rms = Math.sqrt(rmsAccumulator / Math.max(1, timeData.length));

      totalFramesRef.current += 1;
      frameCounterRef.current += 1;

      const isSilence = energy < SILENCE_ENERGY || rms < SILENCE_RMS;
      if (isSilence) {
        silenceFramesRef.current += 1;
        silenceRunRef.current += 1;

        if (!inPauseRef.current && silenceRunRef.current >= PAUSE_MIN_FRAMES) {
          pauseCountRef.current += 1;
          inPauseRef.current = true;
        }
      } else {
        silenceRunRef.current = 0;
        inPauseRef.current = false;
      }

      const delta = Math.abs(energy - lastEnergyRef.current);
      instabilityRef.current += delta;
      lastEnergyRef.current = energy;

      const pauseRatio =
        silenceFramesRef.current / Math.max(1, totalFramesRef.current);
      const stability = clamp01(
        1 - instabilityRef.current / (totalFramesRef.current * 18 + 120)
      );
      const voiceScore = clamp01(stability * 0.65 + (1 - pauseRatio) * 0.35);

      onVoiceScore?.(voiceScore);

      let weighted = 0;
      let total = 0;
      for (let i = 0; i < freqData.length; i += 1) {
        const amp = freqData[i];
        weighted += i * amp;
        total += amp;
      }

      const nyquist = audioContext.sampleRate / 2;
      const centroidHz =
        total > 0 ? (weighted / total) * (nyquist / freqData.length) : 0;

      let tone = "Neutral";
      if (centroidHz > 2100 && rms > SILENCE_RMS) tone = "Energetic";
      else if (centroidHz < 1200 && rms > SILENCE_RMS) tone = "Calm";
      if (pauseRatio > 0.62) tone = "Flat";

      if (frameCounterRef.current % 6 === 0) {
        onMetrics?.({
          voiceScore,
          pauseCount: pauseCountRef.current,
          pauseRatio,
          stability,
          energy: Math.round(energy),
          rms,
          centroidHz: Math.round(centroidHz),
          tone,
        });
      }

      animationRef.current = requestAnimationFrame(analyze);
    }

    analyze();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, onMetrics, onVoiceScore]);

  return null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
