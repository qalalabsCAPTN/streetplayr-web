"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LaunchExperience() {
  const [phase, setPhase] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 0 = Landing
  // 1 = Video
  // 2 = Form
  // 3 = Success

  const handleEnter = () => {
    setPhase(1);
  };

  const handleSkipVideo = () => {
    setPhase(2);
  };

  const handleVideoEnd = () => {
    setPhase(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the form data to your backend here
    setPhase(3);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white font-body">
      <AnimatePresence mode="wait">
        {/* PHASE 0: Landing Screen */}
        {phase === 0 && (
          <motion.div
            key="phase-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-center"
            >
              <h1 className="font-display text-6xl md:text-8xl tracking-widest uppercase mb-4">
                Street PlayR
              </h1>
              <p className="font-mono text-sm md:text-base tracking-[0.3em] uppercase text-gray-400 mb-12">
                The New Standard of Streetwear
              </p>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              onClick={handleEnter}
              className="group relative overflow-hidden border border-white/20 bg-transparent px-8 py-4 font-mono text-sm tracking-[0.2em] uppercase transition-all hover:border-white hover:bg-white hover:text-black"
            >
              <span className="relative z-10">Enter The Play</span>
            </motion.button>
          </motion.div>
        )}

        {/* PHASE 1: Video Screen */}
        {phase === 1 && (
          <motion.div
            key="phase-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
            className="absolute inset-0 z-20 bg-black flex items-center justify-center"
          >
            <video
              ref={videoRef}
              src="/assets/videos/WebAnimation_V1.mp4"
              autoPlay
              playsInline
              muted
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            />
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              onClick={handleSkipVideo}
              className="absolute bottom-10 right-10 text-white/50 hover:text-white font-mono text-xs tracking-widest uppercase z-30 transition-colors"
            >
              Skip Video
            </motion.button>
          </motion.div>
        )}

        {/* PHASE 2: Lead Generation Form */}
        {phase === 2 && (
          <motion.div
            key="phase-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black p-6"
          >
            <div className="w-full max-w-md">
              <div className="text-center mb-10">
                <h2 className="font-display text-4xl md:text-5xl tracking-widest uppercase mb-2">
                  Join The Drop
                </h2>
                <p className="font-mono text-xs text-gray-400 tracking-widest uppercase">
                  Exclusive Access. Limited Quantities.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="FULL NAME"
                    className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-0 transition-colors rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="email"
                    required
                    placeholder="EMAIL ADDRESS"
                    className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-0 transition-colors rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="tel"
                    required
                    placeholder="PHONE NUMBER"
                    className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-0 transition-colors rounded-none"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="INSTAGRAM HANDLE (OPTIONAL)"
                    className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-0 transition-colors rounded-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-white text-black py-4 mt-8 font-mono text-sm tracking-[0.2em] uppercase font-bold hover:bg-gray-200 transition-colors"
                >
                  Join The Drop
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {/* PHASE 3: Success Screen */}
        {phase === 3 && (
          <motion.div
            key="phase-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black p-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center"
            >
              <h2 className="font-display text-5xl md:text-7xl tracking-widest uppercase mb-4">
                You're On The List
              </h2>
              <p className="font-mono text-sm text-gray-400 tracking-widest uppercase">
                Keep an eye on your inbox.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
