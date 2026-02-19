// client/src/components/VideoRecorder.jsx

import React, { useEffect, useRef, useState } from "react";
import PostureAnalyzer from "./PostureAnalyzer";
import VoiceAnalyzer from "./VoiceAnalyzer";

export default function VideoRecorder({
  onUploadComplete,
  onPostureScore,
  onVoiceScore,
}) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);

  // ----------------------------
  // INIT CAMERA + MIC
  // ----------------------------
  useEffect(() => {
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
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

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ----------------------------
  // START RECORDING
  // ----------------------------
  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: "video/webm",
      });

      const url = URL.createObjectURL(blob);
      setVideoURL(url);

      const formData = new FormData();
      formData.append("recording", blob, "interview.webm");

      try {
        const res = await fetch(
          "http://localhost:5000/api/analyze-interview",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("marg_token")}`,
            },
            body: formData,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Upload failed");
          return;
        }

        // Send analysis to parent (MockInterview)
        if (onUploadComplete) {
          onUploadComplete(data);
        }

      } catch (err) {
        console.error("Upload error:", err);
        alert("Recording failed to upload");
      }
    };

    recorder.start();
    setRecording(true);
  };

  // ----------------------------
  // STOP RECORDING
  // ----------------------------
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="video-recorder">
      <h3>🎥 Interview Camera</h3>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", borderRadius: "12px" }}
      />

      {/* 👇 Only run analyzers while recording */}
      {recording && (
        <PostureAnalyzer
          videoRef={videoRef}
          onScoreUpdate={onPostureScore}
        />
      )}

      {recording && stream && (
        <VoiceAnalyzer
          stream={stream}
          onVoiceScore={onVoiceScore}
        />
      )}

      <div style={{ marginTop: "12px" }}>
        {!recording ? (
          <button className="btn primary" onClick={startRecording}>
            🔴 Start Recording
          </button>
        ) : (
          <button className="btn ghost" onClick={stopRecording}>
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {videoURL && (
        <div style={{ marginTop: "16px" }}>
          <h4>▶️ Playback</h4>
          <video
            src={videoURL}
            controls
            style={{ width: "100%", borderRadius: "12px" }}
          />
        </div>
      )}
    </div>
  );
}