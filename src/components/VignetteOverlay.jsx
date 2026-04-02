export default function VignetteOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0, // <-- Reset this to 0 so the box covers the whole screen!
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 5, 
        pointerEvents: "none",
        background:
          // 1. Moved center to 40% (Leaves room at the top for the fade to exist)
          // 2. Shrank the clear hole to 15% (Protects the eyes, but lets the horns fade)
          // 3. Darkened the mid-tone slightly (0.7) to bridge the gap
          // 4. Pulled the solid black in to 75% so all 4 corners get totally crushed
          "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 15%, rgba(15, 5, 30, 0.7) 40%, rgba(0,0,0,1) 75%)",
      }}
    />
  );
}