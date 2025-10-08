// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MockOracle.sol";

/// @title PerpEngine
/// @notice Placeholder contract exposing the interfaces the frontend expects while emitting events for off-chain simulation.
contract PerpEngine {
    using SafeERC20 for IERC20;

    struct PositionIntent {
        uint256 id;
        address account;
        bool isLong;
        uint256 size; // base asset quantity with 18 decimals.
        uint256 margin; // collateral posted (USDC 6 decimals).
        uint256 leverage;
        uint256 timestamp;
        bool open;
    }

    event CollateralDeposited(address indexed account, uint256 amount);
    event CollateralWithdrawn(address indexed account, uint256 amount);
    event PositionIntentSubmitted(
        uint256 indexed id,
        address indexed account,
        bool isLong,
        uint256 size,
        uint256 margin,
        uint256 leverage
    );
    event PositionClosed(uint256 indexed id, address indexed account);
    event PositionLiquidated(address indexed account, uint256 indexed id);

    IERC20 public immutable collateral;
    MockOracle public immutable priceOracle;

    mapping(address => uint256) public collateralBalances;
    mapping(uint256 => PositionIntent) public positionIntents;
    uint256 public nextIntentId = 1;

    constructor(IERC20 collateral_, MockOracle oracle_) {
        collateral = collateral_;
        priceOracle = oracle_;
    }

    function deposit(uint256 amount) external {
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        collateralBalances[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(collateralBalances[msg.sender] >= amount, "insufficient collateral");
        collateralBalances[msg.sender] -= amount;
        collateral.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function openPosition(
        bool isLong,
        uint256 size,
        uint256 margin,
        uint256 leverage
    ) external returns (uint256) {
        require(margin > 0, "margin required");
        require(leverage >= 1, "invalid leverage");
        require(collateralBalances[msg.sender] >= margin, "insufficient margin");

        uint256 id = nextIntentId++;
        positionIntents[id] = PositionIntent({
            id: id,
            account: msg.sender,
            isLong: isLong,
            size: size,
            margin: margin,
            leverage: leverage,
            timestamp: block.timestamp,
            open: true
        });

        emit PositionIntentSubmitted(id, msg.sender, isLong, size, margin, leverage);
        return id;
    }

    function closePosition(uint256 intentId) external {
        PositionIntent storage intent = positionIntents[intentId];
        require(intent.account == msg.sender, "not position owner");
        require(intent.open, "already closed");
        intent.open = false;
        emit PositionClosed(intentId, msg.sender);
    }

    function liquidate(uint256 intentId, address account) external {
        PositionIntent storage intent = positionIntents[intentId];
        require(intent.account == account, "mismatched account");
        require(intent.open, "intent not open");
        intent.open = false;
        emit PositionLiquidated(account, intentId);
    }

    function getIndexPrice() external view returns (uint256) {
        return priceOracle.getPrice();
    }
}
