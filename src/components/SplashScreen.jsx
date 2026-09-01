import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';

/**
 * SplashScreen — Serif "R" logo animation
 *
 * Sequence:
 *   0.0s  — Dark background
 *   0.2s–1.0s — "r" fades in and slightly scales up
 *   1.0s–1.8s — Hold
 *   1.8s+ — onDone() called → library crossfades in
 *
 * Props:
 *   onDone  fn()  called when animation finishes
 */
export default function SplashScreen({ onDone }) {
  useEffect(() => {
    CapSplashScreen.hide().catch(e => console.warn(e));
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#1f1e1b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        <span style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 120,
          fontWeight: 'normal',
          color: '#F7F5EE',
        }}>
          r
        </span>
      </motion.div>
    </motion.div>
  );
}
