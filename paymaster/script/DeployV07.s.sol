// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/TONPaymaster.sol";

contract DeployTONPaymasterV07 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Load values from .env
        address entryPointV07 = vm.envAddress("ENTRY_POINT_V07");
        address tonToken = vm.envAddress("SEPOLIA_TON_TOKEN");
        uint256 tokenPerEth = vm.envUint("DEFAULT_TOKEN_PER_ETH");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy paymaster targeting EntryPoint v0.7
        TONPaymaster paymaster = new TONPaymaster(
            IEntryPoint(entryPointV07),
            IERC20(tonToken),
            tokenPerEth,
            deployer
        );

        console.log("TONPaymaster (v0.7) deployed at:", address(paymaster));

        // Stake on EntryPoint (required for paymaster to be accepted by bundlers)
        // 0.01 ETH stake with 1 day unstake delay
        paymaster.addStake{value: 0.01 ether}(86400);
        console.log("Staked 0.01 ETH on EntryPoint v0.7");

        // Deposit ETH on EntryPoint (gas prepayment pool)
        // 0.1 ETH deposit for gas prefunding
        paymaster.deposit{value: 0.1 ether}();
        console.log("Deposited 0.1 ETH on EntryPoint v0.7");

        vm.stopBroadcast();

        console.log("Done! Paymaster is ready for delegation-toolkit.");
        console.log("Owner:", deployer);
        console.log("Token:", tonToken);
        console.log("TokenPerEth:", tokenPerEth);
    }
}
