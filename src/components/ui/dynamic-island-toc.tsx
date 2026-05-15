import { useState, useEffect, ReactNode, useMemo } from "react";
import { motion, AnimatePresence, Transition } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

type HeadingData = {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
};

// --- Shared Animation Configs ---

const islandTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.5,
};

// --- Progress Circle Component ---

function CircleProgress({ percentage }: { percentage: number }) {
  const size = 26;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-zinc-100" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

// --- Main Component ---

type DynamicIslandTOCProps = {
  children?: ReactNode;
  /**
   * CSS selector to find headings.
   * Defaults to common blog content wrappers and explicit [data-toc] elements.
   */
  selector?: string;
};

export function DynamicIslandTOC({
  children,
  selector = "article h1, article h2, article h3, article h4, .prose h1, .prose h2, .prose h3, .prose h4, [data-toc]",
}: DynamicIslandTOCProps) {
  const [headings, setHeadings] = useState<HeadingData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  // 1. DOM Scanning Strategy
  useEffect(() => {
    const getHeadings = () => {
      const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

      const validHeadings = elements
        .filter((el) => !el.hasAttribute("data-toc-ignore")) // Allow explicit skipping
        .map((el, index) => {
          // Auto-generate ID if missing (common in generic Markdown/CMS output)
          if (!el.id) {
            const generatedId =
              el.textContent
                ?.toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "") || `toc-heading-${index}`;
            el.id = generatedId;
          }

          // 1. Check data-toc-depth attribute
          // 2. Fallback to standard HTML tag levels (H1 = 1, H2 = 2)
          // 3. Default to level 2 if not a heading tag
          const depthAttr = el.getAttribute("data-toc-depth");
          let level = 2;

          if (depthAttr) {
            level = parseInt(depthAttr, 10);
          } else {
            const tagName = el.tagName.toUpperCase();
            if (tagName.startsWith("H") && tagName.length === 2) {
              level = parseInt(tagName[1], 10);
            }
          }

          // Allow title overrides via data-toc-title
          const text = el.getAttribute("data-toc-title") || el.textContent || "Section";

          return { id: el.id, text, level, element: el };
        });

      // Sort by DOM order mathematically
      validHeadings.sort((a, b) =>
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );

      setHeadings(validHeadings);
    };

    // Slight delay ensures CMS/Markdown hydration is complete
    const timer = setTimeout(getHeadings, 100);
    return () => clearTimeout(timer);
  }, [selector]);

  // 2. Scroll Spy & Progress
  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId: string | null = null;
      for (const heading of headings) {
        const top = heading.element.getBoundingClientRect().top;
        // 120px offset to trigger active state just as heading reaches the top
        if (top <= 120) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }

      if (!currentActiveId && headings.length > 0) {
        currentActiveId = headings[0].id;
      }

      setActiveId(currentActiveId);

      // We need to calculate progress specifically within the article container if possible,
      // but since document is used, we stick to scrollY / total
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0);
    };

    // Listen to scroll events on window, but also can attach to specific scrollable containers if needed.
    // For our app, the central panel might be the one scrolling instead of the window, so we might need a general query.
    // Wait, let's fix this for the standard layout by using a ResizeObserver or attaching to an element with `data-toc-scroll`.
    // We'll leave it as `window` for now but also check for typical layout containers
    const scrollContainer = document.querySelector('[data-toc-scroll]') || window;
    
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => scrollContainer.removeEventListener("scroll", handleScroll as EventListener);
  }, [headings]);
  
  // Alternative progress tracker for nested scroll containers
  useEffect(() => {
    const scrollContainer = document.querySelector('[data-toc-scroll]') as HTMLElement;
    const handleScrollForProgress = () => {
       let currentActiveId: string | null = null;
       for (const heading of headings) {
         const top = heading.element.getBoundingClientRect().top;
         // Adjusting offset based on container
         if (top <= 200) {
           currentActiveId = heading.id;
         } else {
           break;
         }
       }
 
       if (!currentActiveId && headings.length > 0) {
         currentActiveId = headings[0].id;
       }
 
       setActiveId(currentActiveId);

       const el = scrollContainer;
       if (el) {
          const total = el.scrollHeight - el.clientHeight;
          setProgress(total > 0 ? Math.min(100, Math.max(0, (el.scrollTop / total) * 100)) : 0);
       }
    };
    if (scrollContainer) {
       scrollContainer.addEventListener('scroll', handleScrollForProgress, { passive: true });
       handleScrollForProgress();
       return () => scrollContainer.removeEventListener('scroll', handleScrollForProgress);
    }
  }, [headings]);


  const activeHeading = headings.find((h) => h.id === activeId);

  // Normalize depths so the highest-level heading in the doc touches the left edge
  const minLevel = useMemo(() => {
    if (headings.length === 0) return 1;
    return Math.min(...headings.map((h) => h.level));
  }, [headings]);

  return (
    <>
      {children}

      {/* Backdrop Blur Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={islandTransition}
            className="absolute inset-0 z-[9998] bg-black/20"
            onClick={() => setIsExpanded(false)}
            style={{ position: 'fixed' }} // Default to fixed
          />
        )}
      </AnimatePresence>

      {/* Dynamic Island Wrapper */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[30px] left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center"
      >
          <motion.div
            initial={false}
            animate={{
              width: isExpanded ? 340 : 280,
              height: isExpanded ? 440 : 64,
              borderRadius: isExpanded ? 30 : 100,
            }}
            transition={islandTransition}
            style={{ cursor: isExpanded ? "default" : "pointer" }}
            className="relative overflow-hidden border-4 border-ink bg-white text-ink shadow-[12px_12px_0_#2b1720]"
          >
            {/* CLOSED PILL CONTENT */}
            <motion.div
              initial={false}
              animate={{
                opacity: isExpanded ? 0 : 1,
                scale: isExpanded ? 0.95 : 1,
              }}
              transition={{ ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
              className={cn("absolute inset-0 flex items-center gap-4 px-6 sm:px-7", isExpanded && "pointer-events-none")}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1 pl-1">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)] animate-pulse" />
                <div className="relative flex h-full flex-1 items-center overflow-hidden text-left">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={activeId || "empty"}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-ink/40 font-mono"
                    >
                      {activeHeading?.text || "Contents"}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <CircleProgress percentage={progress} />
            </motion.div>

            {/* EXPANDED MENU CONTENT */}
            <motion.div
              initial={false}
              animate={{
                opacity: isExpanded ? 1 : 0,
                scale: isExpanded ? 1 : 1.05,
              }}
              transition={{ ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
              className={cn("absolute inset-0 flex flex-col", !isExpanded && "pointer-events-none")}
            >
              <div className="flex shrink-0 items-center justify-between px-8 pb-4 pt-8">
                <span className="text-[12px] font-black tracking-widest text-ink uppercase">
                  Map <span className="text-primary italic">Index</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="w-10 h-10 rounded-full bg-bg-surface border-2 border-ink shadow-[4px_4px_0_#2b1720] flex items-center justify-center text-ink hover:bg-strawberry/10 transition-colors active:shadow-none translate-x-1"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8" data-lenis-prevent="true">
                <div className="flex flex-col gap-1.5 pt-2">
                  {headings.map((h) => {
                    const isActive = activeId === h.id;
                    const isHovered = hoveredId === h.id;

                    const indentLevel = Math.max(0, h.level - minLevel);
                    const paddingLeft = indentLevel * 14 + 14;

                    return (
                      <button
                        key={h.id}
                        onMouseEnter={() => setHoveredId(h.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const yOffset = -80;
                          const scrollContainer = document.querySelector('[data-toc-scroll]') as HTMLElement;
                          
                          if (scrollContainer) {
                             const containerTop = scrollContainer.getBoundingClientRect().top;
                             const y = h.element.getBoundingClientRect().top - containerTop + scrollContainer.scrollTop + yOffset;
                             scrollContainer.scrollTo({ top: y, behavior: "smooth" });
                          } else {
                             const y = h.element.getBoundingClientRect().top + window.scrollY + yOffset;
                             window.scrollTo({ top: y, behavior: "smooth" });
                          }
                          
                          setIsExpanded(false);
                        }}
                        style={{ paddingLeft: `${paddingLeft}px` }}
                        className={cn(
                          "group flex w-full shrink-0 cursor-pointer items-center rounded-2xl border-none py-3 pr-4 text-left text-sm transition-all duration-300 ease-out",
                          isActive && "bg-primary/10 font-black text-primary",
                          !isActive && isHovered && "bg-bg-surface text-ink",
                          !isActive && !isHovered && "bg-transparent text-ink/40",
                        )}
                      >
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-transform duration-300 group-hover:translate-x-1">
                          {h.text}
                        </span>

                        <motion.div
                          initial={false}
                          animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="ml-3 h-2 w-2 shrink-0 rounded-full bg-primary"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
      </motion.div>
    </>
  );
}
