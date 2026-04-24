"use client"

export function SkyBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8f4ff] via-[#f0f6ff] to-[#faf8ff]" />
      
      {/* Soft rainbow hint at top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[400px] opacity-[0.15]"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(255,182,193,0.4) 0%, rgba(255,218,185,0.3) 20%, rgba(255,255,200,0.2) 40%, rgba(200,255,200,0.2) 60%, rgba(173,216,230,0.3) 80%, transparent 100%)",
        }}
      />
      
      {/* Soft light orbs */}
      <div 
        className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,220,230,0.6) 0%, transparent 70%)" }}
      />
      <div 
        className="absolute top-[30%] left-[5%] w-[200px] h-[200px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(200,220,255,0.6) 0%, transparent 70%)" }}
      />
      <div 
        className="absolute bottom-[20%] right-[15%] w-[250px] h-[250px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(230,200,255,0.5) 0%, transparent 70%)" }}
      />
    </div>
  )
}
