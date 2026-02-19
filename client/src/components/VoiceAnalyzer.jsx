// client/src/components/VoiceAnalyzer.jsx

import React, { useEffect, useRef } from "react";

export default function VoiceAnalyzer({ stream, onVoiceScore }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const lastEnergyRef = useRef(0);
  const instabilityRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

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

      // 🔹 Measure instability (voice tremor)
      const diff = Math.abs(energy - lastEnergyRef.current);
      instabilityRef.current += diff;

      lastEnergyRef.current = energy;

      // 🔹 Normalize tremor score (0–1 range)
      const tremorScore = Math.max(
        0,
        1 - instabilityRef.current / 5000
      );

      if (onVoiceScore) {
        onVoiceScore(tremorScore);
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