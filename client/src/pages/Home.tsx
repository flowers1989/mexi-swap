/*
 * DESIGN: Dark Terminal Hacker
 * - Hero section con imagen de fondo y swap widget
 * - Sección de estadísticas con números animados
 * - Features del DEX
 * - Sección del Programa de Migración LP
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SwapWidget from "@/components/SwapWidget";
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  TrendingUp,
  Users,
  Coins,
  BarChart3,
  Rocket,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";

// Componente para números animados
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="font-mono">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  { label: "TVL Total", value: 124500000, prefix: "$", suffix: "", format: true },
  { label: "Volumen 24h", value: 8200000, prefix: "$", suffix: "", format: true },
  { label: "Usuarios Activos", value: 12847, prefix: "", suffix: "", format: false },
  { label: "Pools Activos", value: 156, prefix: "", suffix: "", format: false },
];

const features = [
  {
    icon: Zap,
    title: "Swaps Ultrarrápidos",
    description: "Transacciones en segundos gracias a la red Polygon. Gas fees mínimos.",
  },
  {
    icon: Shield,
    title: "Seguridad Auditada",
    description: "Contratos verificados y auditados por firmas de seguridad líderes.",
  },
  {
    icon: TrendingUp,
    title: "Mejores Tasas",
    description: "Algoritmo de enrutamiento inteligente para obtener los mejores precios.",
  },
  {
    icon: Coins,
    title: "Gana MEXI",
    description: "Provee liquidez y gana tokens MEXI además de fees de trading.",
  },
];

const migrationFeatures = [
  {
    icon: Gift,
    title: "Airdrop Retroactivo",
    description: "LPs de Uniswap, SushiSwap y QuickSwap pueden reclamar tokens MEXI gratis.",
    highlight: "100M MEXI disponibles",
  },
  {
    icon: Rocket,
    title: "Recompensas 10x",
    description: "Durante las primeras 2 semanas, las recompensas de farming son 10 veces mayores.",
    highlight: "APY hasta 500%",
  },
  {
    icon: Users,
    title: "Migración con Un Clic",
    description: "Migra tu liquidez de otros DEX en una sola transacción. Nosotros pagamos el gas.",
    highlight: "Gas subsidiado 50%",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.png" 
            alt="" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="absolute inset-0 grid-bg opacity-30" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terminal-green/10 border border-terminal-green/30 mb-6">
                <div className="w-2 h-2 rounded-full bg-terminal-green pulse-green" />
                <span className="text-xs font-mono text-terminal-green">Programa LP Boost Activo</span>
              </div>
              
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
                El DEX más{" "}
                <span className="text-terminal-green">agresivo</span>{" "}
                de Polygon
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Intercambia tokens, provee liquidez y gana recompensas MEXI. 
                Migra tu liquidez de otros DEX y obtén bonos exclusivos.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/swap">
                  <Button className="gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12 px-6 glow-green">
                    Comenzar a Tradear
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/migrate">
                  <Button variant="outline" className="gap-2 border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10 h-12 px-6">
                    Migrar Liquidez
                    <Gift className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/50">
                <div>
                  <div className="text-2xl font-bold font-mono text-terminal-green">$124M+</div>
                  <div className="text-sm text-muted-foreground">TVL Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-terminal-cyan">12K+</div>
                  <div className="text-sm text-muted-foreground">Usuarios</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">0.3%</div>
                  <div className="text-sm text-muted-foreground">Fee</div>
                </div>
              </div>
            </motion.div>

            {/* Swap Widget */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:justify-self-end w-full max-w-md"
            >
              <SwapWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50 bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold mb-2">
                  <span className="text-terminal-green">{stat.prefix}</span>
                  <AnimatedNumber value={stat.value} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-4">
              ¿Por qué <span className="text-terminal-green">MexiSwap</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Diseñado para traders serios que buscan las mejores condiciones del mercado.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-card border border-border/50 hover:border-terminal-cyan/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-terminal-cyan/10 flex items-center justify-center mb-4 group-hover:glow-cyan transition-all">
                  <feature.icon className="w-6 h-6 text-terminal-cyan" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LP Migration Program Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/lp-migration.png" 
            alt="" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terminal-green/10 border border-terminal-green/30 mb-6">
                <span className="text-xs font-mono text-terminal-green">🚀 Programa LP Boost</span>
              </div>
              
              <h2 className="font-display font-bold text-3xl lg:text-4xl mb-6">
                Migra tu liquidez y{" "}
                <span className="text-terminal-green">gana el doble</span>
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-8">
                ¿Tienes liquidez en Uniswap, SushiSwap o QuickSwap? Migra a MexiSwap y recibe 
                recompensas exclusivas. Nuestro programa de migración ofrece los mejores incentivos del mercado.
              </p>

              <Link href="/migrate">
                <Button className="gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12 px-6 glow-green">
                  Migrar Ahora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <div className="space-y-4">
              {migrationFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="p-5 rounded-xl bg-card/80 border border-border/50 hover:border-terminal-green/50 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-terminal-green/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-terminal-green" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-display font-semibold">{feature.title}</h3>
                        <span className="text-xs font-mono text-terminal-cyan bg-terminal-cyan/10 px-2 py-0.5 rounded">
                          {feature.highlight}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Token Section */}
      <section className="py-24 bg-card/30 border-y border-border/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative w-64 h-64 mx-auto">
                <img 
                  src="/images/token-mexi.png" 
                  alt="MEXI Token" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-terminal-green/20 rounded-full blur-3xl -z-10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display font-bold text-3xl lg:text-4xl mb-6">
                Token <span className="text-terminal-green">MEXI</span>
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                MEXI es el token de gobernanza y utilidad de MexiSwap. Úsalo para votar en propuestas, 
                ganar recompensas de staking y acceder a beneficios exclusivos.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="text-2xl font-bold font-mono text-terminal-green mb-1">1B</div>
                  <div className="text-xs text-muted-foreground">Suministro Total</div>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="text-2xl font-bold font-mono text-terminal-cyan mb-1">60%</div>
                  <div className="text-xs text-muted-foreground">Para Comunidad</div>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="text-2xl font-bold font-mono text-white mb-1">$0.0847</div>
                  <div className="text-xs text-muted-foreground">Precio Actual</div>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border/50">
                  <div className="text-2xl font-bold font-mono text-terminal-green mb-1">+12.4%</div>
                  <div className="text-xs text-muted-foreground">Cambio 24h</div>
                </div>
              </div>

              <Link href="/tokenomics">
                <Button variant="outline" className="gap-2 border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10">
                  Ver Tokenomics
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-6">
              Únete a la revolución <span className="text-terminal-green">DeFi</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Miles de traders ya están usando MexiSwap. ¿Qué esperas para unirte?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/swap">
                <Button className="gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12 px-8 glow-green">
                  Empezar Ahora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Button variant="outline" className="gap-2 h-12 px-8">
                  Leer Documentación
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
