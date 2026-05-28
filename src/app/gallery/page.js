"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  FaDownload,
  FaExpandAlt,
  FaTimes,
  FaDumbbell,
  FaArrowRight,
  FaCalendarAlt,
  FaCoins,
  FaSyncAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState(null);

  const fetchCreations = async (silent = false) => {
    if (!session) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        // Keep only completed or failed creations for the public gallery view
        setCreations(data);
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCreations();
    }
  }, [session]);

  // Handle download
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

  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin flex items-center justify-center">
          <FaDumbbell className="text-primary-500 text-lg animate-bounce" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6 bg-background">
        <div className="w-16 h-16 rounded bg-primary-500/10 flex items-center justify-center">
          <FaDumbbell className="text-primary-500 text-3xl pulse-glow" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
            SIMULATION ARCHIVE
          </h2>
          <p className="text-xs text-muted/80 leading-relaxed font-semibold max-w-xs mx-auto">
            Please sign in to view your complete archive of high-fidelity physique simulation gallery.
          </p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded transition-all shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          Sign In to Access
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent overflow-y-auto custom-scrollbar p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-16 text-center space-y-4 pt-4 md:pt-0">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-bold tracking-[0.4em] uppercase">
          Your visual achievements
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-foreground drop-shadow-sm uppercase">
          SIMULATION ARCHIVE
        </h1>
        <p className="text-muted font-bold text-[10px] uppercase tracking-widest max-w-xl mx-auto leading-loose">
          A complete, responsive archive of your physique and body simulator creations. Click on any thumbnail for high-fidelity comparison and HD download.
        </p>
      </header>

      {loading && creations.length === 0 ? (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : creations.length === 0 ? (
        <div className="max-w-md mx-auto text-center space-y-6 py-20 p-8 rounded bg-glass-bg border border-glass-border">
          <div className="w-16 h-16 rounded bg-primary-500/10 flex items-center justify-center mx-auto">
            <FaDumbbell className="text-primary-500 text-3xl" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-black tracking-tight text-foreground uppercase">
              No Simulations Found
            </h3>
            <p className="text-xs text-muted/80 leading-relaxed font-semibold">
              You haven't run any physique simulations yet. Upload a photo and shape your target physique now!
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest rounded transition-all shadow-lg hover:scale-105 group"
          >
            Start Simulator
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          <div className="flex items-center justify-end px-2">
            <button 
              onClick={() => fetchCreations()}
              className="p-2 text-muted hover:text-foreground text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer font-bold uppercase tracking-wider bg-solid-bg/50 border border-glass-border rounded"
            >
              <FaSyncAlt className={`text-[9px] ${loading ? 'animate-spin' : ''}`} />
              Sync Archive
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {creations.map((creation, index) => (
              <motion.div
                key={creation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (creation.status === "completed") {
                    setSelectedCreation(creation);
                  }
                }}
                className={`relative aspect-[4/3] rounded overflow-hidden bg-glass-bg border border-glass-border hover:border-primary-500/50 shadow-sm cursor-pointer group transition-all hover:scale-[1.02]`}
              >
                <img
                  src={creation.status === "completed" ? creation.resultImage : creation.inputImage}
                  alt={creation.prompt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {creation.status === "processing" ? (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[8px] text-yellow-500 font-black uppercase tracking-widest">Reconfiguring...</span>
                  </div>
                ) : creation.status === "failed" ? (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-950 flex items-center justify-center">
                      <FaTimes className="text-red-500 text-xs" />
                    </div>
                    <span className="text-[8px] text-red-400 font-black uppercase tracking-widest">Failed</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider mb-1">Success</span>
                    <p className="text-[10px] font-semibold text-white truncate w-full mb-2">
                      {creation.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-medium text-muted">{creation.resolution} quality</span>
                      <FaExpandAlt className="text-white text-xs" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal Component */}
      <AnimatePresence>
        {selectedCreation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-solid-bg border border-glass-border rounded w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-auto max-h-[90vh]"
            >
              {/* Image Preview Container (Left) */}
              <div className="flex-1 bg-black flex items-center justify-center relative p-2 min-h-[300px] lg:min-h-[500px]">
                <img
                  src={selectedCreation.resultImage}
                  alt="Fitness Simulation Result"
                  className="max-w-full max-h-[50vh] lg:max-h-[80vh] object-contain rounded"
                />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedCreation(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-transform hover:scale-105 cursor-pointer z-10"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              {/* Sidebar metadata (Right) */}
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-glass-border bg-glass-bg/40 p-6 flex flex-col justify-between overflow-y-auto overscroll-contain">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-primary-400 uppercase tracking-[0.25em]">Detail Specifications</span>
                    <h3 className="text-lg font-black text-foreground drop-shadow-sm uppercase">Simulated Athlete</h3>
                  </div>

                  {/* Before / After Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Before</span>
                      <div className="aspect-[4/3] rounded overflow-hidden border border-glass-border bg-black">
                        <img
                          src={selectedCreation.inputImage}
                          alt="Input"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-primary-400 uppercase tracking-widest">After</span>
                      <div className="aspect-[4/3] rounded overflow-hidden border border-primary-500/30 bg-black">
                        <img
                          src={selectedCreation.resultImage}
                          alt="Result"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-glass-border/40">
                      <span className="text-muted flex items-center gap-2"><FaCalendarAlt className="text-primary-500" /> Date</span>
                      <span className="text-foreground">{new Date(selectedCreation.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-glass-border/40">
                      <span className="text-muted flex items-center gap-2"><FaCoins className="text-yellow-500" /> Credit Cost</span>
                      <span className="text-foreground">{selectedCreation.creditCost} Credits</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-glass-border/40">
                      <span className="text-muted flex items-center gap-2"><FaDumbbell className="text-primary-500" /> Resolution</span>
                      <span className="text-foreground uppercase">{selectedCreation.resolution}</span>
                    </div>
                  </div>

                  {/* Prompt Box */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest">Reconfiguration Prompt</span>
                    <div className="p-4 bg-solid-bg/60 border border-glass-border rounded text-xs font-semibold leading-relaxed text-foreground/90">
                      {selectedCreation.prompt}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6">
                  <button
                    onClick={() => handleDownload(selectedCreation.resultImage, `fitness-simulation-${selectedCreation.id}.jpg`)}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    <FaDownload className="text-xs" />
                    Download High Resolution
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
