import { motion } from "framer-motion";
import GlassCard from "../layout/GlassCard";
import VideoRecorder from "../VideoRecorder";

export default function CameraSection({
  onPostureScore,
  onVoiceScore,
  onUploadComplete,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard>
        <VideoRecorder
          onPostureScore={onPostureScore}
          onVoiceScore={onVoiceScore}
          onUploadComplete={onUploadComplete}
        />
      </GlassCard>
    </motion.div>
  );
}