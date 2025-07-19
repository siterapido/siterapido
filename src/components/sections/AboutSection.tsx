import { BlurFade } from "@/components/ui/blur-fade"
import { Badge } from "@/components/ui/badge"

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full bg-white py-20 px-4 flex flex-col items-center justify-center"
    >
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-12 md:gap-20">
        {/* Imagem ilustrativa */}
        <BlurFade delay={0.1} inView className="w-full md:w-1/2 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80"
            alt="Equipe trabalhando"
            className="rounded-3xl shadow-2xl w-full object-cover h-64 md:h-80"
            loading="lazy"
          />
        </BlurFade>
        {/* Texto */}
        <div className="w-full md:w-1/2 flex flex-col items-start">
          <Badge className="mb-6 bg-[#9CD653] text-black">Sobre</Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white text-center">
            {/* Título da seção Sobre */}
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