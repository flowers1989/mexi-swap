/**
 * Sistema de Referidos - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * - Más atractivo que GMX
 * - Comisiones escalonadas por nivel
 * - Dashboard de ganancias
 * - Leaderboard de referidores
 */

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Gift,
  Copy,
  Check,
  TrendingUp,
  Award,
  Zap,
  Star,
  Crown,
  Share2,
  Twitter,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";

// Niveles de referidos con beneficios escalonados
const REFERRAL_TIERS = [
  {
    tier: 1,
    name: "Starter",
    icon: Star,
    color: "#888",
    minReferrals: 0,
    discountForTraders: 5,
    rebateForReferrer: 5,
    bonusMexi: 0,
  },
  {
    tier: 2,
    name: "Bronze",
    icon: Award,
    color: "#CD7F32",
    minReferrals: 5,
    discountForTraders: 7,
    rebateForReferrer: 7,
    bonusMexi: 100,
  },
  {
    tier: 3,
    name: "Silver",
    icon: Award,
    color: "#C0C0C0",
    minReferrals: 15,
    discountForTraders: 10,
    rebateForReferrer: 10,
    bonusMexi: 500,
  },
  {
    tier: 4,
    name: "Gold",
    icon: Crown,
    color: "#FFD700",
    minReferrals: 50,
    discountForTraders: 12,
    rebateForReferrer: 12,
    bonusMexi: 2000,
  },
  {
    tier: 5,
    name: "Diamond",
    icon: Sparkles,
    color: "#00D9FF",
    minReferrals: 100,
    discountForTraders: 15,
    rebateForReferrer: 15,
    bonusMexi: 10000,
  },
];

// Leaderboard de ejemplo
const LEADERBOARD_DATA = [
  { rank: 1, address: "0x1a2b...3c4d", referrals: 342, volume: 12500000, earnings: 125000, tier: 5 },
  { rank: 2, address: "0x5e6f...7g8h", referrals: 256, volume: 9800000, earnings: 89000, tier: 5 },
  { rank: 3, address: "0x9i0j...1k2l", referrals: 198, volume: 8200000, earnings: 78000, tier: 5 },
  { rank: 4, address: "0x3m4n...5o6p", referrals: 145, volume: 7500000, earnings: 62000, tier: 4 },
  { rank: 5, address: "0x7q8r...9s0t", referrals: 112, volume: 6800000, earnings: 58000, tier: 4 },
  { rank: 6, address: "0xab12...cd34", referrals: 89, volume: 5200000, earnings: 45000, tier: 4 },
  { rank: 7, address: "0xef56...gh78", referrals: 67, volume: 4100000, earnings: 38000, tier: 4 },
  { rank: 8, address: "0xij90...kl12", referrals: 54, volume: 3500000, earnings: 32000, tier: 3 },
  { rank: 9, address: "0xmn34...op56", referrals: 42, volume: 2800000, earnings: 25000, tier: 3 },
  { rank: 10, address: "0xqr78...st90", referrals: 35, volume: 2200000, earnings: 20000, tier: 3 },
];

// Historial de referidos de ejemplo
const REFERRAL_HISTORY = [
  { date: "2026-01-05", trader: "0xabc...123", volume: 15000, commission: 150, status: "paid" },
  { date: "2026-01-04", trader: "0xdef...456", volume: 8500, commission: 85, status: "paid" },
  { date: "2026-01-03", trader: "0xghi...789", volume: 22000, commission: 220, status: "pending" },
  { date: "2026-01-02", trader: "0xjkl...012", volume: 5200, commission: 52, status: "paid" },
  { date: "2026-01-01", trader: "0xmno...345", volume: 18000, commission: 180, status: "paid" },
];

