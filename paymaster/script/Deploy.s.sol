// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/TONPaymaster.sol";

contract DeployTONPaymaster is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Load values from .env
        address entryPointV08 = vm.envAddress("ENTRY_POINT_V08");
        address tonToken = vm.envAddress("SEPOLIA_TON_TOKEN");
        uint256 tokenPerEth = vm.envUint("DEFAULT_TOKEN_PER_ETH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy paymaster
        TONPaymaster paymaster = new TONPaymaster(
            IEntryPoint(entryPointV08),
            IERC20(tonToken),
            tokenPerEth,
            deployer
        );

        console.log("TONPaymaster deployed at:", address(paymaster));

        // Stake on EntryPoint (required for paymaster to be accepted by bundlers)
        // 0.01 ETH stake with 1 day unstake delay
        paymaster.addStake{value: 0.01 ether}(86400);
        console.log("Staked 0.01 ETH on EntryPoint");

        // Deposit ETH on EntryPoint (gas prepayment pool)
        // 0.1 ETH deposit for gas prefunding
        paymaster.deposit{value: 0.1 ether}();
        console.log("Deposited 0.1 ETH on EntryPoint");

        vm.stopBroadcast();

        console.log("Done! Paymaster is ready.");
        console.log("Owner:", deployer);
        console.log("Token:", tonToken);
        console.log("TokenPerEth:", tokenPerEth);
    }
}
