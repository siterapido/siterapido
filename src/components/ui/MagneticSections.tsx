import React, { useRef, useEffect, useState, type ReactNode } from "react";
import gsap from "gsap";

interface MagneticSectionsProps {
  children: ReactNode[];
}

export const MagneticSections: React.FC<MagneticSectionsProps> = ({ children }) => {
  const sectionsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [current, setCurrent] = useState(0);
  const isAnimating = useRef(false);

  // Previne scroll padrão
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    return () => window.removeEventListener("wheel", preventScroll);
  }, []);

  // Animação GSAP
  const goToSection = (index: number) => {
    if (isAnimating.current || index === current) return;
    isAnimating.current = true;
    const fromSection = sectionsRef.current[current];
    const toSection = sectionsRef.current[index];
    if (!fromSection || !toSection) return;

    // Prepara a seção destino
    gsap.set(toSection, { y: index > current ? "100%" : "-100%", zIndex: 2 });
    gsap.set(fromSection, { zIndex: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(index);
        isAnimating.current = false;
      },
    });

    tl.to(fromSection, {
      skewY: index > current ? -10 : 10,
      scaleY: 1.2,
      duration: 0.7,
      ease: "power2.in",
    })
      .to(
        fromSection,
        {
          y: index > current ? "-100%" : "100%",
          duration: 0.7,
          ease: "power2.in",
        },
        "-=0.7"
      )
      .to(
        toSection,
        {
          y: "0%",
          skewY: 0,
          scaleY: 1,
          duration: 1.1,
          ease: "elastic.out(1, 0.75)",
        },
        "-=0.4"
      );
  };

  // Captura rolagem
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (isAnimating.current) return;
      if (e.deltaY > 0 && current < children.length - 1) {
        goToSection(current + 1);
      } else if (e.deltaY < 0 && current > 0) {
        goToSection(current - 1);
      }
    };
    window.addEventListener("wheel", onWheel);
    return () => window.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line
  }, [current, children.length]);

  // Garante que só a seção atual está visível após animação
  useEffect(() => {
    sectionsRef.current.forEach((section, idx) => {
      if (!section) return;
      if (idx === current) {
        gsap.set(section, { y: 0, skewY: 0, scaleY: 1, zIndex: 2 });
      } else {
        gsap.set(section, { y: idx > current ? "100%" : "-100%", skewY: 0, scaleY: 1, zIndex: 1 });
      }
    });
    // eslint-disable-next-line
  }, [current, children.length]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {React.Children.map(children, (child, idx) => (
        <div
          ref={el => {
            sectionsRef.current[idx] = el;
            // Não retorna nada (void)
          }}
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center will-change-transform"
          style={{ zIndex: idx === current ? 2 : 1 }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default MagneticSections; 