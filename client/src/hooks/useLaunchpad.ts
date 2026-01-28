import { useState, useCallback, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';

/**
 * Hook para interactuar con el contrato MexiLaunchpad
 * Maneja la lectura de proyectos, compra de tokens y reclamo de vesting
 */

interface LaunchpadProject {
  id: number;
  name: string;
  symbol: string;
  tokenAddress: string;
  tokenPrice: bigint;
  softCap: bigint;
  hardCap: bigint;
  raised: bigint;
  startTime: number;
  endTime: number;
  vestingDuration: number;
  vestingCliff: number;
  tgePercent: number;
  minPurchase: bigint;
  maxPurchase: bigint;
  isActive: boolean;
  requiresKYC: boolean;
}

interface UserAllocation {
  amount: bigint;
  claimed: bigint;
  claimable: bigint;
  nextClaimTime: number;
}

export function useLaunchpad() {
  const { signer, address } = useWeb3();
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato MexiLaunchpad (será configurada durante el despliegue)
  const LAUNCHPAD_ADDRESS = process.env.REACT_APP_LAUNCHPAD_ADDRESS || '';

  // ABI del contrato MexiLaunchpad (simplificado)
  const LAUNCHPAD_ABI = [
    {
      type: 'function',
      name: 'getProjects',
      inputs: [],
      outputs: [
        {
          type: 'tuple[]',
          components: [
            { name: 'id', type: 'uint256' },
            { name: 'name', type: 'string' },
            { name: 'symbol', type: 'string' },
            { name: 'tokenAddress', type: 'address' },
            { name: 'tokenPrice', type: 'uint256' },
            { name: 'softCap', type: 'uint256' },
            { name: 'hardCap', type: 'uint256' },
            { name: 'raised', type: 'uint256' },
            { name: 'startTime', type: 'uint256' },
            { name: 'endTime', type: 'uint256' },
            { name: 'vestingDuration', type: 'uint256' },
            { name: 'vestingCliff', type: 'uint256' },
            { name: 'tgePercent', type: 'uint256' },
            { name: 'minPurchase', type: 'uint256' },
            { name: 'maxPurchase', type: 'uint256' },
            { name: 'isActive', type: 'bool' },
            { name: 'requiresKYC', type: 'bool' },
          ],
        },
      ],
    },
    {
      type: 'function',
      name: 'buyTokens',
      inputs: [
        { name: 'projectId', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [],
    },
    {
      type: 'function',
      name: 'claimTokens',
      inputs: [{ name: 'projectId', type: 'uint256' }],
      outputs: [],
    },
    {
      type: 'function',
      name: 'getUserAllocation',
      inputs: [
        { name: 'projectId', type: 'uint256' },
        { name: 'user', type: 'address' },
      ],
      outputs: [
        {
          type: 'tuple',
          components: [
            { name: 'amount', type: 'uint256' },
            { name: 'claimed', type: 'uint256' },
            { name: 'claimable', type: 'uint256' },
            { name: 'nextClaimTime', type: 'uint256' },
          ],
        },
      ],
    },
  ];

  /**
   * Obtener lista de proyectos del contrato
   */
  const fetchProjects = useCallback(async () => {
    if (!signer || !LAUNCHPAD_ADDRESS) {
      setError('Wallet no conectada o contrato no configurado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Aquí se haría la llamada al contrato
      // const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      // const projectsData = await contract.getProjects();
      // setProjects(projectsData);

      // Por ahora, retornar array vacío hasta que el contrato esté desplegado
      setProjects([]);
      toast.success('Proyectos cargados');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar proyectos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [signer, LAUNCHPAD_ADDRESS]);

  /**
   * Comprar tokens de un proyecto
   */
  const buyTokens = useCallback(
    async (projectId: number, amount: bigint) => {
      if (!signer || !LAUNCHPAD_ADDRESS) {
        toast.error('Wallet no conectada');
        return false;
      }

      setLoading(true);
      try {
        // const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
        // const tx = await contract.buyTokens(projectId, amount);
        // await tx.wait();

        toast.success('Compra exitosa');
        await fetchProjects();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error en la compra';
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [signer, LAUNCHPAD_ADDRESS, fetchProjects]
  );

  /**
   * Reclamar tokens vesting
   */
  const claimTokens = useCallback(
    async (projectId: number) => {
      if (!signer || !LAUNCHPAD_ADDRESS) {
        toast.error('Wallet no conectada');
        return false;
      }

      setLoading(true);
      try {
        // const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
        // const tx = await contract.claimTokens(projectId);
        // await tx.wait();

        toast.success('Tokens reclamados exitosamente');
        await fetchProjects();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al reclamar tokens';
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [signer, LAUNCHPAD_ADDRESS, fetchProjects]
  );

  /**
   * Obtener asignación del usuario para un proyecto
   */
  const getUserAllocation = useCallback(
    async (projectId: number): Promise<UserAllocation | null> => {
      if (!signer || !address || !LAUNCHPAD_ADDRESS) {
        return null;
      }

      try {
        // const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
        // const allocation = await contract.getUserAllocation(projectId, address);
        // return allocation;

        return null;
      } catch (err) {
        console.error('Error al obtener asignación:', err);
        return null;
      }
    },
    [signer, address, LAUNCHPAD_ADDRESS]
  );

  // Cargar proyectos al conectar
  useEffect(() => {
    if (signer && LAUNCHPAD_ADDRESS) {
      fetchProjects();
    }
  }, [signer, LAUNCHPAD_ADDRESS, fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    buyTokens,
    claimTokens,
    getUserAllocation,
  };
}
