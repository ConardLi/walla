"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface LoadingShimmerProps {
  className?: string;
}

type CharDef = {
  char: string;
  isTarget?: boolean; // Keep this char (C, W, i, M, A)
  toLower?: boolean; // Convert to lowercase in collapsed state (W->w, M->m, A->a)
};

// Original: "Work with Any Local LLM Agent"
// Target: "WALLA"
const CHARS: CharDef[] = [
  { char: "W", isTarget: true },
  { char: "o" },
  { char: "r" },
  { char: "k" },
  { char: "\u00A0" }, // Space
  { char: "w" },
  { char: "i" },
  { char: "t" },
  { char: "h" },
  { char: "\u00A0" }, // Space
  { char: "A", isTarget: true },
  { char: "n" },
  { char: "y" },
  { char: "\u00A0" }, // Space
  { char: "L", isTarget: true },
  { char: "o" },
  { char: "c" },
  { char: "a" },
  { char: "l" },
  { char: "\u00A0" }, // Space
  { char: "L", isTarget: true },
  { char: "L" },
  { char: "M" },
  { char: "\u00A0" }, // Space
  { char: "A", isTarget: true },
  { char: "g" },
  { char: "e" },
  { char: "n" },
  { char: "t" },
];

export function LoadingShimmer({ className }: LoadingShimmerProps) {
  const [state, setState] = useState<"idle" | "highlight" | "collapsed">(
    "collapsed",
  );

  useEffect(() => {
    let mounted = true;
    const runAnimation = async () => {
      // 初始等待
      await delay(200);

      while (mounted) {
        // 1. Collapsed: 展示缩写 "WALLA"
        setState("collapsed");
        await delay(1500);

        // 2. Idle: 展开为 "Work with Any Local LLM Agent"
        setState("idle");
        await delay(1500);

        // 3. Highlight: 高亮关键字母，准备收缩
        setState("highlight");
        await delay(1500);
      }
    };

    runAnimation();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        className,
      )}
    >
      <style jsx>{`
        @keyframes shimmer-text {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-text-shimmer {
          animation: shimmer-text 3s linear infinite;
        }
      `}</style>

      {/* 
        底层：负责颜色、轮廓、变形
        空间优化：
        1. 使用 whitespace-nowrap 防止换行
        2. 使用响应式字体大小，在小屏幕上自动缩小
        3. 使用 tracking-tighter 紧凑字间距
      */}
      <div className="flex items-center gap-3">
        {/* ICON - 仅在 WALLA 状态显示 */}
        <div
          className={cn(
            "relative transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
            state === "collapsed"
              ? "w-10 h-10 sm:w-10 sm:h-10 md:w-10 md:h-10 lg:w-12 lg:h-12 opacity-100 mr-1"
              : "w-0 h-0 opacity-0 mr-0",
          )}
        >
          <img
            src="/common/logo_bg.svg"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative">
          <h1
            className="font-bold tracking-tighter whitespace-nowrap select-none flex items-center justify-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
            aria-label="Work with Any Local LLM Agent -> WALLA"
          >
            {CHARS.map((def, index) => {
              const isTarget = def.isTarget;
              const isCollapsed = state === "collapsed";
              const isHighlight = state === "highlight";

              // 计算样式
              // 非目标字符在 collapsed 状态下宽度变为 0，透明度变为 0
              const isHidden = !isTarget && isCollapsed;

              // 目标字符在 highlight/collapsed 状态下高亮
              const isActive = isTarget && (isHighlight || isCollapsed);

              return (
                <span
                  key={index}
                  className={cn(
                    "inline-block transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center relative",
                    // 宽度控制：利用 max-w 实现收缩动画
                    isHidden
                      ? "max-w-0 opacity-0 scale-50"
                      : "max-w-[2ch] opacity-100 scale-100",
                    // 颜色控制：底层文字颜色
                    isActive ? "text-foreground" : "text-muted-foreground/50",
                    // 大小写转换：利用 CSS lowercase 实现 W->w 等
                    isTarget && isCollapsed && def.toLower && "lowercase",
                  )}
                >
                  {def.char}
                </span>
              );
            })}
          </h1>

          {/* 
            顶层：负责整体流光 (Overlay)
            结构必须与底层完全一致以保证对齐，但文字透明，应用流光背景
          */}
          <h1
            className="absolute inset-0 font-bold tracking-tighter whitespace-nowrap select-none flex items-center justify-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl pointer-events-none animate-text-shimmer bg-clip-text text-transparent bg-gradient-to-r from-transparent via-primary to-transparent bg-[length:200%_auto]"
            aria-hidden="true"
          >
            {CHARS.map((def, index) => {
              const isTarget = def.isTarget;
              const isCollapsed = state === "collapsed";
              const isHidden = !isTarget && isCollapsed;

              return (
                <span
                  key={index}
                  className={cn(
                    "inline-block transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center",
                    isHidden
                      ? "max-w-0 opacity-0 scale-50"
                      : "max-w-[2ch] opacity-100 scale-100",
                    isTarget && isCollapsed && def.toLower && "lowercase",
                  )}
                >
                  {def.char}
                </span>
              );
            })}
          </h1>
        </div>
      </div>

      {/* 倒影效果 */}
      <div
        className={cn(
          "absolute -bottom-8 left-0 w-full h-8 transform scale-y-[-1] mask-image-gradient transition-opacity duration-700",
          state === "collapsed" ? "opacity-10" : "opacity-20",
        )}
      >
        <h1 className="font-bold tracking-tighter whitespace-nowrap text-center text-muted-foreground/10 blur-[2px] text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
          {CHARS.map((def, index) => {
            const isHidden = !def.isTarget && state === "collapsed";
            return (
              <span
                key={index}
                className={cn(
                  "inline-block transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isHidden ? "max-w-0 opacity-0" : "max-w-[2ch] opacity-100",
                  def.isTarget &&
                    state === "collapsed" &&
                    def.toLower &&
                    "lowercase",
                )}
              >
                {def.char}
              </span>
            );
          })}
        </h1>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