export default function Referrals() {
  const { isConnected, address } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Datos del usuario (simulados)
  const userStats = useMemo(() => ({
    totalReferrals: 23,
    activeReferrals: 18,
    totalVolume: 1250000,
    totalEarnings: 12500,
    pendingEarnings: 850,
    currentTier: 3,
    nextTierProgress: 68, // % hacia el siguiente nivel
  }), []);

  // Código de referido del usuario
  const userReferralCode = useMemo(() => {
    if (!address) return "MEXI-XXXXX";
    return `MEXI-${address.slice(2, 7).toUpperCase()}`;
  }, [address]);

  // URL de referido
  const referralUrl = `https://mexiswap.io/trade?ref=${userReferralCode}`;

  // Copiar código
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Enlace de referido copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  // Compartir en redes sociales
  const shareOnTwitter = () => {
    const text = encodeURIComponent(`🚀 Únete a MexiSwap y obtén hasta 15% de descuento en fees!\n\n💰 El DEX más agresivo de Polygon\n📈 Trading de perpetuos con 100x\n🎁 Bonos exclusivos para nuevos usuarios\n\n${referralUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(`🚀 Únete a MexiSwap - El DEX más agresivo de Polygon!\n\n${referralUrl}`);
    window.open(`https://t.me/share/url?url=${referralUrl}&text=${text}`, "_blank");
  };

  // Obtener tier actual
  const currentTierData = REFERRAL_TIERS[userStats.currentTier - 1];
  const nextTierData = REFERRAL_TIERS[userStats.currentTier] || null;

  // Formatear número
  const formatNumber = (num: number) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-[#1a1a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D26A]/10 via-transparent to-[#00D9FF]/10" />
        <div className="container py-12 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D26A]/10 border border-[#00D26A]/30 rounded-full text-[#00D26A] text-sm mb-6">
              <Gift className="w-4 h-4" />
              Programa de Referidos MexiSwap
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Gana <span className="text-[#00D26A]">hasta 15%</span> de comisión
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Invita traders a MexiSwap y gana comisiones de por vida. 
              Tus referidos también obtienen descuentos exclusivos.
            </p>

            {/* Comparación con GMX */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-[#111] rounded-xl p-4 border border-[#2a2a2a]">
                <p className="text-sm text-gray-500 mb-1">GMX Referidos</p>
                <p className="text-2xl font-bold text-gray-400">5%</p>
                <p className="text-xs text-gray-500">Fijo para todos</p>
              </div>
              <div className="bg-[#00D26A]/10 rounded-xl p-4 border border-[#00D26A]/30">
                <p className="text-sm text-[#00D26A] mb-1">MexiSwap Referidos</p>
                <p className="text-2xl font-bold text-[#00D26A]">5-15%</p>
                <p className="text-xs text-[#00D26A]">Escalonado + Bonos MEXI</p>
              </div>
            </div>

            {/* Código de referido */}
            {isConnected ? (
              <div className="bg-[#111] rounded-xl p-6 border border-[#1a1a1a] max-w-xl mx-auto">
                <p className="text-sm text-gray-400 mb-3">Tu enlace de referido</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={referralUrl}
                    readOnly
                    className="bg-[#0A0A0A] border-[#2a2a2a] font-mono text-sm"
                  />
                  <Button
                    onClick={copyReferralCode}
                    className="bg-[#00D26A] hover:bg-[#00D26A]/90 text-black px-6"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnTwitter}
                    className="gap-2 border-[#1DA1F2]/50 text-[#1DA1F2] hover:bg-[#1DA1F2]/10"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareOnTelegram}
                    className="gap-2 border-[#0088cc]/50 text-[#0088cc] hover:bg-[#0088cc]/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Telegram
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="bg-[#00D26A] hover:bg-[#00D26A]/90 text-black px-8 py-6 text-lg">
                Conectar Wallet para Empezar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Niveles de Referidos */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#00D26A]" />
            Niveles de Referidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {REFERRAL_TIERS.map((tier, index) => {
              const TierIcon = tier.icon;
              const isCurrentTier = userStats.currentTier === tier.tier;
              const isUnlocked = userStats.totalReferrals >= tier.minReferrals;

              return (
                <div
                  key={tier.tier}
                  className={`relative bg-[#111] rounded-xl p-5 border transition-all ${
                    isCurrentTier
                      ? "border-[#00D26A] shadow-lg shadow-[#00D26A]/20"
                      : isUnlocked
                      ? "border-[#2a2a2a]"
                      : "border-[#1a1a1a] opacity-60"
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00D26A] text-black text-xs font-bold rounded-full">
                      Tu Nivel
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${tier.color}20` }}
                    >
                      <TierIcon className="w-6 h-6" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: tier.color }}>{tier.name}</h3>
                      <p className="text-xs text-gray-500">{tier.minReferrals}+ referidos</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Descuento traders</span>
                      <span className="text-[#00D26A] font-mono">{tier.discountForTraders}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tu comisión</span>
                      <span className="text-[#00D9FF] font-mono">{tier.rebateForReferrer}%</span>
                    </div>
                    {tier.bonusMexi > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bono MEXI</span>
                        <span className="text-[#FFD700] font-mono">+{tier.bonusMexi}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dashboard del Usuario */}
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Estadísticas */}
            <div className="lg:col-span-2">
              <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00D26A]" />
                  Tu Dashboard
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Referidos</p>
                    <p className="text-2xl font-bold text-[#00D26A]">{userStats.totalReferrals}</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Activos (30d)</p>
                    <p className="text-2xl font-bold">{userStats.activeReferrals}</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Volumen Total</p>
                    <p className="text-2xl font-bold">{formatNumber(userStats.totalVolume)}</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Ganancias Totales</p>
                    <p className="text-2xl font-bold text-[#00D9FF]">{formatNumber(userStats.totalEarnings)}</p>
                  </div>
                </div>

                {/* Progreso al siguiente nivel */}
                {nextTierData && (
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        Progreso a {nextTierData.name}
                      </span>
                      <span className="text-sm font-mono">
                        {userStats.totalReferrals}/{nextTierData.minReferrals} referidos
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00D26A] to-[#00D9FF] rounded-full transition-all"
                        style={{ width: `${userStats.nextTierProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Te faltan {nextTierData.minReferrals - userStats.totalReferrals} referidos para desbloquear +{nextTierData.bonusMexi} MEXI de bono
                    </p>
                  </div>
                )}

                {/* Ganancias pendientes */}
                <div className="mt-6 flex items-center justify-between bg-[#00D26A]/10 rounded-lg p-4 border border-[#00D26A]/30">
                  <div>
                    <p className="text-sm text-gray-400">Ganancias pendientes</p>
                    <p className="text-2xl font-bold text-[#00D26A]">{formatNumber(userStats.pendingEarnings)}</p>
                  </div>
                  <Button className="bg-[#00D26A] hover:bg-[#00D26A]/90 text-black">
                    Reclamar
                  </Button>
                </div>
              </div>
            </div>

            {/* Historial reciente */}
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                {REFERRAL_HISTORY.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                    <div>
                      <p className="font-mono text-sm">{item.trader}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#00D26A]">+${item.commission}</p>
                      <p className="text-xs text-gray-500">{formatNumber(item.volume)} vol</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-[#00D9FF]">
                Ver todo el historial
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#FFD700]" />
            Top Referidores
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-[#1a1a1a]">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3">Dirección</th>
                  <th className="text-center py-3">Nivel</th>
                  <th className="text-right py-3">Referidos</th>
                  <th className="text-right py-3">Volumen</th>
                  <th className="text-right py-3">Ganancias</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_DATA.map((user) => {
                  const tierData = REFERRAL_TIERS[user.tier - 1];
                  const TierIcon = tierData.icon;
                  
                  return (
                    <tr key={user.rank} className="border-b border-[#1a1a1a]/50 hover:bg-[#1a1a1a]/30">
                      <td className="py-4 px-2">
                        {user.rank <= 3 ? (
                          <span className={`text-lg ${
                            user.rank === 1 ? "text-[#FFD700]" :
                            user.rank === 2 ? "text-[#C0C0C0]" :
                            "text-[#CD7F32]"
                          }`}>
                            {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-gray-500">{user.rank}</span>
                        )}
                      </td>
                      <td className="py-4 font-mono">{user.address}</td>
                      <td className="py-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${tierData.color}20`, color: tierData.color }}
                        >
                          <TierIcon className="w-3 h-3" />
                          {tierData.name}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono">{user.referrals}</td>
                      <td className="py-4 text-right font-mono">{formatNumber(user.volume)}</td>
                      <td className="py-4 text-right font-mono text-[#00D26A]">{formatNumber(user.earnings)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aplicar código de referido */}
        <div className="mt-12 bg-gradient-to-r from-[#00D26A]/10 to-[#00D9FF]/10 rounded-xl p-8 border border-[#00D26A]/30">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">¿Tienes un código de referido?</h3>
            <p className="text-gray-400 mb-6">
              Ingresa el código de quien te invitó y obtén hasta 15% de descuento en fees
            </p>
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <Input
                placeholder="MEXI-XXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-[#0A0A0A] border-[#2a2a2a] font-mono text-center uppercase"
              />
              <Button
                onClick={() => {
                  if (referralCode) {
                    toast.success("Código de referido aplicado correctamente");
                  }
                }}
                className="bg-[#00D26A] hover:bg-[#00D26A]/90 text-black px-6"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
