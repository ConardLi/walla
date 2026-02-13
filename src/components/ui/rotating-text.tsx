"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PHRASES = [
  "Where should we start?",
  "How can I help you today?",
  "You can ask Walla anything!",
];

export function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PHRASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center">
      {/* Rotating Text */}
      <div className="relative h-16 min-w-[600px] overflow-hidden flex items-center justify-center">
        {PHRASES.map((phrase, i) => (
          <div
            key={phrase}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform whitespace-nowrap",
              i === index
                ? "opacity-100 translate-y-0"
                : i < index
                  ? "opacity-0 -translate-y-full"
                  : "opacity-0 translate-y-full",
              // Handle cycling from last to first
              i === 0 &&
                index === PHRASES.length - 1 &&
                "opacity-0 translate-y-full",
              i === PHRASES.length - 1 &&
                index === 0 &&
                "opacity-0 -translate-y-full",
            )}
          >
            <span className="text-4xl font-normal text-foreground tracking-tight leading-none text-center">
              {phrase}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
