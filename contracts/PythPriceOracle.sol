/**
 * @title PythPriceOracle
 * @author MexiSwap Team
 * @notice Contrato para obtener precios de Pyth Network
 * @dev Implementa la interfaz de Pyth para leer precios de forma segura
 */

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract PythPriceOracle {
    IPyth public pyth;

    constructor(address _pythAddress) {
        pyth = IPyth(_pythAddress);
    }

    function getPrice(bytes32 priceId) public view returns (int64) {
        PythStructs.Price memory price = pyth.getPrice(priceId);
        require(price.publishTime > block.timestamp - 60, "PYTH: STALE_PRICE");
        return price.price;
    }

    function getEmaPrice(bytes32 priceId) public view returns (int64) {
        PythStructs.Price memory price = pyth.getEmaPrice(priceId);
        require(price.publishTime > block.timestamp - 60, "PYTH: STALE_PRICE");
        return price.price;
    }
}
