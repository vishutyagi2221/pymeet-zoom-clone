import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink text-white">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="h-12 w-12 rounded-full border-2 border-cyan-300 border-t-transparent" />
    </div>
  );
}
