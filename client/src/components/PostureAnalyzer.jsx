// client/src/components/PostureAnalyzer.jsx

import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function PostureAnalyzer({ videoRef, onScoreUpdate }) {
  const faceMeshRef = useRef(null);
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

      if (results.multiFaceLandmarks) {
        faceFrames.current++;

        const landmarks = results.multiFaceLandmarks[0];

        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const nose = landmarks[1];

        // ⭐ EMOTION DETECTION
        let emotion = "Neutral";
        const eyeHeight = Math.abs(leftEye.y - rightEye.y);

        if (eyeHeight < 0.01) emotion = "Nervous";
        else if (eyeHeight > 0.03) emotion = "Confident";

        // ⭐ EYE CONTACT
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

        // ⭐ SEND BOTH SCORE + EMOTION
        onScoreUpdate?.(postureScore, emotion);
      }
    });

    faceMeshRef.current = faceMesh;

    intervalRef.current = setInterval(async () => {
      if (videoRef.current.readyState >= 2) {
        await faceMesh.send({ image: videoRef.current });
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [videoRef, onScoreUpdate]);

  return null;
}