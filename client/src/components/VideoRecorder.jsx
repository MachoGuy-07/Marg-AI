import React, {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import PostureAnalyzer from "./PostureAnalyzer";
import VoiceAnalyzer from "./VoiceAnalyzer";

const VideoRecorder = forwardRef(function VideoRecorder({
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
}, ref) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [emotion, setEmotion] = useState("Neutral");

  useEffect(() => {
    let mediaStream = null;

    async function initMedia() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        alert("Camera or microphone permission denied");
      }
    }

    initMedia();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
    setVideoURL(null);
    setEmotion("Neutral");
    onEmotionChange?.("Neutral");

    onRecordingStart?.();
    onRecordingStateChange?.(true);

    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

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
        const response = await fetch("http://localhost:5000/api/analyze-interview", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Upload failed. Showing live-analysis report instead.");
          onUploadComplete?.({ analysis: {} });
          return;
        }

        onUploadComplete?.(data);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Recording upload failed. Showing live-analysis report instead.");
        onUploadComplete?.({ analysis: {} });
      }
    };

    recorder.start();
    setRecording(true);
  }, [
    onEmotionChange,
    onRecordingStart,
    onRecordingStateChange,
    onUploadComplete,
    stream,
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
      hasStream: () => Boolean(stream),
    }),
    [recording, startRecording, stopRecording, stream]
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
          onScoreUpdate={(score, emotionValue, metrics) => {
            onPostureScore?.(score);
            onPostureMetrics?.(metrics || {});
            setEmotion(emotionValue);
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
});

export default VideoRecorder;
