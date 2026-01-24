/*
 * DESIGN: Dark Terminal Hacker
 * - Fondo negro profundo (#0A0A0A)
 * - Verde terminal (#00D26A) para votos a favor
 * - Rojo (#FF4757) para votos en contra
 * - Cyan (#00D9FF) para acentos
 */

import { useState } from "react";
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  TrendingUp,
  Shield,
  Coins,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Tipos de propuestas
type ProposalStatus = "active" | "passed" | "rejected" | "pending" | "executed";
type ProposalCategory = "treasury" | "protocol" | "governance" | "emergency";

interface Proposal {
  id: number;
  title: string;
  description: string;
  category: ProposalCategory;
  status: ProposalStatus;
  proposer: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  forumLink?: string;
  snapshotBlock: number;
}

// Propuestas de ejemplo
const PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: "MIP-001: Reducir comisiones de trading al 0.05%",
    description: "Esta propuesta busca reducir las comisiones de trading del 0.1% al 0.05% para aumentar el volumen y atraer más traders. La reducción se compensará con el aumento esperado en volumen de trading.",
    category: "protocol",
    status: "active",
    proposer: "0x1234...5678",
    votesFor: 2500000,
    votesAgainst: 800000,
    totalVotes: 3300000,
    quorum: 4000000,
    startTime: "2026-01-03 00:00",
    endTime: "2026-01-10 00:00",
    snapshotBlock: 52000000,
  },
  {
    id: 2,
    title: "MIP-002: Asignar 5M MEXI al fondo de desarrollo",
    description: "Propuesta para asignar 5 millones de tokens MEXI del tesoro al fondo de desarrollo para financiar nuevas características y auditorías de seguridad durante Q1 2026.",
    category: "treasury",
    status: "active",
    proposer: "0xabcd...efgh",
    votesFor: 4200000,
    votesAgainst: 1200000,
    totalVotes: 5400000,
    quorum: 4000000,
    startTime: "2026-01-02 00:00",
    endTime: "2026-01-09 00:00",
    snapshotBlock: 51900000,
  },
  {
    id: 3,
    title: "MIP-003: Agregar soporte para Base Network",
    description: "Expandir MexiSwap a Base Network (L2 de Coinbase) para capturar nueva liquidez y usuarios del ecosistema Coinbase.",
    category: "protocol",
    status: "pending",
    proposer: "0x9876...5432",
    votesFor: 0,
    votesAgainst: 0,
    totalVotes: 0,
    quorum: 4000000,
    startTime: "2026-01-08 00:00",
    endTime: "2026-01-15 00:00",
    snapshotBlock: 52100000,
  },
  {
    id: 4,
    title: "MIP-004: Implementar sistema de referidos",
    description: "Crear un programa de referidos donde los usuarios ganen 10% de las comisiones generadas por sus referidos durante 6 meses.",
    category: "protocol",
    status: "passed",
    proposer: "0xdef0...1234",
    votesFor: 6800000,
    votesAgainst: 1500000,
    totalVotes: 8300000,
    quorum: 4000000,
    startTime: "2025-12-20 00:00",
    endTime: "2025-12-27 00:00",
    executionTime: "2026-01-05 00:00",
    snapshotBlock: 51500000,
  },
  {
    id: 5,
    title: "MIP-005: Reducir quorum de votación al 3%",
    description: "Reducir el quorum requerido para aprobar propuestas del 4% al 3% del supply total para facilitar la gobernanza.",
    category: "governance",
    status: "rejected",
    proposer: "0x5555...6666",
    votesFor: 2100000,
    votesAgainst: 5200000,
    totalVotes: 7300000,
    quorum: 4000000,
    startTime: "2025-12-15 00:00",
    endTime: "2025-12-22 00:00",
    snapshotBlock: 51200000,
  },
  {
    id: 6,
    title: "MIP-006: Actualización de emergencia - Parche de seguridad",
    description: "Propuesta de emergencia para implementar un parche de seguridad crítico identificado en la auditoría de Trail of Bits.",
    category: "emergency",
    status: "executed",
    proposer: "0xMULTISIG",
    votesFor: 9500000,
    votesAgainst: 100000,
    totalVotes: 9600000,
    quorum: 4000000,
    startTime: "2025-12-10 00:00",
    endTime: "2025-12-12 00:00",
    executionTime: "2025-12-13 00:00",
    snapshotBlock: 51000000,
  },
];

