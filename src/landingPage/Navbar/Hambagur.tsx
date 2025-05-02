// components/ToggleMenuIcon.tsx

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ToggleMenuIconProps {
  isOpen: boolean;
}

const ToggleMenuIcon: React.FC<ToggleMenuIconProps> = ({ isOpen }) => {
  return (
    <div className="relative w-6 h-6 cursor-pointer">
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <X className="text-gray-700 w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Menu className="text-gray-700 w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToggleMenuIcon;
