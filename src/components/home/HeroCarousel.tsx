"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";

/**
 * Overa hero carousel — completes the previously decorative hero banner
 * while preserving its exact visual language (rounded-3xl purple gradient
 * overlay, white text, pill badges, the same dot indicators).
 *
 * - Embla (already in the project): infinite loop, RTL, drag/swipe on both
 *   desktop (mouse) and mobile (touch). No prev/next arrows are rendered.
 * - Auto-plays every 5s; pauses while hovered, focused or dragged, when the
 *   tab is hidden, and completely for `prefers-reduced-motion` users.
 * - Dots double as slide navigation buttons (keyboard accessible).
 * - Each slide links to its real category on /categories.
 */

type Slide = {
  image: string;
  alt: string;
  badge: string;
  title: React.ReactNode;
  description: string;
  cta: string;
  href: string;
};

const SLIDES: Slide[] = [
  {
    image: "/assets/img/banner1.png",
    alt: "دوربین حرفه‌ای سونی برای اجاره در اٌوِرا",
    badge: "لوازم دیجیتال و دوربین",
    title: (
      <>
        هر چیزی که نیاز داری،
        <br />
        فقط برای مدتی کوتاه!
      </>
    ),
    description:
      "دوربین، لنز و تجهیزات تولید محتوا را اجاره بگیر؛ هزینه صدها میلیون، فقط یک‌دهم می‌شود.",
    cta: "مشاهده تجهیزات فیلم‌برداری",
    href: "/categories?tab=cameras",
  },
  {
    image: "/assets/img/banner2.png",
    alt: "چادر و تجهیزات کمپینگ در دل طبیعت",
    badge: "سفر و کمپینگ",
    title: "سفر سبک، طبیعت بی‌نهایت",
    description:
      "چادر، کوله، یخچال کمپینگی و صندلی تاشو — همه تجهیزات سفرت را اجاره کن و چمدان سبک‌تری ببند.",
    cta: "ورود به دسته سفر و کمپینگ",
    href: "/categories?tab=camping",
  },
  {
    image: "/assets/img/banner3.png",
    alt: "لوازم خانگی و وسایل خانه برای اجاره",
    badge: "وسایل خانه و لوازم خانگی",
    title: "خانه‌ای کامل، بدون خرید گران",
    description:
      "از صندلی ماساژور تا لوازم موردنیاز مهمانی و دورهمی؛ وسایل خانه را برای روزی که لازم داری اجاره بگیر.",
    cta: "مشاهده لوازم خانه",
    href: "/categories?category=home",
  },
  {
    image: "/assets/img/banner4.png",
    alt: "ابزار و تجهیزات فنی برای اجاره کوتاه‌مدت",
    badge: "ابزار و تجهیزات فنی",
    title: "ابزار حرفه‌ای، فقط برای روزی که لازم داری",
    description:
      "دریل، موتور برق و ابزار ساختمانی؛ به‌جای خرید، برای پروژه‌تان چند روزه اجاره کنید.",
    cta: "ورود به دسته ابزار و تجهیزات",
    href: "/categories?tab=tools",
  },
];

