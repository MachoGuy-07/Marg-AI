import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Pose } from "@mediapipe/pose";

const BASE_ANALYZE_INTERVAL_MS = 130;
const MAX_ANALYZE_INTERVAL_MS = 220;
const EMIT_INTERVAL_MS = 210;
const FRAME_STRIDE = 2;
const ANALYSIS_FRAME_WIDTH = 320;
const ANALYSIS_FRAME_HEIGHT = 240;
const FACE_MESH_CDN_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
const POSE_CDN_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/pose";

export default function PostureAnalyzer({ videoRef, onScoreUpdate, onMetrics }) {
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onMetricsRef = useRef(onMetrics);
  const faceMeshRef = useRef(null);
  const poseRef = useRef(null);
  const rafRef = useRef(null);
  const busyRef = useRef(false);
  const lastAnalyzeRef = useRef(0);
  const adaptiveIntervalRef = useRef(BASE_ANALYZE_INTERVAL_MS);
  const frameStrideRef = useRef(0);
  const isVisibleRef = useRef(
    typeof document === "undefined" ? true : !document.hidden
  );

  const latestFaceRef = useRef(null);
  const latestPoseRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const analysisContextRef = useRef(null);
  const emitStateRef = useRef({
    lastTs: 0,
    eyeContact: 0.5,
    postureScore: 0.5,
  });

  const totalsRef = useRef({
    totalFrames: 0,
    faceFrames: 0,
    poseFrames: 0,
  });

  const smoothingRef = useRef({
    eyeContact: 0.5,
    postureAlignment: 0.5,
    headStillness: 0.5,
    stability: 0.5,
    postureScore: 0.5,
    motionEma: 0,
  });

  const lastFaceCenterRef = useRef(null);
  const lastShoulderCenterRef = useRef(null);

  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  useEffect(() => {
    onMetricsRef.current = onMetrics;
  }, [onMetrics]);

  useEffect(() => {
    if (!videoRef?.current) return;

    let mounted = true;
    const handleVisibilityChange = () => {
      isVisibleRef.current =
        typeof document === "undefined" ? true : !document.hidden;
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    const faceMesh = new FaceMesh({
      locateFile: resolveMediaPipeAsset,
    });
    const pose = new Pose({
      locateFile: resolveMediaPipeAsset,
    });

    faceMeshRef.current = faceMesh;
    poseRef.current = pose;
    analysisCanvasRef.current = document.createElement("canvas");
    analysisCanvasRef.current.width = ANALYSIS_FRAME_WIDTH;
    analysisCanvasRef.current.height = ANALYSIS_FRAME_HEIGHT;
    analysisContextRef.current = analysisCanvasRef.current.getContext("2d");

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    faceMesh.onResults((results) => {
      latestFaceRef.current = results;
    });

    pose.onResults((results) => {
      latestPoseRef.current = results;
    });

    const analyze = async () => {
      if (!mounted) return;

      const video = videoRef.current;
      if (
        !video ||
        video.readyState < 2 ||
        !faceMeshRef.current ||
        !poseRef.current
      ) {
        rafRef.current = requestAnimationFrame(analyze);
        return;
      }

      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(analyze);
        return;
      }

      frameStrideRef.current = (frameStrideRef.current + 1) % FRAME_STRIDE;
      if (frameStrideRef.current !== 0) {
        rafRef.current = requestAnimationFrame(analyze);
        return;
      }

      const now = performance.now();
      if (
        !busyRef.current &&
        now - lastAnalyzeRef.current >= adaptiveIntervalRef.current
      ) {
        busyRef.current = true;
        lastAnalyzeRef.current = now;
        const startedAt = performance.now();

        try {
          let inputImage = video;
          const canvas = analysisCanvasRef.current;
          const context = analysisContextRef.current;
          if (canvas) {
            if (context) {
              context.imageSmoothingEnabled = false;
              context.drawImage(
                video,
                0,
                0,
                ANALYSIS_FRAME_WIDTH,
                ANALYSIS_FRAME_HEIGHT
              );
              inputImage = canvas;
            }
          }

          const faceTask = faceMeshRef.current.send({ image: inputImage });
          const poseTask = poseRef.current.send({ image: inputImage });
          await Promise.allSettled([faceTask, poseTask]);

          if (mounted) {
            const metrics = computeMetrics({
              faceResults: latestFaceRef.current,
              poseResults: latestPoseRef.current,
              totalsRef,
              smoothingRef,
              lastFaceCenterRef,
              lastShoulderCenterRef,
            });

            const shouldEmit =
              now - emitStateRef.current.lastTs >= EMIT_INTERVAL_MS ||
              Math.abs(metrics.eyeContact - emitStateRef.current.eyeContact) >= 0.028 ||
              Math.abs(metrics.postureScore - emitStateRef.current.postureScore) >= 0.028;

            if (shouldEmit) {
              emitStateRef.current = {
                lastTs: now,
                eyeContact: metrics.eyeContact,
                postureScore: metrics.postureScore,
              };
              onScoreUpdateRef.current?.(
                metrics.postureScore,
                metrics.emotion,
                metrics
              );
              onMetricsRef.current?.(metrics);
            }
          }
        } catch {
          // Ignore transient inference errors to keep video rendering stable.
        } finally {
          const runMs = performance.now() - startedAt;
          if (runMs > 95) {
            adaptiveIntervalRef.current = Math.min(
              MAX_ANALYZE_INTERVAL_MS,
              adaptiveIntervalRef.current + 12
            );
          } else if (runMs < 62) {
            adaptiveIntervalRef.current = Math.max(
              BASE_ANALYZE_INTERVAL_MS,
              adaptiveIntervalRef.current - 5
            );
          }
          busyRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(analyze);
    };

    rafRef.current = requestAnimationFrame(analyze);

    return () => {
      mounted = false;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }

      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }

      latestFaceRef.current = null;
      latestPoseRef.current = null;
      analysisCanvasRef.current = null;
      analysisContextRef.current = null;
      adaptiveIntervalRef.current = BASE_ANALYZE_INTERVAL_MS;
      frameStrideRef.current = 0;

      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [videoRef]);

  return null;
}

function computeMetrics({
  faceResults,
  poseResults,
  totalsRef,
  smoothingRef,
  lastFaceCenterRef,
  lastShoulderCenterRef,
}) {
  const faceLandmarks = faceResults?.multiFaceLandmarks?.[0] || null;
  const poseLandmarks = poseResults?.poseLandmarks || null;

  const totals = totalsRef.current;
  totals.totalFrames += 1;

  const faceData = faceLandmarks ? extractFaceData(faceLandmarks) : null;
  if (faceData) totals.faceFrames += 1;

  const poseData = poseLandmarks ? extractPoseData(poseLandmarks) : null;
  if (poseData) totals.poseFrames += 1;

  const smoothing = smoothingRef.current;
  const previousFaceCenter = lastFaceCenterRef.current;
  const previousShoulderCenter = lastShoulderCenterRef.current;

  if (faceData) {
    smoothing.eyeContact = lerp(smoothing.eyeContact, faceData.eyeContact, 0.28);
  } else {
    smoothing.eyeContact = clamp01(smoothing.eyeContact * 0.955);
    lastFaceCenterRef.current = null;
  }

  if (poseData) {
    smoothing.postureAlignment = lerp(
      smoothing.postureAlignment,
      poseData.postureAlignment,
      0.24
    );
  } else {
    smoothing.postureAlignment = clamp01(smoothing.postureAlignment * 0.965);
    lastShoulderCenterRef.current = null;
  }

  const movementSamples = [];

  if (faceData && previousFaceCenter) {
    const faceMotion =
      distance2D(faceData.nose, previousFaceCenter) /
      Math.max(faceData.faceWidth, 0.0001);
    movementSamples.push(faceMotion);
  }

  if (poseData && previousShoulderCenter) {
    const torsoMotion =
      distance2D(poseData.shoulderCenter, previousShoulderCenter) /
      Math.max(poseData.shoulderWidth, 0.0001);
    movementSamples.push(torsoMotion);
  }

  if (faceData) {
    lastFaceCenterRef.current = { x: faceData.nose.x, y: faceData.nose.y };
  }

  if (poseData) {
    lastShoulderCenterRef.current = {
      x: poseData.shoulderCenter.x,
      y: poseData.shoulderCenter.y,
    };
  }

  const frameMotion = movementSamples.length ? average(movementSamples) : smoothing.motionEma;
  smoothing.motionEma = lerp(smoothing.motionEma, frameMotion, 0.24);

  const headStillnessRaw = clamp01(1 - smoothing.motionEma * 4.2);
  smoothing.headStillness = lerp(smoothing.headStillness, headStillnessRaw, 0.3);

  const faceSeen = Boolean(faceData);
  const poseSeen = Boolean(poseData);
  const trackingReliability = clamp01((faceSeen ? 0.6 : 0) + (poseSeen ? 0.4 : 0));

  const structuralStability = clamp01(
    smoothing.headStillness * 0.52 + smoothing.postureAlignment * 0.48
  );
  const stabilityRaw = clamp01(
    structuralStability * trackingReliability + trackingReliability * 0.1
  );
  smoothing.stability = lerp(smoothing.stability, stabilityRaw, 0.25);

  const seenFaceRatio = totals.faceFrames / Math.max(1, totals.totalFrames);
  const seenPoseRatio = totals.poseFrames / Math.max(1, totals.totalFrames);
  const engagementHistorical = clamp01(seenFaceRatio * 0.6 + seenPoseRatio * 0.4);
  const engagement = clamp01(trackingReliability * 0.65 + engagementHistorical * 0.35);

  const postureRaw = clamp01(
    smoothing.eyeContact * 0.36 + smoothing.stability * 0.44 + engagement * 0.2
  );
  smoothing.postureScore = lerp(smoothing.postureScore, postureRaw, 0.22);

  return {
    eyeContact: clamp01(smoothing.eyeContact),
    engagement,
    stability: clamp01(smoothing.stability),
    postureScore: clamp01(smoothing.postureScore),
    postureAlignment: clamp01(smoothing.postureAlignment),
    headStillness: clamp01(smoothing.headStillness),
    shoulderLevel: clamp01(poseData?.shoulderLevel ?? smoothing.postureAlignment),
    faceVisible: faceSeen,
    poseVisible: poseSeen,
    emotion: faceData?.emotion || "Neutral",
  };
}

function extractFaceData(landmarks) {
  const nose = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const leftIris = landmarks[468];
  const rightIris = landmarks[473];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  if (
    !nose ||
    !leftCheek ||
    !rightCheek ||
    !forehead ||
    !chin ||
    !leftEyeOuter ||
    !leftEyeInner ||
    !rightEyeInner ||
    !rightEyeOuter
  ) {
    return null;
  }

  const faceWidth = distance2D(leftCheek, rightCheek);
  const faceHeight = distance2D(forehead, chin);
  if (faceWidth < 0.0001 || faceHeight < 0.0001) {
    return null;
  }

  const eyeMid = {
    x: (leftEyeOuter.x + rightEyeOuter.x) / 2,
    y: (leftEyeOuter.y + rightEyeOuter.y) / 2,
  };

  const leftSide = distance2D(nose, leftCheek);
  const rightSide = distance2D(nose, rightCheek);
  const yawSymmetry = clamp01(
    1 - (Math.abs(leftSide - rightSide) / Math.max(0.0001, leftSide + rightSide)) * 2.2
  );

  const pitchRatio = (nose.y - eyeMid.y) / faceHeight;
  const pitchScore = clamp01(1 - Math.abs(pitchRatio - 0.22) / 0.18);

  const centerDistance = Math.hypot(nose.x - 0.5, nose.y - 0.46);
  const frameCenterScore = clamp01(1 - centerDistance * 2.2);

  const leftGaze = gazeCenterScore(leftEyeOuter, leftEyeInner, leftIris);
  const rightGaze = gazeCenterScore(rightEyeOuter, rightEyeInner, rightIris);
  const gazeScore = clamp01((leftGaze + rightGaze) / 2);

  const eyeContact = clamp01(
    gazeScore * 0.5 +
      yawSymmetry * 0.3 +
      pitchScore * 0.12 +
      frameCenterScore * 0.08
  );

  const mouthWidth =
    leftMouth && rightMouth ? distance2D(leftMouth, rightMouth) / faceWidth : 0;
  const emotion = mouthWidth > 0.39 ? "Smile" : "Neutral";

  return {
    eyeContact,
    faceWidth,
    nose,
    emotion,
  };
}

function extractPoseData(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const nose = landmarks[0];

  if (!isVisible(leftShoulder) || !isVisible(rightShoulder) || !isVisible(nose)) {
    return null;
  }

  const shoulderWidth = distance2D(leftShoulder, rightShoulder);
  if (shoulderWidth < 0.0001) {
    return null;
  }

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth;
  const shoulderLevel = clamp01(1 - shoulderTilt * 4.8);

  const torsoOffset = Math.abs(nose.x - shoulderCenter.x) / shoulderWidth;
  const torsoAlignment = clamp01(1 - torsoOffset * 2.7);

  const shoulderSpread = clamp01((shoulderWidth - 0.1) / 0.25);

  const postureAlignment = clamp01(
    shoulderLevel * 0.46 + torsoAlignment * 0.39 + shoulderSpread * 0.15
  );

  return {
    shoulderCenter,
    shoulderWidth,
    shoulderLevel,
    postureAlignment,
  };
}

function gazeCenterScore(outer, inner, iris) {
  if (!outer || !inner || !iris) return 0.55;
  const minX = Math.min(outer.x, inner.x);
  const maxX = Math.max(outer.x, inner.x);
  const width = Math.max(0.0001, maxX - minX);
  const ratio = (iris.x - minX) / width;
  return clamp01(1 - Math.abs(ratio - 0.5) * 2.2);
}

function isVisible(landmark, threshold = 0.45) {
  if (!landmark) return false;
  if (typeof landmark.visibility !== "number") return true;
  return landmark.visibility >= threshold;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function distance2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function resolveMediaPipeAsset(file) {
  const asset = String(file || "").trim();
  if (!asset) {
    return `${FACE_MESH_CDN_BASE}/${asset}`;
  }

  const isPoseAsset =
    asset.startsWith("pose_") ||
    asset.includes("pose_landmark") ||
    asset.includes("segmentation");

  if (isPoseAsset) {
    return `${POSE_CDN_BASE}/${asset}`;
  }

  return `${FACE_MESH_CDN_BASE}/${asset}`;
}
