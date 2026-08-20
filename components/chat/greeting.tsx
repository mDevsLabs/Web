import Image from "next/image";
import { motion } from "framer-motion";

export const Greeting = () => (
  <div className="flex flex-col items-center px-4" key="overview">
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4 size-16 relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src="/logo.png"
        alt="mAI"
        width={64}
        height={64}
        className="rounded-2xl shadow-lg drop-shadow-md"
        priority
      />
    </motion.div>

    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="text-center font-bold text-2xl tracking-tight text-foreground md:text-3xl"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      Comment puis-je vous aider aujourd'hui ?
    </motion.div>
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mt-2.5 text-center text-muted-foreground text-sm max-w-md"
      initial={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      Posez vos questions du quotidien, rédigez des documents ou explorez vos projets avec mAI.
    </motion.div>
  </div>
);
