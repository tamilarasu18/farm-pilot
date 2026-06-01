export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        {/* Dark gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(45,106,79,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(64,145,108,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(212,163,115,0.08) 0%, transparent 50%), var(--background)",
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute w-72 h-72 rounded-full opacity-20 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(45,106,79,0.4), transparent)",
            top: "10%",
            left: "10%",
            animationDelay: "0s",
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full opacity-15 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(64,145,108,0.3), transparent)",
            bottom: "10%",
            right: "5%",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-10 animate-float"
          style={{
            background:
              "radial-gradient(circle, rgba(212,163,115,0.4), transparent)",
            top: "50%",
            right: "30%",
            animationDelay: "3s",
          }}
        />
      </div>

      <div className="w-full max-w-md mx-4 animate-scale-in">{children}</div>
    </div>
  );
}
