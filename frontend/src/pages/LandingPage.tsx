import { GitCompare, MessageSquare, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { FeatureSection } from '../components/landing/FeatureSection'
import { Hero } from '../components/landing/Hero'
import { InterestModal } from '../components/landing/InterestModal'
import { InterestSection } from '../components/landing/InterestSection'
import { LandingNav } from '../components/landing/LandingNav'

export function LandingPage() {
  const [interestOpen, setInterestOpen] = useState(false)
  const openInterest = () => setInterestOpen(true)

  return (
    <div className="landing-page fut-bg min-h-[100dvh] scroll-smooth w-full overflow-x-hidden">
      <LandingNav onInterestClick={openInterest} />
      <Hero onInterestClick={openInterest} />

      <div id="features" className="space-y-4 sm:space-y-8 lg:space-y-12">
        <FeatureSection
          id="outliers"
          eyebrow="Análise de outliers"
          title="Talentos escondidos nos dados"
          description="Identifique jogadores com métricas excepcionais que escapam ao olhar tradicional. Nosso algoritmo destaca prospectos com scores de raridade e impacto fora da curva."
          bullets={[
            'Ranking dinâmico por métrica de performance',
            'Scores de prospecto, raridade e impacto',
            'Filtros por temporada, posição e clube',
          ]}
          videoKey="outliers"
          icon={<TrendingUp className="w-5 h-5 text-fut-gold" />}
        />

        <FeatureSection
          id="compare"
          eyebrow="Comparação"
          title="Compare jogadores lado a lado"
          description="Visualize radar charts e métricas detalhadas entre dois atletas. Tome decisões mais rápidas com insights gerados por IA sobre as diferenças-chave."
          bullets={[
            'Radar chart interativo por posição',
            'Métricas per 90 alinhadas ao contexto',
            'Insight automático com IA',
          ]}
          videoKey="compare"
          reverse
          icon={<GitCompare className="w-5 h-5 text-fut-emerald" />}
        />

        <FeatureSection
          id="chat"
          eyebrow="Chat com IA"
          title="Pergunte qualquer coisa sobre os jogadores"
          description="Assistente de scouting fundamentado nos dados do seu dataset. Compare atletas, explore clusters e obtenha respostas contextualizadas em linguagem natural."
          bullets={[
            'Respostas ancoradas nos dados reais',
            'Contexto de jogador ou comparação',
            'Histórico de conversa por sessão',
          ]}
          videoKey="chat"
          icon={<MessageSquare className="w-5 h-5 text-fut-gold" />}
        />
      </div>

      <InterestSection onInterestClick={openInterest} />

      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} Scout Radar. Todos os direitos reservados.</p>
      </footer>

      <InterestModal open={interestOpen} onClose={() => setInterestOpen(false)} />
    </div>
  )
}
