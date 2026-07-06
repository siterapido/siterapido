import { BlurFade } from "@/components/ui/blur-fade"
import { Badge } from "@/components/ui/badge"

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full bg-white py-20 px-4 flex flex-col items-center justify-center"
    >
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-start gap-12 md:gap-20">
        <div className="w-full md:w-1/2 shrink-0 overflow-visible bg-[#F1F3F2]">
          <img
            src="/assets/optimized/site-hero-cerna-hero-v2.webp"
            alt="Equipe Site Rápido criando sites para clientes"
            className="block w-full h-auto max-w-full object-contain shadow-none rounded-none border-0 outline-none"
            style={{ boxShadow: "none", filter: "none" }}
            loading="lazy"
            draggable={false}
          />
        </div>
        {/* Texto */}
        <div className="w-full md:w-1/2 flex flex-col items-start">
          <Badge className="mb-6 bg-[#9CD653] text-black">Sobre</Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-neutral-900 text-left">
            Quem faz seu site ficar no ar
          </h2>
          <BlurFade delay={0.2} inView>
            <p className="text-lg md:text-xl text-neutral-800 mb-8 leading-relaxed">
              Somos uma equipe de especialistas em marketing digital e desenvolvimento web, cansados de ver pequenos negócios pagando caro por sites básicos.
            </p>
          </BlurFade>
          <BlurFade delay={0.3} inView>
            <p className="text-base text-neutral-600 mb-8 leading-relaxed">
              Nossa missão é simples: democratizar a presença online para quem realmente precisa crescer.
            </p>
          </BlurFade>
          <BlurFade delay={0.4} inView>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 text-sm font-semibold text-neutral-700">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Mais de 500 sites criados</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>3 anos de mercado</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Nota 4.9 no Google</span>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  )
} 