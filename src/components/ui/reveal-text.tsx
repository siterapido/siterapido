import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React from "react";

gsap.registerPlugin(ScrollTrigger);

type RevealTextProps = {
  text: string;
  as?: React.ElementType;
  className?: string;
  wordsPerStep?: number;
  blurDuration?: number; // em segundos
  stagger?: number; // intervalo entre palavras
  delay?: number; // delay inicial
};

export function RevealText({
  text,
  as = "h2",
  className = "",
  wordsPerStep = 2,
  blurDuration = 1.2, // padrão mais lento
  stagger = 0.12,
  delay = 0,
}: RevealTextProps) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    const words = ref.current.querySelectorAll("span[data-word]");
    gsap.set(words, { opacity: 0, filter: "blur(8px)" });

    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: ref.current,
        start: "top 80%",
        end: "bottom 20%",
        // scrub removido para animação baseada em tempo
        once: true,
      },
    });

    for (let i = 0; i < words.length; i += wordsPerStep) {
      tl.to(
        Array.from(words).slice(i, i + wordsPerStep),
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: blurDuration, // timing customizável
          stagger: stagger,
          ease: "power2.out",
        },
        i === 0 ? `+=${delay}` : "+=0.05"
      );
    }

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st: any) => st.kill());
    };
  }, [text, wordsPerStep, blurDuration, stagger, delay]);

  const Tag = as || "h2";
  return (
    <Tag
      ref={ref}
      className={`reveal-text font-extrabold ${className}`}
      style={{ display: "flex", flexWrap: "wrap", lineHeight: 1.2 }}
    >
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          data-word
          style={{
            marginRight: "0.4em",
            display: "inline-block",
            filter: "blur(8px)",
            opacity: 0,
            transition: `filter ${blurDuration}s, opacity ${blurDuration}s`,
          }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
} 