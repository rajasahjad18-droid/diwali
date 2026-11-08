
import React, { useEffect, useRef, useState } from "react";

export default function Diwali() {
  const canvasRef = useRef(null);
  const rocketsRef = useRef([]);
  const particlesRef = useRef([]);
  const timersRef = useRef([]);

  const audioRef = useRef(null);
  const soundRef = useRef(true);

  const [name, setName] = useState("");
  const [showName, setShowName] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [sound, setSound] = useState(true);

  // Sound effects
  const playSound = (type) => {
    if (!soundRef.current) return;

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }

      const audio = audioRef.current;
      if (audio.state === "suspended") audio.resume();

      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.connect(gain);
      gain.connect(audio.destination);

      const now = audio.currentTime;

      if (type === "launch") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(180, now);
        oscillator.frequency.exponentialRampToValueAtTime(
          650,
          now + 0.45
        );

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        oscillator.start(now);
        oscillator.stop(now + 0.45);
      } else {
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(
          35,
          now + 0.35
        );

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        oscillator.start(now);
        oscillator.stop(now + 0.35);
      }
    } catch (error) {
      console.log("Audio unavailable");
    }
  };

  // Fireworks animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let animationId;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      // Lower canvas resolution for smoother mobile performance
      const scale = Math.min(window.devicePixelRatio || 1, 1.25);

      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "#ffcc33",
      "#ff4d6d",
      "#00e5ff",
      "#a78bfa",
      "#ffffff",
      "#ff8c42",
      "#7cff6b",
    ];

    const explode = (x, y, big = false) => {
      const count = big ? 145 : 32;
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = big
          ? 2 + Math.random() * 5
          : 1.2 + Math.random() * 3;

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.009 + Math.random() * 0.012,
          size: big ? 1.5 + Math.random() * 2 : 1 + Math.random() * 1.5,
          color,
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = "rgba(3, 5, 20, 0.20)";
      ctx.fillRect(0, 0, width, height);

      // Rockets
      rocketsRef.current = rocketsRef.current.filter((rocket) => {
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.vy += 0.035;

        ctx.beginPath();
        ctx.moveTo(rocket.x, rocket.y);
        ctx.lineTo(
          rocket.x - rocket.vx * 3,
          rocket.y - rocket.vy * 3
        );
        ctx.strokeStyle = rocket.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (rocket.y <= rocket.targetY || rocket.vy > 0) {
          explode(rocket.x, rocket.y, rocket.big);

          if (rocket.onExplode) {
            rocket.onExplode(rocket.x, rocket.y);
          }

          return false;
        }

        return true;
      });

      // Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life -= p.decay;

        if (p.life <= 0) return false;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Rocket launch
  const launchRocket = (big = false, onExplode) => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const targetX = width * (0.25 + Math.random() * 0.5);
    const targetY = height * (0.18 + Math.random() * 0.24);

    const startX = width * (0.35 + Math.random() * 0.3);
    const startY = height + 10;

    const distance = Math.hypot(
      targetX - startX,
      targetY - startY
    );

    const speed = big ? 8 : 7;

    rocketsRef.current.push({
      x: startX,
      y: startY,
      vx: ((targetX - startX) / distance) * speed,
      vy: ((targetY - startY) / distance) * speed,
      targetY,
      color: "#ffffff",
      big,
      onExplode,
    });
  };

  // Start complete Diwali show
  const celebrate = async () => {
    if (launching) return;

    const finalName = name.trim() || "Happy Diwali";

    setLaunching(true);
    setShowName(false);

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    particlesRef.current = [];
    rocketsRef.current = [];

    if (soundRef.current && audioRef.current) {
      await audioRef.current.resume();
    }

    playSound("launch");

    launchRocket(true, (x, y) => {
      playSound("boom");
      setShowName(true);

      // Small fireworks with gaps
      let elapsed = 0;

      const burst = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const x = w * (0.12 + Math.random() * 0.76);
        const y = h * (0.15 + Math.random() * 0.42);

        // Small burst directly on the sky
        const color = [
          "#ffcc33",
          "#ff4d6d",
          "#00e5ff",
          "#a78bfa",
          "#ffffff",
          "#7cff6b",
        ][Math.floor(Math.random() * 6)];

        const count = 28;

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const speed = 1.2 + Math.random() * 2.8;

          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.018 + Math.random() * 0.012,
            size: 1 + Math.random() * 1.5,
            color,
          });
        }

        playSound("boom");
      };

      // First small burst after a short pause
      const firstTimer = setTimeout(() => {
        burst();

        const interval = setInterval(() => {
          elapsed += 1400;

          if (elapsed >= 9800) {
            clearInterval(interval);
            return;
          }

          burst();
        }, 1400);

        timersRef.current.push(interval);
      }, 900);

      timersRef.current.push(firstTimer);

      // Name stays visible for 10 seconds
      const finishTimer = setTimeout(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];

        setShowName(false);
        setLaunching(false);
      }, 10000);

      timersRef.current.push(finishTimer);
    });
  };

  const toggleSound = () => {
    soundRef.current = !soundRef.current;
    setSound(soundRef.current);
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030514] text-white">

      {/* Fireworks Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-10"
      />

      {/* Stars */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {Array.from({ length: 65 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white opacity-70 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 85}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="pointer-events-none absolute right-12 top-12 z-0 h-16 w-16 rounded-full bg-yellow-100 shadow-[0_0_55px_#fff3b0] opacity-90 sm:right-28 sm:top-16 sm:h-24 sm:w-24" />

      {/* Sound Button */}
      <button
        onClick={toggleSound}
        className="absolute right-4 top-4 z-30 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-md"
      >
        {sound ? "🔊 Sound ON" : "🔇 Sound OFF"}
      </button>

      {/* Main Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 text-center">

        {!showName && (
          <div className="mb-8">
            <p className="mb-3 text-sm tracking-[0.45em] text-yellow-300 sm:text-base">
              FESTIVAL OF LIGHTS
            </p>

            <h1 className="text-4xl font-black tracking-wide sm:text-6xl">
              HAPPY <span className="text-yellow-300">DIWALI</span>
            </h1>

            <p className="mt-4 text-sm text-white/60 sm:text-base">
              Make this Diwali special with your name
            </p>
          </div>
        )}

        {/* Name Input */}
        {!launching && !showName && (
          <div className="w-full max-w-md rounded-2xl border border-yellow-300/20 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") celebrate();
              }}
              placeholder="Enter your name..."
              maxLength={25}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-4 text-center text-lg text-white outline-none placeholder:text-white/40 focus:border-yellow-300"
            />

            <button
              onClick={celebrate}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-300 px-6 py-4 text-lg font-bold text-black shadow-[0_0_30px_#f59e0b55] transition hover:scale-[1.02] active:scale-95"
            >
              🚀 Launch Fireworks
            </button>
          </div>
        )}

        {/* Launching Text */}
        {launching && !showName && (
          <p className="animate-pulse text-xl font-semibold tracking-widest text-yellow-200">
            GET READY...
          </p>
        )}

        {/* Final Name */}
        {showName && (
          <div className="animate-pulse px-3">
            <p className="mb-5 text-sm tracking-[0.4em] text-yellow-200 sm:text-lg">
              ✨ HAPPY DIWALI ✨
            </p>

            <h1 className="break-words text-5xl font-black leading-tight text-transparent bg-gradient-to-r from-yellow-200 via-orange-400 to-yellow-100 bg-clip-text drop-shadow-[0_0_25px_#f59e0b] sm:text-7xl md:text-8xl">
              {name.trim() || "Happy Diwali"}
            </h1>

            <p className="mt-6 text-lg font-medium text-white sm:text-2xl">
              Wishing you happiness & prosperity
            </p>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="pointer-events-none absolute bottom-5 left-0 z-20 w-full text-center text-xs tracking-widest text-white/40">
        A SPECIAL DIWALI CELEBRATION
      </div>
    </div>
  );
}
