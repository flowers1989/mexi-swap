/*
 * DESIGN: Dark Terminal Hacker
 * - Página de migración de liquidez (Programa LP Boost)
 * - Selector de DEX origen
 * - Lista de posiciones LP migrables
 * - Calculadora de bonos
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  Gift,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const sourceDexs = [
  { id: "uniswap", name: "Uniswap V3", logo: "🦄", positions: 3 },
  { id: "sushiswap", name: "SushiSwap", logo: "🍣", positions: 2 },
  { id: "quickswap", name: "QuickSwap", logo: "⚡", positions: 1 },
];

const mockPositions = [
  {
    id: 1,
    dex: "uniswap",
    pair: "ETH/USDC",
    value: "$12,450",
    bonus: "+$1,245",
    bonusPercent: "10%",
    apy: "45.2%",
    newApy: "156.8%",
  },
  {
    id: 2,
    dex: "uniswap",
    pair: "MATIC/USDC",
    value: "$8,200",
    bonus: "+$820",
    bonusPercent: "10%",
    apy: "32.1%",
    newApy: "124.5%",
  },
  {
    id: 3,
    dex: "sushiswap",
    pair: "ETH/MATIC",
    value: "$5,600",
    bonus: "+$560",
    bonusPercent: "10%",
    apy: "28.4%",
    newApy: "98.2%",
  },
];

const migrationSteps = [
  { id: 1, title: "Conectar Wallet", status: "completed" },
  { id: 2, title: "Seleccionar Posiciones", status: "current" },
  { id: 3, title: "Aprobar Tokens", status: "pending" },
  { id: 4, title: "Migrar Liquidez", status: "pending" },
];

export default function Migrate() {
  const [selectedDex, setSelectedDex] = useState<string>("");
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);

  const filteredPositions = selectedDex 
    ? mockPositions.filter(p => p.dex === selectedDex)
    : mockPositions;

  const totalValue = selectedPositions.reduce((acc, id) => {
    const pos = mockPositions.find(p => p.id === id);
    return acc + (pos ? parseFloat(pos.value.replace(/[$,]/g, '')) : 0);
  }, 0);

  const totalBonus = totalValue * 0.1;

  const togglePosition = (id: number) => {
    setSelectedPositions(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleMigrate = async () => {
    if (selectedPositions.length === 0) {
      toast.error("Selecciona al menos una posición");
      return;
    }

    setIsMigrating(true);
    
    // Simular progreso de migración
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setMigrationProgress(i);
    }

    toast.success("¡Migración completada!", {
      description: `Has migrado $${totalValue.toLocaleString()} y recibido $${totalBonus.toLocaleString()} en bonos MEXI`,
    });

    setIsMigrating(false);
    setMigrationProgress(0);
    setSelectedPositions([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terminal-green/10 border border-terminal-green/30 mb-6">
              <span className="text-2xl">🚀</span>
              <span className="font-mono text-terminal-green">Programa LP Boost</span>
            </div>
            
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Migra tu liquidez y{" "}
              <span className="text-terminal-green">gana bonos</span>
            </h1>
            
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transfiere tu liquidez de otros DEX a MexiSwap con un solo clic.
              Recibe un 10% de bono en tokens MEXI y APYs hasta 3x mayores.
            </p>
          </motion.div>

          {/* Countdown Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 p-4 rounded-xl bg-gradient-to-r from-terminal-green/10 via-terminal-cyan/10 to-terminal-green/10 border border-terminal-green/30"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-terminal-green" />
                <div>
                  <div className="font-semibold">Bonos 10x activos</div>
                  <div className="text-sm text-muted-foreground">Termina en 12 días 14:32:45</div>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-terminal-cyan" />
                <span className="text-terminal-cyan">$2.4M migrados hoy</span>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Panel izquierdo - Selector y posiciones */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selector de DEX */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="font-display font-semibold mb-4">Selecciona el DEX de origen</h3>
                <Select value={selectedDex} onValueChange={setSelectedDex}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos los DEX" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos los DEX</SelectItem>
                    {sourceDexs.map((dex) => (
                      <SelectItem key={dex.id} value={dex.id}>
                        <div className="flex items-center gap-2">
                          <span>{dex.logo}</span>
                          <span>{dex.name}</span>
                          <span className="text-muted-foreground">({dex.positions} posiciones)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Lista de posiciones */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Tus Posiciones LP</h3>
                  <button 
                    className="text-sm text-terminal-cyan hover:underline"
                    onClick={() => setSelectedPositions(filteredPositions.map(p => p.id))}
                  >
                    Seleccionar todas
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredPositions.map((position) => (
                    <div
                      key={position.id}
                      onClick={() => togglePosition(position.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPositions.includes(position.id)
                          ? "border-terminal-green bg-terminal-green/5"
                          : "border-border/50 bg-background/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPositions.includes(position.id)
                              ? "border-terminal-green bg-terminal-green"
                              : "border-muted-foreground"
                          }`}>
                            {selectedPositions.includes(position.id) && (
                              <CheckCircle2 className="w-4 h-4 text-black" />
                            )}
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{position.pair}</div>
                            <div className="text-xs text-muted-foreground">
                              {sourceDexs.find(d => d.id === position.dex)?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">{position.value}</div>
                          <div className="text-xs text-terminal-green font-mono">
                            {position.bonus} bono
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-muted-foreground">APY actual: </span>
                            <span className="font-mono">{position.apy}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Nuevo APY: </span>
                            <span className="font-mono text-terminal-green">{position.newApy}</span>
                          </div>
                        </div>
                        <div className="text-terminal-cyan font-mono text-xs">
                          +{((parseFloat(position.newApy) / parseFloat(position.apy) - 1) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPositions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No se encontraron posiciones LP</p>
                    <p className="text-sm">Conecta tu wallet para ver tus posiciones</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Panel derecho - Resumen y acción */}
            <div className="lg:col-span-1 space-y-6">
              {/* Pasos de migración */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="font-display font-semibold mb-4">Progreso</h3>
                <div className="space-y-3">
                  {migrationSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                        step.status === "completed" 
                          ? "bg-terminal-green text-black"
                          : step.status === "current"
                          ? "bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step.status === "completed" ? "✓" : index + 1}
                      </div>
                      <span className={step.status === "pending" ? "text-muted-foreground" : ""}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Resumen */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h3 className="font-display font-semibold mb-4">Resumen</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posiciones seleccionadas</span>
                    <span className="font-mono">{selectedPositions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor total</span>
                    <span className="font-mono">${totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bono MEXI (10%)</span>
                    <span className="font-mono text-terminal-green">+${totalBonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas estimado</span>
                    <span className="font-mono">
                      <span className="line-through text-muted-foreground">~$2.50</span>
                      <span className="text-terminal-cyan ml-2">~$1.25</span>
                    </span>
                  </div>
                </div>

                {isMigrating && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Migrando...</span>
                      <span className="font-mono">{migrationProgress}%</span>
                    </div>
                    <Progress value={migrationProgress} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={handleMigrate}
                  disabled={selectedPositions.length === 0 || isMigrating}
                  className="w-full mt-6 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold h-12 glow-green"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Migrar Liquidez
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Gas subsidiado 50% durante el evento
                </p>
              </motion.div>

              {/* Beneficios */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-gradient-to-br from-terminal-green/10 to-terminal-cyan/10 border border-terminal-green/30 rounded-xl p-6"
              >
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-terminal-green" />
                  Beneficios
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                    10% bono en tokens MEXI
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                    APYs hasta 3x mayores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                    Gas subsidiado 50%
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                    Sin período de lock-up
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
