"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react";

export default function Loading() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 6000); // simulate loading
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
      {!loaded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-[2.5px] border-turquoise bg-turquoise scale-[3]">
            <div className="relative w-8 h-8 grid grid-cols-3 grid-rows-3 gap-[1.5px]">
              {/* Row 1 */}
              <div></div>
              <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.1s" }}></div>
              <div className="bg-red-600 rounded-tr-full animated-shape" style={{ animationDelay: "0.2s" }}></div>

              {/* Row 2 */}
              <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.3s" }}></div>
              <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.4s" }}></div>
              <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.5s" }}></div>

              {/* Row 3 */}
              <div className="bg-red-600 rounded-bl-full animated-shape" style={{ animationDelay: "0.6s" }}></div>
              <div className="bg-red-600 animated-shape" style={{ animationDelay: "0.7s" }}></div>
              <div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-10">
          <h1 className="text-3xl font-bold text-gray-800">Welcome!</h1>
          <p className="text-gray-600 mt-4">The page is ready 🎉</p>
        </div>
      )}

      <style jsx>{`
        .border-turquoise {
          border-color: #40E0D0;
        }
        .bg-turquoise {
          background-color: #40E0D0;
        }
        @keyframes popFade {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            transform: scale(1);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .animated-shape {
          animation: popFade 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
