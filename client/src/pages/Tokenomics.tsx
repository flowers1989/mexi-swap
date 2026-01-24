/**
 * Tokenomics - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * - ICO de 100M MEXI para recaudación de fondos
 * - Distribución actualizada del token
 * - Roadmap y utilidades
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Users, 
  Lock, 
  Rocket,
  Vote,
  Gift,
  TrendingUp,
  Shield,
  ExternalLink,
  Copy,
  CheckCircle2,
  DollarSign,
  Clock,
  Target,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Distribución actualizada con ICO de 100M
const tokenDistribution = [
  { name: "ICO Pública", value: 10, color: "#00D26A", description: "100M MEXI para venta pública" },
  { name: "Recompensas de Liquidez", value: 40, color: "#00D9FF", description: "Emisiones graduales durante 4 años" },
  { name: "Tesorería/DAO", value: 15, color: "#8B5CF6", description: "Gobernanza comunitaria" },
  { name: "Programa LP Boost", value: 10, color: "#F59E0B", description: "Migración de liquidez" },
  { name: "Equipo y Asesores", value: 10, color: "#EC4899", description: "Vesting 24 meses, cliff 6 meses" },
  { name: "Reserva Estratégica", value: 10, color: "#6366F1", description: "Partnerships y desarrollo" },
  { name: "Airdrop Retroactivo", value: 5, color: "#14B8A6", description: "Para LPs históricos" },
];

// Detalles de la ICO
const icoDetails = {
  totalSupply: 1000000000, // 1B MEXI
  icoAllocation: 100000000, // 100M MEXI
  pricePerToken: 0.05, // $0.05 USD
  hardCap: 5000000, // $5M USD
  softCap: 1000000, // $1M USD
  minPurchase: 100, // $100 USD
  maxPurchase: 50000, // $50,000 USD
  vestingSchedule: "20% TGE, 80% linear over 6 months",
  acceptedTokens: ["DAI", "USDC", "USDT"],
  startDate: "2026-02-01",
  endDate: "2026-02-28",
};

const utilities = [
  {
    icon: Vote,
    title: "Gobernanza DAO",
    description: "Vota en propuestas de mejora del protocolo, cambios de parámetros y uso de la tesorería.",
  },
  {
    icon: Gift,
    title: "Staking Rewards",
    description: "Haz staking de MEXI para ganar una parte de los fees del protocolo (50% de comisiones).",
  },
  {
    icon: TrendingUp,
    title: "Boost de Farming",
    description: "Aumenta tus recompensas de farming hasta 2.5x al hacer staking de MEXI.",
  },
  {
    icon: Shield,
    title: "Descuentos en Fees",
    description: "Holders de MEXI obtienen hasta 50% de descuento en fees de trading.",
  },
  {
    icon: Zap,
    title: "Acceso Prioritario",
    description: "Acceso anticipado a nuevos productos, IDOs en el Launchpad y features exclusivas.",
  },
  {
    icon: Award,
    title: "Referidos Premium",
    description: "Niveles de referidos más altos y mayores comisiones para holders de MEXI.",
  },
];

const roadmap = [
  {
    quarter: "Q1 2026",
    title: "Lanzamiento",
    items: ["ICO Pública (100M MEXI)", "Lanzamiento del DEX en Polygon", "Perpetuos con 100x", "Programa LP Boost"],
    status: "current",
  },
  {
    quarter: "Q2 2026",
    title: "Expansión",
    items: ["Gobernanza DAO activa", "Staking de MEXI", "Launchpad ICO", "Sistema de referidos"],
    status: "upcoming",
  },
  {
    quarter: "Q3 2026",
    title: "Multi-Chain",
    items: ["Expansión a BNB Chain", "Integración Ethereum", "Avalanche y Solana", "Cross-chain bridges"],
    status: "upcoming",
  },
  {
    quarter: "Q4 2026",
    title: "Innovación",
    items: ["Limit orders avanzadas", "Copy trading", "Mobile app", "Institucional API"],
    status: "upcoming",
  },
];

const contractAddress = "0x1234...5678...9ABC...DEF0";

export default function Tokenomics() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("0x1234567890ABCDEF1234567890ABCDEF12345678");
    setCopied(true);
    toast.success("Dirección copiada");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(0)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D26A]/10 via-transparent to-[#00D9FF]/10" />
        <div className="container py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D26A]/10 border border-[#00D26A]/30 rounded-full text-[#00D26A] text-sm mb-6"
            >
              <Coins className="w-4 h-4" />
              Token MEXI - El corazón de MexiSwap
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="text-[#00D26A]">1,000,000,000</span> MEXI
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 mb-8"
            >
              Token de gobernanza y utilidad del ecosistema MexiSwap.
              Participa en la ICO y sé parte del DEX más agresivo de DeFi.
            </motion.p>

            {/* Dirección del contrato */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#111] rounded-xl border border-[#2a2a2a]"
            >
              <span className="text-gray-400">Contrato:</span>
              <code className="font-mono text-[#00D9FF]">{contractAddress}</code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00D26A]" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <a
                href="https://polygonscan.com/token/0x1234567890ABCDEF1234567890ABCDEF12345678"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ICO Section */}
      <section className="py-16 border-b border-[#1a1a1a]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
              <Rocket className="w-8 h-8 text-[#00D26A]" />
              ICO Pública - 100M MEXI
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Participa en la venta pública de tokens MEXI y sé parte del futuro de DeFi.
              Precio fijo, sin subastas, primero en llegar primero en servir.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Detalles de la ICO */}
            <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00D9FF]" />
                Detalles de la Venta
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Tokens en venta</span>
                  <span className="font-mono text-lg">{formatNumber(icoDetails.icoAllocation)} MEXI</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Precio por token</span>
                  <span className="font-mono text-lg text-[#00D26A]">${icoDetails.pricePerToken}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Hard Cap</span>
                  <span className="font-mono text-lg">${formatNumber(icoDetails.hardCap)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Soft Cap</span>
                  <span className="font-mono text-lg">${formatNumber(icoDetails.softCap)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Compra mínima</span>
                  <span className="font-mono">${icoDetails.minPurchase}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Compra máxima</span>
                  <span className="font-mono">${formatNumber(icoDetails.maxPurchase)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                  <span className="text-gray-400">Tokens aceptados</span>
                  <span className="font-mono">{icoDetails.acceptedTokens.join(", ")}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Vesting</span>
                  <span className="text-sm text-right max-w-[200px]">{icoDetails.vestingSchedule}</span>
                </div>
              </div>
            </div>

            {/* CTA de la ICO */}
            <div className="bg-gradient-to-br from-[#00D26A]/10 to-[#00D9FF]/10 rounded-2xl border border-[#00D26A]/30 p-8 flex flex-col justify-center">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D26A]/20 rounded-full text-[#00D26A] text-sm mb-6">
                  <Clock className="w-4 h-4" />
                  Próximamente
                </div>
                
                <h3 className="text-2xl font-bold mb-4">
                  Participa en la ICO
                </h3>
                
                <p className="text-gray-400 mb-6">
                  La venta pública comenzará el <span className="text-white font-medium">1 de Febrero 2026</span>.
                  Prepara tu wallet y sé de los primeros en obtener MEXI.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#0A0A0A] rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#00D26A]">100M</p>
                    <p className="text-xs text-gray-500">Tokens</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#00D9FF]">$0.05</p>
                    <p className="text-xs text-gray-500">Precio</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#FFD700]">$5M</p>
                    <p className="text-xs text-gray-500">Hard Cap</p>
                  </div>
                </div>

                <Link href="/launchpad">
                  <Button className="w-full py-6 text-lg bg-[#00D26A] hover:bg-[#00D26A]/90 text-black font-bold">
                    <Rocket className="w-5 h-5 mr-2" />
                    Ir al Launchpad
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Distribución del Token */}
      <section className="py-16 border-b border-[#1a1a1a]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Distribución del Token</h2>
            <p className="text-gray-400">
              Supply total: 1,000,000,000 MEXI | Sin inflación adicional
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Gráfico de distribución */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={150}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${value}%`}
                    labelLine={false}
                  >
                    {tokenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de distribución */}
            <div className="space-y-4">
              {tokenDistribution.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-[#111] rounded-xl border border-[#1a1a1a]"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-mono text-lg" style={{ color: item.color }}>
                        {item.value}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      {formatNumber(icoDetails.totalSupply * item.value / 100)} MEXI
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Utilidades del Token */}
      <section className="py-16 border-b border-[#1a1a1a]">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Utilidades del Token</h2>
            <p className="text-gray-400">
              MEXI no es solo un token de gobernanza, es la llave a todo el ecosistema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {utilities.map((utility, index) => (
              <motion.div
                key={utility.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6 hover:border-[#00D26A]/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00D26A]/10 flex items-center justify-center mb-4">
                  <utility.icon className="w-6 h-6 text-[#00D26A]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{utility.title}</h3>
                <p className="text-gray-400 text-sm">{utility.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Roadmap 2026</h2>
            <p className="text-gray-400">
              Nuestra hoja de ruta para dominar el espacio DeFi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmap.map((phase, index) => (
              <motion.div
                key={phase.quarter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-[#111] rounded-xl border p-6 ${
                  phase.status === "current"
                    ? "border-[#00D26A] shadow-lg shadow-[#00D26A]/20"
                    : "border-[#1a1a1a]"
                }`}
              >
                {phase.status === "current" && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-[#00D26A] text-black text-xs font-bold rounded-full">
                    En Progreso
                  </div>
                )}
                <div className="text-[#00D9FF] font-mono text-sm mb-2">{phase.quarter}</div>
                <h3 className="text-xl font-bold mb-4">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                        phase.status === "current" && i === 0 ? "text-[#00D26A]" : "text-gray-600"
                      }`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 border-t border-[#1a1a1a]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para ser parte de MexiSwap?
            </h2>
            <p className="text-gray-400 mb-8">
              Participa en la ICO, haz staking de MEXI, y únete a la comunidad más agresiva de DeFi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/launchpad">
                <Button className="px-8 py-6 text-lg bg-[#00D26A] hover:bg-[#00D26A]/90 text-black font-bold">
                  <Rocket className="w-5 h-5 mr-2" />
                  Participar en ICO
                </Button>
              </Link>
              <Link href="/farm">
                <Button variant="outline" className="px-8 py-6 text-lg border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/10">
                  <Gift className="w-5 h-5 mr-2" />
                  Staking de MEXI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
