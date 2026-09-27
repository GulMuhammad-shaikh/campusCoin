import confetti from "canvas-confetti";

export const fireConfetti = (options = {}) => {
  try {
    confetti({
      particleCount: options.particleCount || 70,
      spread: options.spread || 60,
      origin: options.origin || { y: 0.65 },
      colors: options.colors || ["#10b981", "#38bdf8", "#818cf8", "#f43f5e", "#fbbf24"],
      ...options,
    });
  } catch (err) {
    console.warn("Confetti effect failed:", err);
  }
};

export const fireCelebration = () => {
  try {
    const end = Date.now() + 1000;
    const colors = ["#10b981", "#06b6d4", "#f59e0b", "#a855f7"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.warn("Celebration effect failed:", err);
  }
};
