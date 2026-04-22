export default function GlassCard({ children }) {
  return (
    <div className="
      bg-white/5 
      backdrop-blur-xl 
      border border-white/10 
      rounded-2xl 
      p-6 
      shadow-[0_0_40px_rgba(139,92,246,0.15)]
      transition-all 
      duration-300 
      hover:scale-[1.01]
    ">
      {children}
    </div>
  );
}
