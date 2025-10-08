// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Faucet-style ERC20 token for demo collateral in the perpetual trading MVP.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    /// @notice Override decimals to mirror USDC's 6 decimal places.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address; unrestricted for sandbox simplicity.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
