import React, { useEffect } from "react";

export default function PostureAnalyzer({ videoRef, onScoreUpdate }) {

  useEffect(() => {
    if (!videoRef?.current) return;

    // Load MediaPipe script dynamically
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
    script.async = true;

    script.onload = () => {
      const faceMesh = new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks) return;

        const landmarks = results.multiFaceLandmarks[0];

        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const nose = landmarks[1];

        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const gazeOffset = Math.abs(nose.x - eyeCenterX);

        const eyeScore = 1 - Math.min(gazeOffset * 3, 1);

        onScoreUpdate(eyeScore);
      });

      const interval = setInterval(async () => {
        if (videoRef.current.readyState >= 2) {
          await faceMesh.send({ image: videoRef.current });
        }
      }, 100);

      return () => clearInterval(interval);
    };

    document.body.appendChild(script);
  }, [videoRef, onScoreUpdate]);

  return null;
}