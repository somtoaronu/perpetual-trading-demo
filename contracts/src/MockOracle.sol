// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MockOracle
/// @notice Owner-controlled price oracle for testing funding and liquidation flows.
contract MockOracle {
    address public immutable owner;
    uint256 private _price;

    event PriceUpdated(uint256 newPrice, address indexed updater);

    error NotOwner();

    constructor(uint256 initialPrice) {
        owner = msg.sender;
        _price = initialPrice;
        emit PriceUpdated(initialPrice, msg.sender);
    }

    function setPrice(uint256 newPrice) external {
        if (msg.sender != owner) revert NotOwner();
        _price = newPrice;
        emit PriceUpdated(newPrice, msg.sender);
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }
}
