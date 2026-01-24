/*
 * DESIGN: Dark Terminal Hacker
 * - Página de Farming y Staking de MEXI
 * - Pools de farming con APY
 * - Staking de MEXI con recompensas
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Coins, 
  TrendingUp,
  Lock,
  Unlock,
  Gift,
  Zap,
  Timer,
  Loader2,
  Info,
  Wallet
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWeb3 } from "@/contexts/Web3Context";

// Pools de farming
const farmPools = [
  {
    id: 1,
    name: "MEXI-MATIC",
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "MATIC", icon: "/images/polygon-network.png" },
    tvl: "$45.2M",
    apr: 124.5,
    dailyRewards: "125,000 MEXI",
    multiplier: "10x",
    staked: "0",
    earned: "0",
    featured: true,
  },
  {
    id: 2,
    name: "MEXI-USDC",
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "USDC", icon: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=40&h=40&fit=crop" },
    tvl: "$32.8M",
    apr: 98.2,
    dailyRewards: "95,000 MEXI",
    multiplier: "8x",
    staked: "0",
    earned: "0",
    featured: true,
  },
  {
    id: 3,
    name: "MEXI-WETH",
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "WETH", icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop" },
    tvl: "$18.5M",
    apr: 156.2,
    dailyRewards: "80,000 MEXI",
    multiplier: "12x",
    staked: "0",
    earned: "0",
    featured: true,
  },
  {
    id: 4,
    name: "WETH-MATIC",
    token0: { symbol: "WETH", icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop" },
    token1: { symbol: "MATIC", icon: "/images/polygon-network.png" },
    tvl: "$12.4M",
    apr: 45.8,
    dailyRewards: "35,000 MEXI",
    multiplier: "3x",
    staked: "0",
    earned: "0",
    featured: false,
  },
];

// Opciones de staking
const stakingOptions = [
  {
    id: 1,
    duration: "Flexible",
    lockDays: 0,
    apr: 25,
    boost: "1x",
    minStake: "100 MEXI",
  },
  {
    id: 2,
    duration: "30 días",
    lockDays: 30,
    apr: 45,
    boost: "1.5x",
    minStake: "500 MEXI",
  },
  {
    id: 3,
    duration: "90 días",
    lockDays: 90,
    apr: 85,
    boost: "2x",
    minStake: "1,000 MEXI",
  },
  {
    id: 4,
    duration: "180 días",
    lockDays: 180,
    apr: 150,
    boost: "2.5x",
    minStake: "5,000 MEXI",
  },
];

export default function Farm() {
  const { isConnected, connect } = useWeb3();
  const [selectedPool, setSelectedPool] = useState<typeof farmPools[0] | null>(null);
  const [selectedStaking, setSelectedStaking] = useState<typeof stakingOptions[0] | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  // Stats de usuario (mock)
  const userStats = {
    totalStaked: "$12,450",
    totalEarned: "1,245 MEXI",
    pendingRewards: "45.67 MEXI",
    stakingPower: "2.5x",
  };

  const handleStake = async () => {
    if (!stakeAmount) {
      toast.error("Ingresa una cantidad");
      return;
    }

    setIsStaking(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("¡Staking exitoso!", {
      description: `Has depositado ${stakeAmount} LP tokens`,
    });
    
    setStakeAmount("");
    setIsStaking(false);
  };

  const handleHarvest = async () => {
    setIsHarvesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("¡Recompensas reclamadas!", {
      description: "Has recibido 45.67 MEXI en tu wallet",
    });
    
    setIsHarvesting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Farming & <span className="text-terminal-green">Staking</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gana tokens MEXI haciendo staking de tus LP tokens o bloqueando MEXI.
              Cuanto más tiempo bloquees, mayores serán tus recompensas.
            </p>
          </motion.div>

          {/* User Stats */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Total Stakeado</span>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-green">{userStats.totalStaked}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">Total Ganado</span>
                </div>
                <div className="text-2xl font-bold font-mono">{userStats.totalEarned}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm">Pendiente</span>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-cyan">{userStats.pendingRewards}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Boost Power</span>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-green">{userStats.stakingPower}</div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="farming" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="farming" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Farming
              </TabsTrigger>
              <TabsTrigger value="staking" className="gap-2">
                <Lock className="w-4 h-4" />
                Staking
              </TabsTrigger>
            </TabsList>

            {/* Farming Tab */}
            <TabsContent value="farming">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Farming Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-xl">Pools de Farming</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="w-4 h-4" />
                    <span>Recompensas cada bloque</span>
                  </div>
                </div>

                {/* Farm Pools */}
                {farmPools.map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`p-6 rounded-xl border ${
                      pool.featured 
                        ? "bg-gradient-to-r from-terminal-green/5 to-terminal-cyan/5 border-terminal-green/30" 
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Pool Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          <img 
                            src={pool.token0.icon} 
                            alt={pool.token0.symbol} 
                            className="w-10 h-10 rounded-full border-2 border-card"
                          />
                          <img 
                            src={pool.token1.icon} 
                            alt={pool.token1.symbol} 
                            className="w-10 h-10 rounded-full border-2 border-card"
                          />
                        </div>
                        <div>
                          <div className="font-mono font-semibold flex items-center gap-2">
                            {pool.name}
                            {pool.featured && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-terminal-green/20 text-terminal-green border border-terminal-green/30">
                                {pool.multiplier}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">TVL: {pool.tvl}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-6 lg:gap-12">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">APR</div>
                          <div className="font-mono font-bold text-terminal-green text-lg">{pool.apr}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Stakeado</div>
                          <div className="font-mono">{pool.staked}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Ganado</div>
                          <div className="font-mono text-terminal-cyan">{pool.earned}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10"
                                  onClick={() => setSelectedPool(pool)}
                                >
                                  Depositar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-border">
                                <DialogHeader>
                                  <DialogTitle className="font-display flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      <img src={selectedPool?.token0.icon} alt="" className="w-8 h-8 rounded-full" />
                                      <img src={selectedPool?.token1.icon} alt="" className="w-8 h-8 rounded-full" />
                                    </div>
                                    Depositar {selectedPool?.name}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-muted-foreground">Cantidad</span>
                                      <span className="text-muted-foreground">Balance: 0.00 LP</span>
                                    </div>
                                    <Input
                                      type="text"
                                      placeholder="0.0"
                                      value={stakeAmount}
                                      onChange={(e) => setStakeAmount(e.target.value)}
                                      className="font-mono bg-background"
                                    />
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/30 text-sm">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-muted-foreground">APR</span>
                                      <span className="text-terminal-green font-mono">{selectedPool?.apr}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Recompensas diarias</span>
                                      <span className="font-mono">{selectedPool?.dailyRewards}</span>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={handleStake}
                                    disabled={isStaking}
                                    className="w-full bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold"
                                  >
                                    {isStaking ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Depositando...
                                      </>
                                    ) : (
                                      "Depositar LP"
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              onClick={handleHarvest}
                              disabled={isHarvesting}
                              className="bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold"
                            >
                              {isHarvesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Cosechar"
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={connect}
                            className="bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold"
                          >
                            Conectar Wallet
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            {/* Staking Tab */}
            <TabsContent value="staking">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Staking Info */}
                <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-terminal-green/10 to-terminal-cyan/10 border border-terminal-green/30">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-terminal-green/20 flex items-center justify-center">
                      <img src="/images/token-mexi.png" alt="MEXI" className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-xl mb-2">Staking de MEXI</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Bloquea tus tokens MEXI para ganar recompensas adicionales y aumentar tu poder de voto en la gobernanza.
                        Cuanto más tiempo bloquees, mayor será tu multiplicador de recompensas.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-terminal-green" />
                          <span className="text-sm">Total Stakeado: <span className="font-mono text-terminal-green">245.8M MEXI</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-terminal-cyan" />
                          <span className="text-sm">APR Base: <span className="font-mono text-terminal-cyan">25%</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staking Options */}
                <h2 className="font-display font-semibold text-xl mb-4">Opciones de Bloqueo</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stakingOptions.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-6 rounded-xl border cursor-pointer transition-all ${
                        selectedStaking?.id === option.id
                          ? "bg-terminal-green/10 border-terminal-green"
                          : "bg-card border-border hover:border-terminal-cyan/50"
                      }`}
                      onClick={() => setSelectedStaking(option)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {option.lockDays === 0 ? (
                            <Unlock className="w-5 h-5 text-terminal-cyan" />
                          ) : (
                            <Lock className="w-5 h-5 text-terminal-green" />
                          )}
                          <span className="font-semibold">{option.duration}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-terminal-green/20 text-terminal-green font-mono">
                          {option.boost}
                        </span>
                      </div>
                      <div className="text-3xl font-bold font-mono text-terminal-green mb-2">
                        {option.apr}%
                      </div>
                      <div className="text-sm text-muted-foreground">APR</div>
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-xs text-muted-foreground">
                          Mínimo: {option.minStake}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Staking Form */}
                {selectedStaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-8 p-6 rounded-xl bg-card border border-border"
                  >
                    <h3 className="font-display font-semibold text-lg mb-4">
                      Stake MEXI - {selectedStaking.duration}
                    </h3>
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Cantidad a stakear</span>
                            <span className="text-muted-foreground">Balance: 10,000 MEXI</span>
                          </div>
                          <Input
                            type="text"
                            placeholder="0.0"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="font-mono bg-background text-lg h-12"
                          />
                          <div className="flex gap-2 mt-2">
                            {[25, 50, 75, 100].map((percent) => (
                              <button
                                key={percent}
                                onClick={() => setStakeAmount((10000 * percent / 100).toString())}
                                className="flex-1 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
                              >
                                {percent}%
                              </button>
                            ))}
                          </div>
                        </div>
                        {isConnected ? (
                          <Button
                            onClick={handleStake}
                            disabled={isStaking || !stakeAmount}
                            className="w-full bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12"
                          >
                            {isStaking ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Stakeando...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Stakear MEXI
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={connect}
                            className="w-full bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12"
                          >
                            Conectar Wallet
                          </Button>
                        )}
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 space-y-3">
                        <h4 className="font-semibold mb-3">Resumen</h4>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Período de bloqueo</span>
                          <span className="font-mono">{selectedStaking.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">APR</span>
                          <span className="font-mono text-terminal-green">{selectedStaking.apr}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Boost</span>
                          <span className="font-mono text-terminal-cyan">{selectedStaking.boost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Recompensa estimada (30d)</span>
                          <span className="font-mono">
                            {stakeAmount ? (parseFloat(stakeAmount) * selectedStaking.apr / 100 / 12).toFixed(2) : "0"} MEXI
                          </span>
                        </div>
                        {selectedStaking.lockDays > 0 && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-yellow-500">
                              <Info className="w-3 h-3" />
                              <span>Los tokens estarán bloqueados por {selectedStaking.lockDays} días</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
