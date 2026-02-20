// client/src/components/PostureAnalyzer.jsx

import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function PostureAnalyzer({ videoRef, onScoreUpdate }) {
  const intervalRef = useRef(null);

  const faceFrames = useRef(0);
  const totalFrames = useRef(0);
  const headMovement = useRef(0);
  const lastNose = useRef(null);

  useEffect(() => {
    if (!videoRef?.current) return;

    const faceMesh = new FaceMesh({
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
      totalFrames.current++;

      if (!results.multiFaceLandmarks) return;

      faceFrames.current++;

      const landmarks = results.multiFaceLandmarks[0];

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const nose = landmarks[1];

      // ⭐ FACE WIDTH NORMALIZATION
      const faceWidth = Math.abs(landmarks[234].x - landmarks[454].x);

      // ⭐ MOUTH WIDTH (CHEEK RISE SMILE DETECTOR)
      const leftMouth = landmarks[61];
      const rightMouth = landmarks[291];
      const mouthWidth = Math.abs(leftMouth.x - rightMouth.x) / faceWidth;

      console.log("MouthWidth:", mouthWidth.toFixed(3));

      // ⭐ SMILE LOGIC (PERSONALIZED)
      let emotion = "Neutral";
      if (mouthWidth > 0.39) emotion = "Smile";

      // ⭐ EYE CONTACT SCORE
      const eyeCenterX = (leftEye.x + rightEye.x) / 2;
      const gazeOffset = Math.abs(nose.x - eyeCenterX);
      const eyeScore = 1 - Math.min(gazeOffset * 3, 1);

      // ⭐ HEAD MOVEMENT
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
      if (videoRef.current.readyState >= 2) {
        await faceMesh.send({ image: videoRef.current });
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [videoRef, onScoreUpdate]);

  return null;
}