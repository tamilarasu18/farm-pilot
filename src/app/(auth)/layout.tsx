export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 bg-[var(--background)] overflow-hidden">
        {/* Modern Dot Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Floating Tree Emojis */}
        <div className="absolute top-[15%] left-[10%] text-6xl opacity-20 animate-float" style={{ animationDelay: "0s", transform: "rotate(-10deg)" }}>🌳</div>
        <div className="absolute top-[60%] left-[5%] text-4xl opacity-[0.15] animate-float" style={{ animationDelay: "1s", transform: "rotate(15deg)" }}>🌲</div>
        <div className="absolute top-[20%] right-[15%] text-5xl opacity-20 animate-float" style={{ animationDelay: "2s", transform: "rotate(5deg)" }}>🌲</div>
        <div className="absolute bottom-[20%] right-[10%] text-7xl opacity-[0.12] animate-float" style={{ animationDelay: "1.5s", transform: "rotate(-5deg)" }}>🌳</div>
        <div className="absolute top-[70%] left-[25%] text-5xl opacity-10 animate-float" style={{ animationDelay: "0.5s", transform: "rotate(-15deg)" }}>🌳</div>
        <div className="absolute top-[30%] right-[35%] text-3xl opacity-[0.18] animate-float" style={{ animationDelay: "2.5s", transform: "rotate(10deg)" }}>🌲</div>

        {/* Vibrant Gradient Base */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(45,106,79,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(64,145,108,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(212,163,115,0.1) 0%, transparent 50%)",
          }}
        />

        {/* Floating Orbs */}
        <div
          className="absolute w-80 h-80 rounded-full opacity-30 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(64,145,108,0.3), transparent)",
            top: "5%",
            left: "5%",
            animationDelay: "0s",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(45,106,79,0.25), transparent)",
            bottom: "5%",
            right: "0%",
            animationDelay: "1.5s",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full opacity-25 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(212,163,115,0.3), transparent)",
            top: "45%",
            right: "20%",
            animationDelay: "3s",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div className="w-full max-w-md mx-4 animate-scale-in">{children}</div>
    </div>
  );
}
