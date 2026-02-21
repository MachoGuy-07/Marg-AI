import React, { useEffect, useState } from "react";
import "../styles/report.css";

export default function Report(){

  // ⭐ Read from localStorage
  const storedAnalysis = localStorage.getItem("report_analysis");
  const storedTranscript = localStorage.getItem("report_transcript");

  const analysis = storedAnalysis ? JSON.parse(storedAnalysis) : null;
  const transcript = storedTranscript || "Transcript not captured";

  // ✅ NEW: Save Test Function
  const handleSaveTest = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        alert("Please login first");
        return;
      }

      const response = await fetch("http://localhost:5000/api/test-results/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user._id,
          confidence: analysis.confidence_score || 0,
          pace: analysis.pace_score || 0,
          engagement: analysis.engagement_score || 0,
        }),
      });

      if (response.ok) {
        alert("Test saved successfully ✅");
      } else {
        alert("Failed to save test");
      }

    } catch (error) {
      console.error("Save error:", error);
      alert("Something went wrong");
    }
  };

  if(!analysis) return <h2 style={{padding:40}}>No report found</h2>;

  return (
    <div className="report-page">

      {/* HEADER */}
      <div className="report-header">
        <h1 className="report-title">
          Interview Performance Report
        </h1>
        <p>Date: {new Date().toDateString()}</p>
      </div>

      <div className="report-body">

        {/* LEFT */}
        <div className="report-left">

          <div className="score-card">
            <Score title="Confidence" value={analysis.confidence_score || 0}/>
            <Score title="Pace" value={analysis.pace_score || 0}/>
            <Score title="Engagement" value={analysis.engagement_score || 0}/>
          </div>

          <div className="transcript-box">
            <h3>Transcript</h3>
            <p>{transcript}</p>
          </div>

          {/* ✅ NEW SAVE BUTTON */}
          <button
            className="report-download-btn"
            style={{ marginTop: "15px" }}
            onClick={handleSaveTest}
          >
            Save Test Record
          </button>

          {/* DOWNLOAD BUTTON (UNCHANGED) */}
          <button
            className="report-download-btn"
            onClick={() => {
              const analysis = localStorage.getItem("report_analysis");
              const transcript = localStorage.getItem("report_transcript");

              const blob = new Blob(
                [
                  "Interview Performance Report\n\n",
                  "Analysis:\n",
                  analysis,
                  "\n\nTranscript:\n",
                  transcript
                ],
                { type: "text/plain" }
              );

              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "interview-report.txt";
              a.click();
            }}
          >
            Download Report
          </button>

        </div>

        {/* RIGHT */}
        <div className="report-right">
          <h3>AI Feedback</h3>
          {analysis.ai_feedback?.map((f,i)=>(
            <div key={i} className="feedback-card">💡 {f}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ===========================
   ⭐ Animated Score Component
=========================== */
function Score({ title, value }){
  const [animated, setAnimated] = useState(0);

  useEffect(()=>{
    let i = 0;
    const interval = setInterval(()=>{
      i++;
      setAnimated(i);
      if(i>=value) clearInterval(interval);
    },60);

    return ()=>clearInterval(interval);
  },[value]);

  const percent = animated * 10;

  let color = "#ef4444";
  if(value>=7) color="#10b981";
  else if(value>=5) color="#f59e0b";

  return (
    <div
      className="score"
      style={{
        transition:"0.3s",
        boxShadow:"0 4px 12px rgba(0,0,0,0.05)"
      }}
      onMouseEnter={(e)=>{
        e.currentTarget.style.transform="translateY(-6px)";
        e.currentTarget.style.boxShadow="0 12px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e)=>{
        e.currentTarget.style.transform="none";
        e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.05)";
      }}
    >
      <h4>{title}</h4>

      <div
        style={{
          width:120,
          height:120,
          margin:"auto",
          borderRadius:"50%",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          background:`conic-gradient(${color} ${percent}%, #e5e7eb 0)`,
          transition:"1s",
          boxShadow:`0 0 15px ${color}40`
        }}
      >
        <div
          style={{
            width:85,
            height:85,
            borderRadius:"50%",
            background:"#fff",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            fontWeight:700,
            fontSize:22
          }}
        >
          {animated}/10
        </div>
      </div>

      <div
        style={{
          height:8,
          background:"#e5e7eb",
          borderRadius:10,
          marginTop:10,
          overflow:"hidden"
        }}
      >
        <div
          style={{
            width:`${percent}%`,
            height:"100%",
            background:color,
            transition:"1s"
          }}
        />
      </div>

    </div>
  );
}