"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  FaBolt,
  FaChevronDown,
  FaDownload,
  FaExpand,
  FaTrash,
  FaSyncAlt,
  FaUpload,
  FaDumbbell,
  FaExclamationTriangle,
  FaImages,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const ASPECT_RATIOS = [
  { label: "Auto Detect", value: "Auto" },
  { label: "1:1 Square", value: "1:1" },
  { label: "16:9 Landscape", value: "16:9" },
  { label: "9:16 Portrait", value: "9:16" },
  { label: "4:3 Classic", value: "4:3" },
  { label: "3:4 Classic", value: "3:4" },
  { label: "4:5 Portrait", value: "4:5" },
];

const RESOLUTIONS = [
  { value: "1k", label: "1K Resolution", cost: 24, desc: "High quality simulation" },
  { value: "2k", label: "2K Resolution", cost: 24, desc: "Ultra-sharp fitness details" },
  { value: "4k", label: "4K Resolution", cost: 36, desc: "Extreme HD athletic details" },
];

export default function Home() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  // Dropdown States
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isResOpen, setIsResOpen] = useState(false);
  const ratioRef = useRef(null);
  const resRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form States
  const [prompt, setPrompt] = useState("athletic slim muscular physique, shredded six pack abs, toned athletic legs, high-definition sports photoshoot, aesthetic posture");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [inputImage, setInputImage] = useState(null); // String URL
  const [isUploading, setIsUploading] = useState(false);

  // Simulation Status States
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [error, setError] = useState(null);

  // Creations List (Workspace History)
  const [creations, setCreations] = useState([]);
  const [loadingCreations, setLoadingCreations] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (ratioRef.current && !ratioRef.current.contains(event.target)) {
        setIsRatioOpen(false);
      }
      if (resRef.current && !resRef.current.contains(event.target)) {
        setIsResOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch creations on load
  const fetchCreations = async (silent = false) => {
    if (!session) return;
    if (!silent) setLoadingCreations(true);
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setCreations(data);
      }
    } catch (err) {
      console.error("Failed to fetch creations:", err);
    } finally {
      if (!silent) setLoadingCreations(false);
    }
  };

  useEffect(() => {
    fetchCreations();
  }, [session]);

  // Periodic polling for "processing" creations in database (every 4 seconds)
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      const hasProcessing = creations.some(c => c.status === "processing");
      if (hasProcessing) {
        fetchCreations(true); // Silent refresh
        // Also update session to refresh user credit balance in case it changed
        updateSession();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [creations, session]);

  // Handle single image upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload only PNG, JPG, or JPEG images.");
      return;
    }

    if (!session) {
      signIn("google");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed.");
      }

      const data = await res.json();
      if (data.url) {
        setInputImage(data.url);
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Trigger body simulation
  const handleSimulate = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (!inputImage) {
      setError("Please upload an input image first.");
      return;
    }

    if (!prompt.trim()) {
      setError("Please provide a prompt describing your simulation (e.g. ultra shredded physique, six pack abs).");
      return;
    }

    // Verify credits
    if (session.user.credits < resolution.cost) {
      setError(`Insufficient credits. You need ${resolution.cost} credits for ${resolution.label}.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);
      setStatusMessage("RECONFIGURING PHYSICAL ASSETS...");

      const res = await fetch("/api/fitness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          inputImage,
          aspectRatio: aspectRatio.value,
          resolution: resolution.value,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to initiate body simulation.");
      }

      const data = await res.json();
      const { request_id } = data;
      setActiveRequestId(request_id);

      // Start Polling Loop
      await pollStatus(request_id);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      console.error(err);
      setLoading(false);
    }
  };

  // Status Polling Loop
  const pollStatus = async (requestId) => {
    setStatusMessage("EXTRACTING HIGH-FIDELITY DETAILS...");
    try {
      const res = await fetch("/api/fitness/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        throw new Error("Failed to sync with generation engine.");
      }

      const data = await res.json();

      if (data.status === "completed") {
        setResultUrl(data.imageUrl);
        setStatusMessage("");
        setLoading(false);
        fetchCreations(true); // silent updates
        updateSession(); // refresh user credit badge
      } else if (data.status === "failed") {
        throw new Error(data.error || "Simulation failed.");
      } else {
        // Continue polling after 3.5 seconds
        setTimeout(() => pollStatus(requestId), 3500);
      }
    } catch (err) {
      setError(err.message || "An error occurred during simulation verification.");
      setLoading(false);
    }
  };

  // File download helper
  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "fitness-simulation.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full w-full overflow-y-auto lg:overflow-hidden bg-background">
      {/* Sidebar Control Panel */}
      <aside className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-r border-glass-border bg-glass-bg backdrop-blur-3xl flex flex-col shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
        {/* Core Header */}
        <div className="p-6 border-b border-glass-border space-y-2">
          <div className="flex items-center gap-3">
            <FaDumbbell className="text-primary-500 text-xl animate-pulse" />
            <h2 className="text-xl font-black tracking-tight text-foreground drop-shadow-sm">
              FIT ENGINE
            </h2>
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] leading-none">
            Advanced Physique Simulator
          </p>
        </div>

        {/* Input Parameters Form */}
        <div className="flex-1 p-6 space-y-6 custom-scrollbar">
          {/* Image Upload Area (Single Image ONLY) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              1. Upload Your Photo
            </label>
            
            {inputImage ? (
              <div className="relative rounded overflow-hidden border border-glass-border bg-solid-bg aspect-[4/3] group shadow-inner">
                <img
                  src={inputImage}
                  alt="Subject Preview"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button
                    onClick={() => setInputImage(null)}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110 shadow-lg cursor-pointer"
                    title="Remove Photo"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (!session) {
                    signIn("google");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="border-2 border-dashed border-glass-border hover:border-primary-500/50 bg-solid-bg/30 rounded p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all hover:bg-solid-bg/60 group min-h-[220px]"
              >
                <div className="w-12 h-12 rounded bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaUpload className="text-primary-500 text-xl" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Click or drag photo here
                  </p>
                  <p className="text-[10px] text-muted font-bold">
                    Supports PNG, JPG, JPEG (Max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept=".png, .jpg, .jpeg"
                  onChange={handleFileUpload}
                  multiple={false}
                />
              </div>
            )}
          </div>

          {/* Prompt Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              2. Describe Your Fitness Goal
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. athletic slim muscular physique, shredded six pack abs, toned athletic legs, high-definition sports photoshoot, aesthetic posture"
              className="w-full h-28 bg-solid-bg/50 border border-glass-border rounded p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none transition-all placeholder:text-muted/50 text-foreground drop-shadow-sm leading-relaxed"
            />
          </div>

          {/* Aspect Ratio Custom Select */}
          <div className="space-y-2" ref={ratioRef}>
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              3. Select Layout Shape (Aspect Ratio)
            </label>
            <div className="relative">
              <button
                onClick={() => setIsRatioOpen(!isRatioOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-solid-bg/50 border border-glass-border hover:bg-glass-hover shadow-sm rounded text-xs font-semibold transition-all outline-none text-foreground backdrop-blur-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FaExpand className="text-primary-500" />
                  {aspectRatio.label}
                </div>
                <FaChevronDown
                  className={`text-[10px] transition-transform duration-300 ${isRatioOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isRatioOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full mb-2 left-0 right-0 max-h-60 bg-solid-bg border border-glass-border rounded overflow-y-auto overscroll-contain custom-scrollbar shadow-2xl z-[100] p-1.5 backdrop-blur-3xl"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => {
                          setAspectRatio(ratio);
                          setIsRatioOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded text-xs font-semibold transition-all hover:bg-glass-hover ${
                          aspectRatio.value === ratio.value
                            ? "bg-primary-500/10 text-primary-400"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Resolution Custom Select Card */}
          <div className="space-y-2" ref={resRef}>
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              4. Select Output Quality & Resolution
            </label>
            <div className="relative">
              <button
                onClick={() => setIsResOpen(!isResOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-solid-bg/50 border border-glass-border hover:bg-glass-hover shadow-sm rounded text-xs font-semibold transition-all outline-none text-foreground backdrop-blur-md cursor-pointer"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-bold">{resolution.label}</span>
                  <span className="text-[9px] text-muted font-bold uppercase tracking-wider">Costs {resolution.cost} Credits</span>
                </div>
                <FaChevronDown
                  className={`text-[10px] transition-transform duration-300 ${isResOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isResOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-solid-bg border border-glass-border rounded overscroll-contain custom-scrollbar shadow-2xl z-[100] p-1.5 backdrop-blur-3xl"
                  >
                    {RESOLUTIONS.map((resOption) => (
                      <button
                        key={resOption.value}
                        onClick={() => {
                          setResolution(resOption);
                          setIsResOpen(false);
                        }}
                        className={`w-full text-left p-3.5 rounded transition-all hover:bg-glass-hover flex flex-col gap-0.5 ${
                          resolution.value === resOption.value
                            ? "bg-primary-500/10 text-primary-400"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">{resOption.label}</span>
                          <span className="text-[10px] font-black text-yellow-500">{resOption.cost} Credits</span>
                        </div>
                        <span className="text-[9px] font-semibold text-muted/80">{resOption.desc}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded flex items-start gap-3">
              <FaExclamationTriangle className="text-red-400 text-sm mt-0.5 shrink-0" />
              <p className="text-[11px] font-semibold text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleSimulate}
            disabled={loading || isUploading}
            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] shadow-lg disabled:opacity-30 disabled:scale-100 disabled:shadow-none cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Initialize Simulator
                <FaBolt className="text-yellow-400 text-sm" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Workspace Preview Panel */}
      <main className="flex-1 flex flex-col h-full lg:overflow-hidden">
        <div className="flex-1 p-6 md:p-12 flex items-center justify-center min-h-[400px] bg-solid-bg/10 relative">
          <AnimatePresence mode="wait">
            {loading ? (
              /* Loading screen */
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg aspect-square bg-glass-bg border border-glass-border rounded flex flex-col items-center justify-center p-8 text-center space-y-6 shadow-2xl"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-primary-500/10 border-t-primary-500 animate-spin flex items-center justify-center" />
                  <FaDumbbell className="text-primary-500 text-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pulse-glow" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-black tracking-tight text-foreground uppercase">
                    Running Simulation
                  </h3>
                  <p className="text-[10px] text-primary-400 font-bold uppercase tracking-[0.2em] h-5">
                    {statusMessage}
                  </p>
                </div>
              </motion.div>
            ) : resultUrl ? (
              /* Result Panel with Side-by-Side overlay details */
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full max-w-5xl flex items-center justify-center relative rounded overflow-hidden border border-glass-border bg-solid-bg/30 p-2 md:p-6 shadow-2xl"
              >
                {/* Result Image */}
                <div className="relative w-full h-full flex items-center justify-center max-h-[70vh] rounded overflow-hidden bg-black/45">
                  <img
                    src={resultUrl}
                    alt="Fitness Reconfiguration Result"
                    className="max-w-full max-h-full object-contain rounded"
                  />

                  {/* Float overlay of original inputs for context */}
                  <div className="absolute bottom-4 left-4 p-2 bg-glass-bg backdrop-blur-xl border border-glass-border rounded flex items-center gap-3 shadow-2xl max-w-xs transition-opacity duration-300 hover:opacity-10 opacity-95">
                    <img
                      src={inputImage}
                      alt="Original Input"
                      className="w-14 h-14 object-cover rounded border border-white/10"
                    />
                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                      <span className="text-[8px] font-bold text-muted uppercase tracking-wider">Before State</span>
                      <span className="text-[10px] font-semibold text-foreground truncate">Original subject</span>
                    </div>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(resultUrl, "shredded-body-simulation.jpg")}
                      className="p-3 bg-glass-bg border border-glass-border hover:bg-glass-hover text-white rounded flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                      title="Download Full HD"
                    >
                      <FaDownload className="text-sm" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Empty display: Fitness transformation metaphor */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xl text-center space-y-6 p-8 rounded bg-glass-bg border border-glass-border/10 flex flex-col items-center justify-center shadow-xl"
              >
                <div className="w-16 h-16 rounded bg-primary-500/10 flex items-center justify-center border border-primary-500/10">
                  <FaDumbbell className="text-primary-500 text-3xl pulse-glow" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                    Simulation Workspace
                  </h2>
                  <p className="text-xs text-muted/80 leading-relaxed font-semibold max-w-sm mx-auto">
                    Prepare your physique transformation. Upload a photo, enter a prompt detailing your physical goal, and start the high-fidelity simulator.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Recent Creations Drawer */}
        {session && (
          <div className="h-44 border-t border-glass-border bg-glass-bg/50 backdrop-blur-2xl p-4 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <FaImages className="text-primary-500" />
                Recent Simulations
              </span>
              <button 
                onClick={() => fetchCreations()}
                className="p-1 text-muted hover:text-foreground text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FaSyncAlt className={`text-[9px] ${loadingCreations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto flex gap-4 custom-scrollbar pb-1.5 px-2">
              {loadingCreations && creations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted">
                  Loading history...
                </div>
              ) : creations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted font-bold">
                  No simulations yet. Run your first one!
                </div>
              ) : (
                creations.map((creation) => (
                  <div
                    key={creation.id}
                    onClick={() => {
                      if (creation.status === "completed") {
                        setResultUrl(creation.resultImage);
                        setInputImage(creation.inputImage);
                        setPrompt(creation.prompt);
                      } else if (creation.status === "failed") {
                        setError(creation.error || "Simulation failed.");
                      }
                    }}
                    className={`h-24 aspect-[4/3] rounded overflow-hidden bg-solid-bg/60 border shrink-0 relative group cursor-pointer transition-all hover:scale-[1.03] ${
                      creation.status === "processing"
                        ? "border-yellow-500/50"
                        : "border-glass-border hover:border-primary-500/50"
                    }`}
                  >
                    <img
                      src={creation.status === "completed" ? creation.resultImage : creation.inputImage}
                      alt="Creation Thumbnail"
                      className="w-full h-full object-cover"
                    />

                    {/* Status Badge Overlays */}
                    {creation.status === "processing" ? (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-1">
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[7px] text-yellow-500 font-black uppercase tracking-widest">Processing</span>
                      </div>
                    ) : creation.status === "failed" ? (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-1">
                        <FaExclamationTriangle className="text-red-500 text-xs" />
                        <span className="text-[7px] text-red-400 font-black uppercase tracking-widest">Failed</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[7px] text-white font-semibold truncate w-full">
                          {creation.prompt}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
