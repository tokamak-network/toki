// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/TONPaymaster.sol";

contract DeployTONPaymasterMainnet is Script {
    function run() external {
        // Mainnet addresses
        address entryPointV08 = 0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108;
        address tonToken = 0x2be5e8c109e2197D077D13A82dAead6a9b3433C5;
        address deployer = msg.sender;

        // Uniswap V3 WTON/WETH pool (0.3% fee)
        address wtonWethPool = 0xC29271E3a68A7647Fd1399298Ef18FeCA3879F59;
        address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address wton = 0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2;

        // Fallback manual price (used until oracle is enabled)
        uint256 tokenPerEth = 2500e18;

        vm.startBroadcast();

        // Deploy paymaster
        TONPaymaster paymaster = new TONPaymaster(
            IEntryPoint(entryPointV08),
            IERC20(tonToken),
            tokenPerEth,
            deployer
        );

        console.log("TONPaymaster deployed at:", address(paymaster));

        // Configure Uniswap V3 TWAP oracle
        // 30-minute TWAP window for manipulation resistance
        paymaster.setOracleConfig(wtonWethPool, weth, wton, 1800);
        console.log("Oracle configured: WTON/WETH pool, 30min TWAP");

        // Enable oracle pricing
        paymaster.setUseOracle(true);
        console.log("Oracle mode enabled");

        // Stake on EntryPoint (required for paymaster to be accepted by bundlers)
        paymaster.addStake{value: 0.1 ether}(86400);
        console.log("Staked 0.1 ETH on EntryPoint");

        // Deposit ETH on EntryPoint (gas prepayment pool)
        paymaster.deposit{value: 0.3 ether}();
        console.log("Deposited 0.3 ETH on EntryPoint");

        vm.stopBroadcast();

        console.log("Done! Paymaster is ready with TWAP oracle.");
        console.log("Owner:", deployer);
        console.log("TON Token:", tonToken);
        console.log("Oracle Pool:", wtonWethPool);
    }
}
