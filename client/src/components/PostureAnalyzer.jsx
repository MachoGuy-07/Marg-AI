import { useEffect } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function PostureAnalyzer({ videoRef, onScoreUpdate }) {
  useEffect(() => {
    if (!videoRef?.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        require("@mediapipe/face_mesh/" + file),
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks) return;

      const landmarks = results.multiFaceLandmarks[0];

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const noseTip = landmarks[1];

      const eyeCenterX = (leftEye.x + rightEye.x) / 2;
      const gazeOffset = Math.abs(noseTip.x - eyeCenterX);
      const eyeContactScore = 1 - Math.min(gazeOffset * 3, 1);

      const tilt = Math.abs(leftEye.y - rightEye.y);
      const headTiltScore = 1 - Math.min(tilt * 5, 1);

      const jaw = landmarks[152];
      const chinMovement = Math.abs(jaw.x - noseTip.x);
      const movementScore = 1 - Math.min(chinMovement * 2, 1);

      const finalScore =
        eyeContactScore * 0.5 +
        headTiltScore * 0.3 +
        movementScore * 0.2;

      onScoreUpdate(finalScore);
    });

    let animationFrame;

    const analyze = async () => {
      if (videoRef.current?.readyState === 4) {
        await faceMesh.send({ image: videoRef.current });
      }
      animationFrame = requestAnimationFrame(analyze);
    };

    analyze();

    return () => cancelAnimationFrame(animationFrame);
  }, [videoRef, onScoreUpdate]);

  return null;
}