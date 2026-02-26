import React, {
  useCallback,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import PostureAnalyzer from "./PostureAnalyzer";
import VoiceAnalyzer from "./VoiceAnalyzer";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const OPTIMIZED_MEDIA_CONSTRAINTS = {
  video: {
    facingMode: "user",
    width: { ideal: 640, max: 640 },
    height: { ideal: 480, max: 480 },
    frameRate: { ideal: 26, min: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
    latency: 0,
  },
};

const FALLBACK_MEDIA_CONSTRAINTS = {
  video: {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function buildUploadFallback(reason = "") {
  const note = String(reason || "").trim();
  const feedback = [
    "Upload analysis was unavailable, so report used live interview metrics.",
  ];
  if (note) {
    feedback.push(`Technical note: ${note}`);
  }

  return {
    analysis: {
      ai_feedback: feedback,
    },
  };
}

const VideoRecorder = memo(forwardRef(function VideoRecorder({
  onUploadComplete,
  onPostureScore,
  onVoiceScore,
  onRecordingStart,
  onRecordingStop,
  onEmotionChange,
  onRecordingStateChange,
  onPostureMetrics,
  onVoiceMetrics,
  title = "Interview Camera",
  showPlayback = false,
  showHeader = true,
  showEmotion = true,
  showControls = true,
  showInactiveOverlay = false,
}, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const emotionRef = useRef("Neutral");

  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [emotion, setEmotion] = useState("Neutral");

  useEffect(() => {
    let mediaStream = null;

    async function initMedia() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(
          OPTIMIZED_MEDIA_CONSTRAINTS
        );
      } catch {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(
            FALLBACK_MEDIA_CONSTRAINTS
          );
        } catch (err) {
          alert("Camera or microphone permission denied");
          return;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      const [videoTrack] = mediaStream.getVideoTracks();
      const [audioTrack] = mediaStream.getAudioTracks();

      if (videoTrack) {
        videoTrack.contentHint = "motion";
      }

      if (audioTrack) {
        audioTrack.contentHint = "speech";
      }

      if (videoRef.current) {
        if (videoRef.current.srcObject !== mediaStream) {
          videoRef.current.srcObject = mediaStream;
        }
        videoRef.current.play?.().catch(() => {});
      }
    }

    initMedia();

    return () => {
      const activeStream = streamRef.current || mediaStream;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;
    };
  }, []);

  const startRecording = useCallback(() => {
    const activeStream = streamRef.current;
    if (!activeStream || recording) return;

    chunksRef.current = [];
    setVideoURL(null);
    setEmotion("Neutral");
    emotionRef.current = "Neutral";
    onEmotionChange?.("Neutral");

    onRecordingStart?.();
    onRecordingStateChange?.(true);

    const mimeType = pickRecorderMimeType();
    const recorderOptions = {
      videoBitsPerSecond: 1_200_000,
      audioBitsPerSecond: 96_000,
    };
    if (mimeType) {
      recorderOptions.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(activeStream, recorderOptions);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);

      const formData = new FormData();
      formData.append("recording", blob, "interview.webm");

      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze-interview`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn("Upload analysis unavailable:", data?.error || "Unknown error");
          onUploadComplete?.(
            buildUploadFallback(data?.error || "Server analysis returned an error response.")
          );
          return;
        }

        onUploadComplete?.(data);
      } catch (err) {
        console.error("Upload error:", err);
        onUploadComplete?.(
          buildUploadFallback("Network issue while uploading interview recording.")
        );
      }
    };

    recorder.start(1500);
    setRecording(true);
  }, [
    recording,
    onEmotionChange,
    onRecordingStart,
    onRecordingStateChange,
    onUploadComplete,
  ]);

  const stopRecording = useCallback(() => {
    if (!recording) return;
    mediaRecorderRef.current?.stop();
    setRecording(false);
    onRecordingStop?.();
    onRecordingStateChange?.(false);
  }, [onRecordingStateChange, onRecordingStop, recording]);

  useImperativeHandle(
    ref,
    () => ({
      startRecording,
      stopRecording,
      isRecording: () => recording,
      hasStream: () => Boolean(streamRef.current),
    }),
    [recording, startRecording, stopRecording]
  );

  return (
    <div className="video-recorder">
      {showHeader && <h3 className="mi-camera-title">{title}</h3>}

      <div className="mi-camera-frame">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="mi-camera-video"
        />
        {showInactiveOverlay && !recording && (
          <div className="mi-camera-overlay">
            <svg viewBox="0 0 24 24" className="mi-camera-off-icon" aria-hidden="true">
              <path
                fill="currentColor"
                d="M9 4l-1.83 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13.17l2.13 2L20.73 20l-2-2l-11-11L3.27 2.54L2 3.81L5.19 7H4v11h14.19l2 2l1.27-1.27l-4.02-4.02A2 2 0 0 0 18 13V8a2 2 0 0 0-2-2h-3.17L11 4zM6 8.81L15.19 18H4V8h2zm11.6 3.18l-3.49-3.5H16v5.9l-1.92-1.92a3.5 3.5 0 0 0-4.95-4.94L7.69 6.09A1.99 1.99 0 0 1 9 6h1.17l1.83-2h1l1.83 2H16v5.99l1.6.99z"
              />
            </svg>
            <p>Camera Feed Inactive</p>
          </div>
        )}
      </div>

      {showEmotion && (
        <p className="mi-emotion">
          Emotion detected: <span>{emotion}</span>
        </p>
      )}

      {recording && (
        <PostureAnalyzer
          videoRef={videoRef}
          onMetrics={onPostureMetrics}
          onScoreUpdate={(score, emotionValue) => {
            onPostureScore?.(score);
            if (showEmotion && emotionValue !== emotionRef.current) {
              emotionRef.current = emotionValue;
              setEmotion(emotionValue);
            }
            onEmotionChange?.(emotionValue);
          }}
        />
      )}

      {recording && stream && (
        <VoiceAnalyzer
          stream={stream}
          onVoiceScore={onVoiceScore}
          onMetrics={onVoiceMetrics}
        />
      )}

      {showControls &&
        (!recording ? (
          <button type="button" className="mi-record-btn start" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button type="button" className="mi-record-btn stop" onClick={stopRecording}>
            Stop Recording
          </button>
        ))}

      {showPlayback && videoURL && (
        <div className="mi-camera-playback">
          <h4>Playback</h4>
          <video src={videoURL} controls className="mi-camera-video" />
        </div>
      )}
    </div>
  );
}));

export default VideoRecorder;
