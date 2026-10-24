"use client";

import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import Image from "next/image";
import { JetBrains_Mono, Orbitron } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const tech = Orbitron({ subsets: ["latin"], weight: ["500", "700", "900"] });

const PRESETS = [
  { label: "36h", seconds: 36 * 3600 },
  { label: "24h", seconds: 24 * 3600 },
  { label: "12h", seconds: 12 * 3600 },
  { label: "6h", seconds: 6 * 3600 },
  { label: "1h", seconds: 1 * 3600 },
  { label: "5m", seconds: 5 * 60 },
];

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  };
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6 7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6 7-7" />
    </svg>
  );
}

function VideoUploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" />
      <path d="M9 12h4m-2-2v4" />
    </svg>
  );
}

export default function FramedVideoTimerPage() {
  // Setup state
  const [isSetup, setIsSetup] = useState(true);
  const [inputHours, setInputHours] = useState("");
  const [inputMinutes, setInputMinutes] = useState("");

  // Main countdown timer state
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Hourglass video state
  const [videoSrc, setVideoSrc] = useState<string>("/hourglass.mp4");
  const [videoError, setVideoError] = useState<boolean>(false);
  const [customVideoUploaded, setCustomVideoUploaded] = useState<boolean>(false);
  const [syncVideoWithTimer, setSyncVideoWithTimer] = useState<boolean>(true);
  const [videoFitMode, setVideoFitMode] = useState<"contain" | "cover">("contain");

  // UI view state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControlsInFullscreen, setShowControlsInFullscreen] = useState<boolean>(true);

  // References
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Uninterrupted Countdown Engine
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Sync hourglass video play/pause with timer if enabled
  useEffect(() => {
    if (!videoRef.current) return;
    if (syncVideoWithTimer) {
      if (isRunning) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isRunning, syncVideoWithTimer]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      setShowControlsInFullscreen(true);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fade out fullscreen controls on idle
  const handleMouseMove = () => {
    setShowControlsInFullscreen(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControlsInFullscreen(false);
      }
    }, 4000);
  };

  const fractionRemaining = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const progressPercent = Math.min(100, Math.max(0, (1 - fractionRemaining) * 100));
  const isFinished = totalSeconds > 0 && secondsLeft === 0;
  const { h, m, s } = useMemo(() => formatDuration(secondsLeft), [secondsLeft]);

  const handleStart = () => {
    if (secondsLeft === 0) setSecondsLeft(totalSeconds);
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  const handlePreset = (seconds: number) => {
    setIsRunning(false);
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleAdjustTime = (delta: number) => {
    setSecondsLeft((prev) => {
      const next = Math.max(0, prev + delta);
      if (next > totalSeconds) setTotalSeconds(next);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (stageRef.current) {
          await stageRef.current.requestFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored if permissions are restricted
    }
  };

  const handleCustomVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoError(false);
      setCustomVideoUploaded(true);
      if (videoRef.current) {
        videoRef.current.load();
        if (isRunning || !syncVideoWithTimer) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseInt(inputHours || "0", 10);
    const mins = parseInt(inputMinutes || "0", 10);
    const total = hrs * 3600 + mins * 60;
    if (total > 0) {
      setTotalSeconds(total);
      setSecondsLeft(total);
      setIsSetup(false);
    }
  };

  if (isSetup) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white font-mono">
        {/* Subtle red glow background */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(185,28,28,0.15)_0%,_transparent_70%)]" />

        <div className="relative flex flex-col gap-8 p-10 rounded-xl border border-red-900/40 bg-black/90 shadow-[0_0_60px_rgba(185,28,28,0.2)]">
          {/* Corner accents */}
          <span className="absolute top-3 left-3 h-3 w-3 border-t-2 border-l-2 border-red-600/70" />
          <span className="absolute top-3 right-3 h-3 w-3 border-t-2 border-r-2 border-red-600/70" />
          <span className="absolute bottom-3 left-3 h-3 w-3 border-b-2 border-l-2 border-red-600/70" />
          <span className="absolute bottom-3 right-3 h-3 w-3 border-b-2 border-r-2 border-red-600/70" />

          <h1 className={`${tech.className} text-xl text-red-500 tracking-[0.3em] text-center`}>
            SET TIMER
          </h1>

          <form onSubmit={handleSetupSubmit} className="flex flex-col gap-7">
            <div className="flex justify-center gap-8">
              <div className="flex flex-col gap-2 items-center">
                <label className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase">Hours</label>
                <input
                  type="number"
                  min="0"
                  value={inputHours}
                  onChange={(e) => setInputHours(e.target.value)}
                  className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-center text-2xl text-white focus:outline-none focus:border-red-600 transition-colors"
                  placeholder="0"
                />
              </div>
              <div className="flex items-end pb-3 text-zinc-600 text-2xl font-light">:</div>
              <div className="flex flex-col gap-2 items-center">
                <label className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(e.target.value)}
                  className="w-20 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-center text-2xl text-white focus:outline-none focus:border-red-600 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={(!inputHours && !inputMinutes) || (parseInt(inputHours || "0", 10) === 0 && parseInt(inputMinutes || "0", 10) === 0)}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(185,28,28,0.4)] hover:shadow-[0_0_30px_rgba(185,28,28,0.6)]"
            >
              START
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-x-hidden bg-black px-3 py-3 sm:px-6 sm:py-6 select-none text-white"
    >
      {/* Red & Black atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_rgba(127,29,29,0.35)_0%,_rgba(0,0,0,1)_65%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(127,29,29,0.2)_0%,_transparent_60%)]" />
      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {/* Center red glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-900/10 blur-[120px]" />

      {/* Top Header */}
      <header className="relative z-10 flex w-full max-w-6xl items-center justify-between px-2 pt-1 pb-3 sm:pb-5">
        <div className={`${tech.className} text-base text-red-600 font-bold tracking-[0.3em]`}>
          TIMER
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Fit mode selector */}
          <button
            onClick={() => setVideoFitMode((prev) => (prev === "contain" ? "cover" : "contain"))}
            title={videoFitMode === "contain" ? "Showing Original Dimensions (Contain)" : "Showing Fill (Cover)"}
            className="hidden lg:flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-800 hover:text-white"
          >
            <span className="text-red-600 uppercase text-[10px]">Fit:</span>
            <span>{videoFitMode === "contain" ? "Original" : "Cover"}</span>
          </button>

          {/* Quick upload / preview button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCustomVideoUpload}
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload or preview a video file"
            className="hidden sm:flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-red-800 hover:text-white"
          >
            <VideoUploadIcon className="h-3.5 w-3.5 text-red-600" />
            <span>{customVideoUploaded ? "Custom Video" : "Upload Video"}</span>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            title="Toggle Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-800 bg-zinc-950/80 text-zinc-400 transition-all hover:border-red-800 hover:text-white"
          >
            {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Stage */}
      <div className="relative z-10 flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-1 sm:py-3">
        <div
          ref={stageRef}
          className={`relative w-full transition-all duration-300 ${
            isFullscreen
              ? "!fixed !inset-0 !h-screen !w-screen !max-w-none z-50 bg-black"
              : "rounded-xl p-[1px] shadow-[0_0_60px_rgba(185,28,28,0.15)]"
          }`}
          style={
            isFullscreen
              ? { background: "#000" }
              : {
                  background:
                    "linear-gradient(135deg, rgba(185,28,28,0.5) 0%, rgba(0,0,0,0.8) 50%, rgba(185,28,28,0.3) 100%)",
                }
          }
        >
          {/* Inner frame */}
          <div
            className={`relative flex flex-col justify-between overflow-hidden bg-black w-full ${
              isFullscreen
                ? "h-full w-full rounded-none border-none"
                : "rounded-[10px] border border-zinc-900 min-h-[380px] sm:min-h-[480px] md:min-h-[520px] aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9]"
            }`}
          >
            {/* Corner Accents */}
            <div className="pointer-events-none absolute left-3 top-3 z-30 flex items-center gap-1.5">
              <span className="h-2 w-2 border-t border-l border-red-700/70" />
              <span className={`${mono.className} text-[8px] uppercase tracking-widest text-red-900/70`}>SYS.01</span>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-center gap-1.5">
              <span className={`${mono.className} text-[8px] uppercase tracking-widest text-red-900/70`}>TARGET.LOCKED</span>
              <span className="h-2 w-2 border-t border-r border-red-700/70" />
            </div>
            <div className="pointer-events-none absolute left-3 bottom-3 z-30">
              <span className="block h-2 w-2 border-b border-l border-red-700/70" />
            </div>
            <div className="pointer-events-none absolute right-3 bottom-3 z-30">
              <span className="block h-2 w-2 border-b border-r border-red-700/70" />
            </div>

            {/* Video Layer */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={videoSrc}
                loop
                muted
                playsInline
                autoPlay
                onError={() => setVideoError(true)}
                onLoadedData={() => setVideoError(false)}
                className={`max-h-full max-w-full transition-all duration-700 ${
                  videoFitMode === "contain"
                    ? "object-contain w-auto h-full m-auto"
                    : "object-cover w-full h-full object-center"
                }`}
              />

              {/* Fallback */}
              {videoError && !customVideoUploaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                  <div className="relative h-40 w-40 rounded-full border border-red-900/30 flex items-center justify-center animate-pulse">
                    <div className="h-28 w-28 rounded-full border border-dashed border-red-900/40 animate-[spin_30s_linear_infinite]" />
                  </div>
                  <p className={`${mono.className} mt-4 text-[10px] uppercase tracking-widest text-red-900/60`}>
                    [ AWAITING VIDEO AT /hourglass.mp4 ]
                  </p>
                </div>
              )}

              {/* Vignette */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.5)_70%,_rgba(0,0,0,0.95)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
            </div>

            {/* Top Bar — Sponsors Row */}
            <div className="relative z-20 flex items-center justify-between px-6 pt-5 sm:px-10 sm:pt-8 w-full">
              {/* Left Side: Sponsor 1 (Beginning) */}
              {/* <div className="flex items-center gap-3 sm:gap-4 z-30">
                <div className="relative flex items-center h-7 sm:h-9 opacity-85 hover:opacity-100 transition-opacity">
                  <Image
                    src="/sponsors/1.jpeg"
                    alt="Sponsor 1"
                    width={1120}
                    height={284}
                    className="h-full w-auto object-contain rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    priority
                  />
                </div>
              </div> */}

              {/* Middle: Sponsor 2 */}
              {/* <div className="absolute left-1/2 -translate-x-1/2 items-center flex z-30">
                <div className="relative flex items-center h-10 sm:h-12 opacity-90 hover:opacity-100 transition-opacity">
                  <Image
                    src="/sponsors/2.jpeg"
                    alt="Sponsor 2"
                    width={1280}
                    height={1280}
                    className="h-full w-auto object-contain rounded-md shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                    priority
                  />
                </div>
              </div> */}

              {/* Right Side: Sponsor 3 (End) */}
              <div className="flex items-center gap-3 sm:gap-4 z-30">
                {/* <div className="relative flex items-center h-6 sm:h-8 opacity-85 hover:opacity-100 transition-opacity">
                  <Image
                    src="/sponsors/3.jpeg"
                    alt="Sponsor 3"
                    width={509}
                    height={99}
                    className="h-full w-auto object-contain rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    priority
                  />
                </div> */}

                {/* Exit zoom button when in fullscreen */}
                {isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    title="Exit Fullscreen"
                    className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border border-zinc-800 bg-black/80 text-zinc-300 hover:border-red-800 hover:text-white transition-all ml-2"
                  >
                    <MinimizeIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="relative z-20 flex w-full justify-center mt-8 pointer-events-none">
              <div className="flex items-center gap-2 rounded-full border border-zinc-800/80 bg-black/70 px-3 py-1 backdrop-blur-md pointer-events-auto">
                <span className="relative flex h-1.5 w-1.5">
                  {isRunning && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                      isFinished
                        ? "bg-zinc-500"
                        : isRunning
                        ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                        : "bg-zinc-600"
                    }`}
                  />
                </span>
                <span className={`${tech.className} text-[9px] font-semibold tracking-[0.2em] text-zinc-400`}>
                  {isFinished ? "TIMEOVER" : isRunning ? "LIVE" : "PAUSED"}
                </span>
              </div>
            </div>

            {/* Center Digital Clock */}
            <div className="relative z-20 my-auto flex flex-col items-center justify-center px-4 py-4 sm:py-6">
              <div className="relative flex flex-col items-center px-5 py-4 sm:px-10 sm:py-7">
                <p className={`${tech.className} text-[10px] sm:text-xs uppercase tracking-[0.5em] text-red-900/80 mb-3`}>
                  {isFinished ? "TIME IS UP" : "TIME REMAINING"}
                </p>

                {/* Clock digits */}
                <div
                  className={`${mono.className} flex items-center justify-center font-bold tabular-nums tracking-tight
                    ${isFinished ? "text-zinc-700" : "text-white"}
                    text-5xl sm:text-7xl md:text-8xl lg:text-9xl`}
                  style={
                    isFinished
                      ? {}
                      : {
                          textShadow: secondsLeft <= 3600 && totalSeconds > 3600
                            ? "0 0 30px rgba(220,38,38,0.7), 0 0 60px rgba(220,38,38,0.4)"
                            : "0 0 30px rgba(255,255,255,0.2), 0 0 60px rgba(185,28,28,0.3)",
                        }
                  }
                >
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <span className={secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-500" : ""}>
                      {h}
                    </span>
                    <span className={`mt-1 ${mono.className} text-[9px] sm:text-[11px] font-normal tracking-[0.3em] uppercase ${secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-800/70" : "text-zinc-700"}`}>
                      HRS
                    </span>
                  </div>

                  <span className={`mx-1 sm:mx-2 -translate-y-3 font-thin ${secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-700" : "text-zinc-700"} animate-pulse`}>
                    :
                  </span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <span className={secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-500" : ""}>
                      {m}
                    </span>
                    <span className={`mt-1 ${mono.className} text-[9px] sm:text-[11px] font-normal tracking-[0.3em] uppercase ${secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-800/70" : "text-zinc-700"}`}>
                      MIN
                    </span>
                  </div>

                  <span className={`mx-1 sm:mx-2 -translate-y-3 font-thin ${secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-700" : "text-zinc-700"} animate-pulse`}>
                    :
                  </span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <span className={secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-500" : "text-zinc-200"}>
                      {s}
                    </span>
                    <span className={`mt-1 ${mono.className} text-[9px] sm:text-[11px] font-normal tracking-[0.3em] uppercase ${secondsLeft <= 3600 && totalSeconds > 3600 ? "text-red-800/70" : "text-zinc-700"}`}>
                      SEC
                    </span>
                  </div>
                </div>

                {/* Quick Adjusters */}
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustTime(-300)}
                    disabled={secondsLeft <= 0}
                    className={`${mono.className} rounded border border-zinc-800 bg-black/60 px-3 py-1 text-[10px] text-zinc-500 transition-all hover:border-zinc-600 hover:text-white disabled:opacity-20`}
                  >
                    −5m
                  </button>
                  <button
                    onClick={() => handleAdjustTime(300)}
                    className={`${mono.className} rounded border border-zinc-800 bg-black/60 px-3 py-1 text-[10px] text-zinc-500 transition-all hover:border-zinc-600 hover:text-white`}
                  >
                    +5m
                  </button>
                  <button
                    onClick={() => handleAdjustTime(3600)}
                    className={`${mono.className} rounded border border-zinc-800 bg-black/60 px-3 py-1 text-[10px] text-zinc-500 transition-all hover:border-zinc-600 hover:text-white`}
                  >
                    +1h
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-20 w-full px-5 pb-5 sm:px-8 sm:pb-7">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`${mono.className} text-[9px] uppercase tracking-widest text-zinc-700`}>START</span>
                <span className={`${mono.className} text-[9px] uppercase tracking-widest text-red-900/60`}>{progressPercent.toFixed(1)}% ELAPSED</span>
              </div>
              <div className="h-[2px] w-full bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 shadow-[0_0_8px_rgba(220,38,38,0.6)] transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Fullscreen Controls Overlay */}
            {isFullscreen && (
              <div
                className={`relative z-30 pb-3 flex flex-col items-center gap-3 transition-opacity duration-300 ${
                  showControlsInFullscreen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-4 rounded-full border border-zinc-800 bg-black/90 px-5 py-2 backdrop-blur-md">
                  <button
                    onClick={isRunning ? handlePause : handleStart}
                    aria-label={isRunning ? "Pause timer" : "Start timer"}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                      isRunning
                        ? "border-red-700 bg-red-900/30 text-red-400 shadow-[0_0_12px_rgba(185,28,28,0.5)]"
                        : "border-zinc-700 bg-zinc-900/50 text-white"
                    }`}
                  >
                    {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 translate-x-0.5" />}
                  </button>

                  <button
                    onClick={handleReset}
                    aria-label="Reset timer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-white transition-all"
                  >
                    <ResetIcon className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                    {PRESETS.map((p) => (
                      <button
                        key={p.seconds}
                        onClick={() => handlePreset(p.seconds)}
                        className={`${mono.className} rounded-full px-2.5 py-0.5 text-[11px] uppercase transition-all ${
                          totalSeconds === p.seconds
                            ? "border border-red-800/70 bg-red-900/20 text-red-400"
                            : "text-zinc-600 hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* External Control Panel */}
        {!isFullscreen && (
          <div className="mt-6 sm:mt-8 flex w-full max-w-xl flex-col items-center gap-5">
            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESETS.map((p) => {
                const active = totalSeconds === p.seconds;
                return (
                  <button
                    key={p.seconds}
                    onClick={() => handlePreset(p.seconds)}
                    className={`${mono.className} rounded-full border px-4 py-1 text-[11px] uppercase tracking-widest transition-all duration-200 ${
                      active
                        ? "border-red-800/70 bg-red-900/20 text-red-400"
                        : "border-zinc-800 bg-transparent text-zinc-600 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <button
                onClick={() => setIsSetup(true)}
                className={`${mono.className} rounded-full border px-4 py-1 text-[11px] uppercase tracking-widest transition-all duration-200 border-zinc-800 bg-transparent text-zinc-600 hover:border-red-900 hover:text-red-400`}
              >
                Custom
              </button>
            </div>

            {/* Play / Pause & Reset */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={isRunning ? handlePause : handleStart}
                aria-label={isRunning ? "Pause countdown timer" : "Start countdown timer"}
                className={`group relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isRunning
                    ? "border-red-700 bg-red-900/20 text-red-400 shadow-[0_0_30px_rgba(185,28,28,0.4)]"
                    : "border-zinc-700 bg-zinc-900/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                }`}
              >
                <span
                  className={`absolute inset-0 rounded-full ${
                    isRunning ? "border border-red-600/30 animate-ping opacity-20" : "opacity-0"
                  }`}
                />
                {isRunning ? (
                  <PauseIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                ) : (
                  <PlayIcon className="h-6 w-6 sm:h-7 sm:w-7 translate-x-0.5" />
                )}
              </button>

              <button
                onClick={handleReset}
                aria-label="Reset countdown timer"
                className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full border border-zinc-800 bg-transparent text-zinc-600 transition-all hover:scale-105 hover:border-zinc-700 hover:text-zinc-300 active:scale-95"
              >
                <ResetIcon className="h-5 w-5 transition-transform hover:rotate-180 duration-500" />
              </button>
            </div>

            {/* Sync toggle */}
            <div className="flex items-center justify-center pt-1">
              <button
                onClick={() => setSyncVideoWithTimer(!syncVideoWithTimer)}
                className={`${mono.className} flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${syncVideoWithTimer ? "text-zinc-500" : "text-zinc-700"} hover:text-zinc-400`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-sm border transition-colors ${
                    syncVideoWithTimer
                      ? "border-red-800 bg-red-900/40"
                      : "border-zinc-800 bg-transparent"
                  }`}
                />
                Sync video with timer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isFullscreen && (
        <footer className="relative z-10 flex items-center justify-center w-full max-w-5xl px-2 pt-4 pb-2">
          <span className={`${mono.className} text-[10px] uppercase tracking-[0.3em] text-zinc-800`}>
            TIMER PLATFORM
          </span>
        </footer>
      )}
    </main>
  );
}