const AUTOPLAY_MS = 5000; // within the requested 4–6s window

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    skipSnaps: false,
    duration: 28,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false); // armed in effect below
  const reducedMotion = useRef(false);

  // Respect the OS "reduce motion" setting: no auto-play at all.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    // Initial arming happens on the next frame (external system callback —
    // never a synchronous setState inside the effect body).
    const raf = requestAnimationFrame(() => {
      if (!mq.matches) setPlaying(true);
    });
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
      setPlaying(!e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  // Track selected slide (loop + user drag + programmatic scroll).
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Auto-play engine: a plain interval over scrollNext() — no extra deps.
  useEffect(() => {
    if (!emblaApi || !playing) return;
    const id = setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [emblaApi, playing, selectedIndex]); // restart after each selection too

  // Pause while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setPlaying(false);
      else if (!reducedMotion.current) setPlaying(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Pause during drag; resume when released.
  useEffect(() => {
    if (!emblaApi) return;
    const pause = () => setPlaying(false);
    const resume = () => {
      if (!reducedMotion.current) setPlaying(true);
    };
    emblaApi.on("pointerDown", pause);
    emblaApi.on("pointerUp", resume);
    return () => {
      emblaApi.off("pointerDown", pause);
      emblaApi.off("pointerUp", resume);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  return (
    <section
      className="relative rounded-3xl overflow-hidden shadow-xl min-h-[320px] md:min-h-[360px] lg:min-h-[410px] text-white mt-4 bg-[#1e1143] ring-1 ring-white/10"
      aria-label="بنر اصلی"
      aria-roledescription="carousel"
      role="region"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => {
        if (!reducedMotion.current) setPlaying(true);
      }}
      onFocus={() => setPlaying(false)}
      onBlur={() => {
        if (!reducedMotion.current) setPlaying(true);
      }}
    >
      {/* Embla track is forced LTR (Embla's well-tested code path) while the
          slide CONTENT stays RTL — full-width slides make this invisible
          except for the direction new slides enter from. */}
      <div className="overflow-hidden h-full" ref={emblaRef} dir="ltr">
        <div className="flex h-full">
          {SLIDES.map((s) => (
            <div
              key={s.href}
              dir="rtl"
              className="flex-[0_0_100%] min-w-0 relative flex items-center p-8 md:p-12"
            >
              {/* Slide photograph */}
              <img
                src={s.image}
                alt={s.alt}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
                loading="eager"
              />
              {/* Same purple gradient language as the original hero banner —
                  keeps white text readable over every photograph. */}
              <div
                className="absolute inset-0 bg-gradient-to-l from-[#1e1143]/90 via-[#4c2a9e]/70 to-[#4c2a9e]/25 pointer-events-none"
                aria-hidden="true"
              ></div>
              {/* Polished finish: bottom vignette (keeps the dots readable),
                  a soft gold glow and floating purple orbs for depth. */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#160b31]/75 via-transparent to-[#1e1143]/25 pointer-events-none"
                aria-hidden="true"
              ></div>
              <div
                className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[#f5a623]/15 blur-3xl pointer-events-none"
                aria-hidden="true"
              ></div>
              <div
                className="absolute -top-20 right-1/4 w-64 h-64 rounded-full bg-primary-light/20 blur-3xl pointer-events-none"
                aria-hidden="true"
              ></div>

              <div className="relative z-10 max-w-2xl flex flex-col items-start gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-100 shadow-sm">
                  <svg
                    className="w-3.5 h-3.5 text-[#f5a623]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2l1.9 5.7a2 2 0 001.3 1.3L21 11l-5.8 1.9a2 2 0 00-1.3 1.3L12 20l-1.9-5.8a2 2 0 00-1.3-1.3L3 11l5.8-2a2 2 0 001.3-1.3L12 2z"></path>
                  </svg>
                  <span>{s.badge}</span>
                </div>
                {/* Gold accent underline — echoes the brand's golden tone */}
                <span
                  className="block w-12 h-1 rounded-full bg-gradient-to-l from-[#f5a623] to-[#f5a623]/30"
                  aria-hidden="true"
                ></span>
                <h1
                  className={`font-black leading-snug tracking-tight ${
                    s.badge === SLIDES[0].badge
                      ? "text-3xl lg:text-4xl"
                      : "text-2xl lg:text-3xl"
                  }`}
                >
                  {s.title}
                </h1>
                <p className="text-sm md:text-base text-purple-100/90 leading-relaxed max-w-xl font-normal">
                  {s.description}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Link
                    href={s.href}
                    className="px-7 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-purple-900/40 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <span>{s.cta}</span>
                    <svg
                      className="w-4 h-4 rtl:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </Link>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-purple-200/95 bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <svg
                      className="w-3.5 h-3.5 text-[#f5a623]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                    </svg>
                    <span>اجاره کن به‌جای خرید</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators (double as navigation) — no arrows by design. */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SLIDES.map((s, i) => (
          <button
            key={s.href}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`اسلاید ${i + 1}: ${s.badge}`}
            aria-current={i === selectedIndex}
            className={`rounded-full transition-all ${
              i === selectedIndex
                ? "w-6 h-2 bg-white"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          ></button>
        ))}
      </div>
    </section>
  );
}
