// client/src/components/VoiceAnalyzer.jsx

import { useEffect, useRef } from "react";

export default function VoiceAnalyzer({ stream, onVoiceScore }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const lastEnergyRef = useRef(0);
  const instabilityRef = useRef(0);

  const silenceFramesRef = useRef(0);
  const totalFramesRef = useRef(0);

  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    // Reset metrics for new recording
    lastEnergyRef.current = 0;
    instabilityRef.current = 0;
    silenceFramesRef.current = 0;
    totalFramesRef.current = 0;

    const audioContext =
      new (window.AudioContext || window.webkitAudioContext)();

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    function analyze() {
      analyser.getByteFrequencyData(dataArray);

      // 🔹 Compute average energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }

      const energy = sum / bufferLength;

      // 🔹 Detect silence (pause proxy)
      if (energy < 20) {
        silenceFramesRef.current += 1;
      }

      totalFramesRef.current += 1;

      // 🔹 Measure instability (voice tremor)
      const diff = Math.abs(energy - lastEnergyRef.current);
      instabilityRef.current += diff;
      lastEnergyRef.current = energy;

      // 🔹 Pause ratio
      const pauseRatio =
        silenceFramesRef.current / totalFramesRef.current;

      // 🔹 Tremor score
      const tremorScore = Math.max(
        0,
        1 - instabilityRef.current / 4000
      );

      // 🔹 Final voice confidence
      const voiceScore =
        tremorScore * 0.7 + (1 - pauseRatio) * 0.3;

      if (onVoiceScore) {
        onVoiceScore(voiceScore);
      }

      animationRef.current = requestAnimationFrame(analyze);
    }

    analyze();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, onVoiceScore]);

  return null;
}
