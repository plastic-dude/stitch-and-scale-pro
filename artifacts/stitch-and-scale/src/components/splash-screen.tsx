import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate background loading/arranging
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2800); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <img 
                  src="/icon-192.png"
                  alt="Stitch and Scale Logo" 
                  className="w-40 h-40 object-contain drop-shadow-2xl"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay rounded-3xl"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
                  Stitch & Scale
                </h1>
                <motion.p 
                  className="text-sm font-medium text-muted-foreground"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  Empowering your knitwear design business...
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        className={`transition-opacity duration-700 \${isLoading ? "opacity-0 pointer-events-none h-screen overflow-hidden" : "opacity-100"}`}
      >
        {children}
      </div>
    </>
  );
}
