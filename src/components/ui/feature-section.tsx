"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Feature {
  step: string;
  title?: string;
  content: string;
  image: string;
}

interface FeatureStepsProps {
  features: Feature[];
  className?: string;
  title?: string;
  autoPlayInterval?: number;
  imageHeight?: string;
}

export function FeatureSteps({
  features,
  className,
  autoPlayInterval = 3000,
  imageHeight = "h-[400px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress, features.length, autoPlayInterval]);

  return (
    <div className={cn("w-full p-8 md:p-12 min-h-[900px] flex items-center justify-center", className)}>
      <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
        {/* Título principal */}
        <h1 className="font-extrabold text-center mb-6" style={{ fontSize: "60px", lineHeight: 1.1 }}>Veja como é fácil ter seu site pronto com a Site Rápido:</h1>
        {/* Subtítulo */}
        <p className="text-lg md:text-2xl text-muted-foreground text-center font-medium mb-12 max-w-2xl leading-relaxed">Do briefing à publicação, cuidamos de tudo para você. Sem complicação, sem enrolação, com suporte de verdade.</p>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 w-full md:items-center">
          <div className="order-2 md:order-1 space-y-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-8 md:gap-10"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 mt-1",
                    index === currentFeature
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : "bg-muted border-muted-foreground",
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold mb-3">
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-lg text-muted-foreground leading-relaxed">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            className={cn(
              "order-1 md:order-2 relative overflow-hidden rounded-lg",
              imageHeight
            )}
          >
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ opacity: 0, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-contain transition-transform transform"
                        width={1000}
                        height={500}
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
} 