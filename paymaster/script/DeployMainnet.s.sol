// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/TONPaymaster.sol";

contract DeployTONPaymasterMainnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Load values from .env
        address entryPointV08 = vm.envAddress("ENTRY_POINT_V08");
        address tonToken = vm.envAddress("MAINNET_TON_TOKEN");
        address wtonWethPool = vm.envAddress("MAINNET_WTON_WETH_POOL");
        address weth = vm.envAddress("MAINNET_WETH");
        address wton = vm.envAddress("MAINNET_WTON_TOKEN");
        uint256 tokenPerEth = vm.envUint("DEFAULT_TOKEN_PER_ETH");
        uint32 twapPeriod = uint32(vm.envUint("TWAP_PERIOD"));

        vm.startBroadcast(deployerPrivateKey);

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
        paymaster.setOracleConfig(wtonWethPool, weth, wton, twapPeriod);
        console.log("Oracle configured: WTON/WETH pool, 30min TWAP");

        // Enable oracle pricing
        paymaster.setUseOracle(true);
        console.log("Oracle mode enabled");

        // Stake on EntryPoint (required for paymaster to be accepted by bundlers)
        paymaster.addStake{value: 0.1 ether}(86400);
        console.log("Staked 0.1 ETH on EntryPoint");

        // Deposit ETH on EntryPoint (gas prepayment pool)
        paymaster.deposit{value: 1 ether}();
        console.log("Deposited 1 ETH on EntryPoint");

        vm.stopBroadcast();

        console.log("Done! Paymaster is ready with TWAP oracle.");
        console.log("Owner:", deployer);
        console.log("TON Token:", tonToken);
        console.log("Oracle Pool:", wtonWethPool);
    }
}