// Estadísticas de gobernanza
const GOVERNANCE_STATS = {
  totalProposals: 6,
  activeProposals: 2,
  passedProposals: 2,
  rejectedProposals: 1,
  totalVoters: 12500,
  totalVotingPower: 450000000,
  treasuryBalance: 125000000,
  quorumPercentage: 4,
};

// Categorías con colores
const CATEGORY_CONFIG: Record<ProposalCategory, { label: string; color: string; bg: string }> = {
  treasury: { label: "Tesoro", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  protocol: { label: "Protocolo", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  governance: { label: "Gobernanza", color: "text-purple-500", bg: "bg-purple-500/10" },
  emergency: { label: "Emergencia", color: "text-red-500", bg: "bg-red-500/10" },
};

// Status con colores
const STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: { label: "Activa", color: "text-terminal-green", bg: "bg-terminal-green/10", icon: <Clock className="h-4 w-4" /> },
  passed: { label: "Aprobada", color: "text-terminal-green", bg: "bg-terminal-green/10", icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: "Rechazada", color: "text-red-500", bg: "bg-red-500/10", icon: <XCircle className="h-4 w-4" /> },
  pending: { label: "Pendiente", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: <AlertCircle className="h-4 w-4" /> },
  executed: { label: "Ejecutada", color: "text-cyan-500", bg: "bg-cyan-500/10", icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function Governance() {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ProposalCategory | "all">("all");
  const [expandedProposal, setExpandedProposal] = useState<number | null>(null);
  const [userVotingPower] = useState(125000); // Simulado

  // Filtrar propuestas
  const filteredProposals = PROPOSALS.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  // Votar en una propuesta
  const handleVote = (proposalId: number, voteFor: boolean) => {
    toast.success(
      `Voto registrado: ${voteFor ? "A FAVOR" : "EN CONTRA"}`,
      { description: `Tu voto de ${userVotingPower.toLocaleString()} MEXI ha sido registrado.` }
    );
  };

  // Calcular porcentajes
  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  // Calcular tiempo restante
  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return "Finalizada";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Vote className="h-8 w-8 text-terminal-green" />
                Gobernanza
              </h1>
              <p className="text-muted-foreground mt-1">
                Participa en las decisiones del protocolo MexiSwap
              </p>
            </div>
            <Button className="bg-terminal-green hover:bg-terminal-green/90 text-black">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Propuesta
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Propuestas</div>
                <div className="text-2xl font-bold">{GOVERNANCE_STATS.totalProposals}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Propuestas Activas</div>
                <div className="text-2xl font-bold text-terminal-green">{GOVERNANCE_STATS.activeProposals}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Votantes Únicos</div>
                <div className="text-2xl font-bold">{GOVERNANCE_STATS.totalVoters.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Poder de Voto Total</div>
                <div className="text-2xl font-bold">{(GOVERNANCE_STATS.totalVotingPower / 1000000).toFixed(0)}M</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Tesoro</div>
                <div className="text-2xl font-bold text-cyan-500">{(GOVERNANCE_STATS.treasuryBalance / 1000000).toFixed(0)}M</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111111] border-white/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Tu Poder de Voto</div>
                <div className="text-2xl font-bold text-terminal-green">{userVotingPower.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <div className="flex gap-1">
              {(["all", "active", "pending", "passed", "rejected", "executed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-terminal-green text-black"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {status === "all" ? "Todos" : STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Categoría:</span>
            <div className="flex gap-1">
              {(["all", "protocol", "treasury", "governance", "emergency"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    categoryFilter === cat
                      ? "bg-terminal-green text-black"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {cat === "all" ? "Todas" : CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de propuestas */}
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const forPercentage = calculatePercentage(proposal.votesFor, proposal.totalVotes);
            const againstPercentage = calculatePercentage(proposal.votesAgainst, proposal.totalVotes);
            const quorumPercentage = calculatePercentage(proposal.totalVotes, proposal.quorum);
            const isExpanded = expandedProposal === proposal.id;
            const statusConfig = STATUS_CONFIG[proposal.status];
            const categoryConfig = CATEGORY_CONFIG[proposal.category];

            return (
              <Card key={proposal.id} className="bg-[#111111] border-white/5 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header de la propuesta */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryConfig.bg} ${categoryConfig.color}`}>
                            {categoryConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                          {proposal.status === "active" && (
                            <span className="text-xs text-muted-foreground">
                              {getTimeRemaining(proposal.endTime)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{proposal.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Barra de votos compacta */}
                        {proposal.totalVotes > 0 && (
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-terminal-green">{forPercentage.toFixed(1)}%</span>
                              <span className="text-red-500">{againstPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                              <div 
                                className="bg-terminal-green h-full" 
                                style={{ width: `${forPercentage}%` }}
                              />
                              <div 
                                className="bg-red-500 h-full" 
                                style={{ width: `${againstPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-4 bg-[#0A0A0A]">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Descripción completa */}
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Descripción</h4>
                            <p className="text-sm">{proposal.description}</p>
                          </div>

                          {/* Detalles */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Propuesto por:</span>
                              <span className="ml-2 font-mono">{proposal.proposer}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Snapshot Block:</span>
                              <span className="ml-2 font-mono">#{proposal.snapshotBlock.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Inicio:</span>
                              <span className="ml-2">{proposal.startTime}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fin:</span>
                              <span className="ml-2">{proposal.endTime}</span>
                            </div>
                          </div>

                          {/* Botones de votación */}
                          {proposal.status === "active" && (
                            <div className="flex gap-3 pt-4">
                              <Button 
                                onClick={() => handleVote(proposal.id, true)}
                                className="flex-1 bg-terminal-green hover:bg-terminal-green/90 text-black"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Votar A FAVOR
                              </Button>
                              <Button 
                                onClick={() => handleVote(proposal.id, false)}
                                variant="outline"
                                className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Votar EN CONTRA
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Panel de votos */}
                        <div className="space-y-4">
                          <Card className="bg-[#111111] border-white/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Resultados de Votación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* A favor */}
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-terminal-green">A Favor</span>
                                  <span className="font-mono">{(proposal.votesFor / 1000000).toFixed(2)}M MEXI</span>
                                </div>
                                <Progress value={forPercentage} className="h-2 bg-white/10" />
                                <div className="text-right text-xs text-muted-foreground mt-1">
                                  {forPercentage.toFixed(1)}%
                                </div>
                              </div>

                              {/* En contra */}
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-red-500">En Contra</span>
                                  <span className="font-mono">{(proposal.votesAgainst / 1000000).toFixed(2)}M MEXI</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-500 rounded-full" 
                                    style={{ width: `${againstPercentage}%` }}
                                  />
                                </div>
                                <div className="text-right text-xs text-muted-foreground mt-1">
                                  {againstPercentage.toFixed(1)}%
                                </div>
                              </div>

                              {/* Quorum */}
                              <div className="pt-2 border-t border-white/5">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Quorum</span>
                                  <span className={`font-mono ${quorumPercentage >= 100 ? "text-terminal-green" : "text-yellow-500"}`}>
                                    {quorumPercentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(quorumPercentage, 100)} 
                                  className="h-2 bg-white/10" 
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>{(proposal.totalVotes / 1000000).toFixed(2)}M</span>
                                  <span>{(proposal.quorum / 1000000).toFixed(2)}M requerido</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Tu voto */}
                          <Card className="bg-[#111111] border-white/5">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Tu poder de voto</span>
                                <span className="font-mono text-terminal-green">{userVotingPower.toLocaleString()} MEXI</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay propuestas</h3>
            <p className="text-muted-foreground">No se encontraron propuestas con los filtros seleccionados.</p>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#111111] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-terminal-green" />
                Cómo Votar
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Conecta tu wallet con tokens MEXI</p>
              <p>2. Tu poder de voto = balance de MEXI en el snapshot block</p>
              <p>3. Selecciona una propuesta activa</p>
              <p>4. Vota A FAVOR o EN CONTRA</p>
              <p>5. Confirma la transacción (sin gas en Polygon)</p>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-500" />
                Crear Propuesta
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Requisitos para crear una propuesta:</p>
              <p>• Mínimo 100,000 MEXI en tu wallet</p>
              <p>• Discusión previa en el foro</p>
              <p>• Periodo de votación: 7 días</p>
              <p>• Quorum: 4% del supply total</p>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Tesoro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Balance actual del tesoro:</p>
              <p className="text-2xl font-bold text-white">125,000,000 MEXI</p>
              <p className="text-xs">≈ $10.6M USD</p>
              <p className="pt-2">Controlado por la DAO para desarrollo, marketing y operaciones.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
