// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/TONPaymaster.sol";

contract DeployTONPaymaster is Script {
    function run() external {
        // Sepolia addresses
        address entryPointV08 = 0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108;
        address tonToken = 0xa30fe40285B8f5c0457DbC3B7C8A280373c40044;
        address deployer = msg.sender;

        // TON price: ~2500 TON per ETH (testnet approximate)
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
