// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {DeploySepoliaDeterministic} from "../script/DeploySepoliaDeterministic.s.sol";
import {DeployMainnetDeterministic} from "../script/DeployMainnetDeterministic.s.sol";
import {TONPaymaster} from "../src/TONPaymaster.sol";

/// @notice Fork tests for the deterministic CREATE3 deploy scripts.
/// @dev Each test no-ops (returns early) when its RPC URL env var is unset, so
///      CI without secrets passes. To run for real, set PRIVATE_KEY, the RPC
///      URL, and the address/pricing vars from paymaster/.env.example.
contract DeployDeterministicTest is Test {
    address internal deployerAddr;

    function setUp() public {
        // Default to a throwaway key so the suite compiles/loads without secrets;
        // a real PRIVATE_KEY in .env overrides it for actual fork runs.
        uint256 testPrivKey = vm.envOr("PRIVATE_KEY", uint256(0xA11CE));
        deployerAddr = vm.addr(testPrivKey);
        vm.setEnv("PRIVATE_KEY", vm.toString(testPrivKey));
    }

    function test_DeterministicDeploymentOnSepoliaFork() public {
        string memory rpcUrl = vm.envOr("SEPOLIA_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        vm.deal(deployerAddr, 100 ether);

        address deployed = new DeploySepoliaDeterministic().run();

        _verifyDeployment(
            deployed,
            vm.envAddress("ENTRY_POINT_V08"),
            vm.envAddress("SEPOLIA_TON_TOKEN")
        );
    }

    function test_DeterministicDeploymentOnMainnetFork() public {
        string memory rpcUrl = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        vm.deal(deployerAddr, 100 ether);

        address deployed = new DeployMainnetDeterministic().run();

        _verifyDeployment(
            deployed,
            vm.envAddress("ENTRY_POINT_V08"),
            vm.envAddress("MAINNET_TON_TOKEN")
        );
    }

    function _verifyDeployment(
        address deployed,
        address expectedEntryPoint,
        address expectedTonToken
    ) internal view {
        console.log("Deployed TONPaymaster:", deployed);

        assertGt(deployed.code.length, 0, "Contract should be deployed");

        TONPaymaster paymaster = TONPaymaster(payable(deployed));
        assertEq(address(paymaster.entryPoint()), expectedEntryPoint, "EntryPoint mismatch");
        assertEq(address(paymaster.token()), expectedTonToken, "TON token mismatch");
        assertEq(paymaster.owner(), deployerAddr, "Owner mismatch");

        // EntryPoint deposit was funded during deploy.
        (uint256 deposit,,,,) = paymaster.entryPoint().getDepositInfo(deployed);
        assertGt(deposit, 0, "EntryPoint should have a deposit");
    }
}
