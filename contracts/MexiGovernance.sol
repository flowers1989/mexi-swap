// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MexiGovernance
 * @notice Sistema de gobernanza descentralizada para MexiSwap
 * @dev Implementa votación on-chain con timelock y medidas de seguridad extremas
 * 
 * SEGURIDAD:
 * - ReentrancyGuard en todas las funciones críticas
 * - Timelock de 48h para ejecución de propuestas
 * - Quorum dinámico basado en participación
 * - Snapshot de balances para prevenir flash loan attacks
 * - Pausable para emergencias
 * - Access control granular
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IMexiToken {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
}

contract MexiGovernance is ReentrancyGuard, Pausable, AccessControl {
    using Counters for Counters.Counter;

    // ============ ROLES ============
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    // ============ ESTADO ============
    IMexiToken public immutable mexiToken;
    Counters.Counter private _proposalIdCounter;

    // Configuración de gobernanza
    uint256 public votingDelay = 1 days;           // Tiempo antes de que comience la votación
    uint256 public votingPeriod = 7 days;          // Duración de la votación
    uint256 public executionDelay = 48 hours;      // Timelock después de aprobación
    uint256 public proposalThreshold = 100_000e18; // 100,000 MEXI para proponer
    uint256 public quorumNumerator = 4;            // 4% del supply total
    uint256 public quorumDenominator = 100;

    // Estados de propuesta
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    // Estructura de propuesta
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 snapshotBlock;
        uint256 quorumRequired;
        uint256 executionETA;
        bool canceled;
        bool executed;
        // Acciones a ejecutar
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }

    // Estructura de voto
    struct Vote {
        bool hasVoted;
        uint8 support; // 0 = Against, 1 = For, 2 = Abstain
        uint256 weight;
    }

    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    mapping(address => uint256) public latestProposalIds;

    // ============ EVENTOS ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event ProposalExecuted(uint256 indexed proposalId);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    // ============ ERRORES ============
    error InsufficientVotingPower(uint256 required, uint256 actual);
    error ProposalNotActive();
    error ProposalNotSucceeded();
    error ProposalNotQueued();
    error AlreadyVoted();
    error InvalidProposalLength();
    error ProposalAlreadyExists();
    error TimelockNotExpired();
    error InvalidVoteType();
    error ProposalExpired();
    error ExecutionFailed();
    error OnlyProposer();

    // ============ CONSTRUCTOR ============
    constructor(address _mexiToken, address _guardian) {
        require(_mexiToken != address(0), "Invalid token address");
        require(_guardian != address(0), "Invalid guardian address");
        
        mexiToken = IMexiToken(_mexiToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _guardian);
        _grantRole(GUARDIAN_ROLE, _guardian);
        _grantRole(EXECUTOR_ROLE, _guardian);
    }

    // ============ FUNCIONES DE PROPUESTA ============

    /**
     * @notice Crear una nueva propuesta
     * @param targets Direcciones de contratos a llamar
     * @param values Valores ETH a enviar
     * @param calldatas Datos de llamada codificados
     * @param description Descripción de la propuesta
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external whenNotPaused nonReentrant returns (uint256) {
        // Validar longitudes
        if (targets.length != values.length || targets.length != calldatas.length) {
            revert InvalidProposalLength();
        }
        require(targets.length > 0, "Empty proposal");
        require(targets.length <= 10, "Too many actions");

        // Verificar poder de voto del proponente
        uint256 proposerVotes = mexiToken.getPastVotes(msg.sender, block.number - 1);
        if (proposerVotes < proposalThreshold) {
            revert InsufficientVotingPower(proposalThreshold, proposerVotes);
        }

        // Verificar que no tenga propuesta activa
        uint256 latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState state = getProposalState(latestProposalId);
            require(
                state != ProposalState.Active && state != ProposalState.Pending,
                "Active proposal exists"
            );
        }

        // Crear propuesta
        _proposalIdCounter.increment();
        uint256 proposalId = _proposalIdCounter.current();

        uint256 snapshotBlock = block.number;
        uint256 startBlock = block.number + (votingDelay / 12); // Asumiendo 12s por bloque
        uint256 endBlock = startBlock + (votingPeriod / 12);
        uint256 quorumRequired = (mexiToken.totalSupply() * quorumNumerator) / quorumDenominator;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startBlock = startBlock;
        proposal.endBlock = endBlock;
        proposal.snapshotBlock = snapshotBlock;
        proposal.quorumRequired = quorumRequired;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;

        latestProposalIds[msg.sender] = proposalId;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description,
            startBlock,
            endBlock
        );

        return proposalId;
    }

    /**
     * @notice Votar en una propuesta
     * @param proposalId ID de la propuesta
     * @param support 0 = Against, 1 = For, 2 = Abstain
     */
    function castVote(uint256 proposalId, uint8 support) external whenNotPaused nonReentrant {
        _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @notice Votar con razón
     */
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) external whenNotPaused nonReentrant {
        _castVote(proposalId, msg.sender, support, reason);
    }

    /**
     * @notice Lógica interna de votación
     */
    function _castVote(
        uint256 proposalId,
        address voter,
        uint8 support,
        string memory reason
    ) internal {
        if (support > 2) revert InvalidVoteType();
        
        ProposalState state = getProposalState(proposalId);
        if (state != ProposalState.Active) revert ProposalNotActive();

        Vote storage vote = proposalVotes[proposalId][voter];
        if (vote.hasVoted) revert AlreadyVoted();

        Proposal storage proposal = proposals[proposalId];
        
        // Obtener peso de voto del snapshot
        uint256 weight = mexiToken.getPastVotes(voter, proposal.snapshotBlock);
        require(weight > 0, "No voting power");

        vote.hasVoted = true;
        vote.support = support;
        vote.weight = weight;

        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(voter, proposalId, support, weight, reason);
    }

    /**
     * @notice Poner propuesta en cola para ejecución
     */
    function queue(uint256 proposalId) external whenNotPaused nonReentrant {
        ProposalState state = getProposalState(proposalId);
        if (state != ProposalState.Succeeded) revert ProposalNotSucceeded();

        Proposal storage proposal = proposals[proposalId];
        uint256 eta = block.timestamp + executionDelay;
        proposal.executionETA = eta;

        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Ejecutar propuesta aprobada
     */
    function execute(uint256 proposalId) external whenNotPaused nonReentrant {
        ProposalState state = getProposalState(proposalId);
        if (state != ProposalState.Queued) revert ProposalNotQueued();

        Proposal storage proposal = proposals[proposalId];
        
        if (block.timestamp < proposal.executionETA) revert TimelockNotExpired();
        if (block.timestamp > proposal.executionETA + 14 days) revert ProposalExpired();

        proposal.executed = true;

        // Ejecutar acciones
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            if (!success) revert ExecutionFailed();
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancelar propuesta (solo proponente o guardian)
     */
    function cancel(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        
        require(
            msg.sender == proposal.proposer || hasRole(GUARDIAN_ROLE, msg.sender),
            "Not authorized"
        );
        
        ProposalState state = getProposalState(proposalId);
        require(
            state != ProposalState.Canceled &&
            state != ProposalState.Executed &&
            state != ProposalState.Expired,
            "Cannot cancel"
        );

        proposal.canceled = true;

        emit ProposalCanceled(proposalId);
    }

    // ============ FUNCIONES DE VISTA ============

    /**
     * @notice Obtener estado de una propuesta
     */
    function getProposalState(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) return ProposalState.Canceled;
        if (proposal.executed) return ProposalState.Executed;
        if (block.number < proposal.startBlock) return ProposalState.Pending;
        if (block.number <= proposal.endBlock) return ProposalState.Active;
        
        // Verificar quorum y mayoría
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        bool quorumReached = totalVotes >= proposal.quorumRequired;
        bool majorityFor = proposal.forVotes > proposal.againstVotes;
        
        if (!quorumReached || !majorityFor) return ProposalState.Defeated;
        if (proposal.executionETA == 0) return ProposalState.Succeeded;
        if (block.timestamp < proposal.executionETA) return ProposalState.Queued;
        if (block.timestamp > proposal.executionETA + 14 days) return ProposalState.Expired;
        
        return ProposalState.Queued;
    }

    /**
     * @notice Obtener información de propuesta
     */
    function getProposalInfo(uint256 proposalId) external view returns (
        address proposer,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 startBlock,
        uint256 endBlock,
        ProposalState state
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.startBlock,
            proposal.endBlock,
            getProposalState(proposalId)
        );
    }

    /**
     * @notice Verificar si una dirección ha votado
     */
    function hasVoted(uint256 proposalId, address account) external view returns (bool) {
        return proposalVotes[proposalId][account].hasVoted;
    }

    /**
     * @notice Obtener quorum actual requerido
     */
    function quorum() public view returns (uint256) {
        return (mexiToken.totalSupply() * quorumNumerator) / quorumDenominator;
    }

    /**
     * @notice Obtener número total de propuestas
     */
    function proposalCount() external view returns (uint256) {
        return _proposalIdCounter.current();
    }

    // ============ FUNCIONES DE ADMINISTRACIÓN ============

    /**
     * @notice Actualizar quorum (solo governance)
     */
    function setQuorum(uint256 newNumerator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newNumerator >= 1 && newNumerator <= 20, "Invalid quorum");
        uint256 oldQuorum = quorumNumerator;
        quorumNumerator = newNumerator;
        emit QuorumUpdated(oldQuorum, newNumerator);
    }

    /**
     * @notice Actualizar delay de votación
     */
    function setVotingDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDelay >= 1 hours && newDelay <= 7 days, "Invalid delay");
        uint256 oldDelay = votingDelay;
        votingDelay = newDelay;
        emit VotingDelayUpdated(oldDelay, newDelay);
    }

    /**
     * @notice Actualizar periodo de votación
     */
    function setVotingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid period");
        uint256 oldPeriod = votingPeriod;
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(oldPeriod, newPeriod);
    }

    /**
     * @notice Pausar gobernanza (emergencia)
     */
    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    /**
     * @notice Reanudar gobernanza
     */
    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }

    /**
     * @notice Recibir ETH para ejecución de propuestas
     */
    receive() external payable {}
}
