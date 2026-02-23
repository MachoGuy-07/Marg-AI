// client/src/components/PostureAnalyzer.jsx

import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function PostureAnalyzer({ videoRef, onScoreUpdate }) {

  const intervalRef = useRef(null);
  const meshRef = useRef(null);

  const faceFrames = useRef(0);
  const totalFrames = useRef(0);
  const headMovement = useRef(0);
  const lastNose = useRef(null);

  useEffect(() => {

    if (!videoRef?.current) return;

    let isMounted = true;

    const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
});

    meshRef.current = faceMesh;

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {

      if (!isMounted) return;

      totalFrames.current++;

      if (!results.multiFaceLandmarks) return;

      faceFrames.current++;

      const landmarks = results.multiFaceLandmarks[0];

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const nose = landmarks[1];

      const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

      const leftMouth = landmarks[61];
      const rightMouth = landmarks[291];
      const mouthWidth = Math.abs(leftMouth.x - rightMouth.x) / faceWidth;

      let emotion = "Neutral";
      if (mouthWidth > 0.39) emotion = "Smile";

      const eyeCenterX = (leftEye.x + rightEye.x) / 2;
      const gazeOffset = Math.abs(nose.x - eyeCenterX);
      const eyeScore = 1 - Math.min(gazeOffset * 3, 1);

      if (lastNose.current) {
        const dx = nose.x - lastNose.current.x;
        const dy = nose.y - lastNose.current.y;
        headMovement.current += Math.sqrt(dx * dx + dy * dy);
      }

      lastNose.current = nose;

      const engagement = faceFrames.current / totalFrames.current;
      const stability = Math.max(0, 1 - headMovement.current * 5);

      const postureScore =
        eyeScore * 0.4 +
        engagement * 0.3 +
        stability * 0.3;

      onScoreUpdate?.(postureScore, emotion);
    });

    intervalRef.current = setInterval(async () => {

      try {

        if (
          videoRef.current &&
          videoRef.current.readyState >= 2 &&
          meshRef.current
        ) {
          await meshRef.current.send({ image: videoRef.current });
        }

      } catch (err) {
        console.error("FaceMesh send error:", err);
      }

    }, 120);

    return () => {

      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (meshRef.current) {
        meshRef.current.close();
        meshRef.current = null;
      }
    };

  }, [videoRef, onScoreUpdate]);

  return null;
}