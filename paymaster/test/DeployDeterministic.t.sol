// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {DeploySepoliaDeterministic} from "../script/DeploySepoliaDeterministic.s.sol";
import {DeployMainnetDeterministic} from "../script/DeployMainnetDeterministic.s.sol";
import {TONPaymaster} from "../src/TONPaymaster.sol";
import {ICreateX} from "createx/ICreateX.sol";

contract DeployDeterministicTest is Test {
    // 테스트용 가상 프라이빗 키
    address internal deployerAddr;

    function setUp() public {
        uint256 testPrivKey = vm.envUint("PRIVATE_KEY");
        deployerAddr = vm.addr(testPrivKey);
        
        // 스크립트 실행 시 사용할 PRIVATE_KEY 설정
        vm.setEnv("PRIVATE_KEY", vm.toString(testPrivKey));
    }

    function test_DeterministicDeploymentOnSepoliaFork() public {
        string memory rpcUrl = vm.envOr("SEPOLIA_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        DeploySepoliaDeterministic deployerScript = new DeploySepoliaDeterministic();
        
        vm.deal(deployerAddr, 100 ether);

        address deployed = deployerScript.run();

        // .env 파일에서 기대값 읽기
        address expectedEntryPoint = vm.envAddress("ENTRY_POINT_V08");
        address expectedTonToken = vm.envAddress("SEPOLIA_TON_TOKEN");

        _verifyDeployment(deployed, expectedEntryPoint, expectedTonToken);
    }

    function test_DeterministicDeploymentOnMainnetFork() public {
        string memory rpcUrl = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        vm.createSelectFork(rpcUrl);
        DeployMainnetDeterministic deployerScript = new DeployMainnetDeterministic();
        
        vm.deal(deployerAddr, 100 ether);

        address deployed = deployerScript.run();

        // .env 파일에서 기대값 읽기
        address expectedEntryPoint = vm.envAddress("ENTRY_POINT_V08");
        address expectedTonToken = vm.envAddress("MAINNET_TON_TOKEN");

        _verifyDeployment(deployed, expectedEntryPoint, expectedTonToken);
    }

    function _verifyDeployment(address deployed, address expectedEntryPoint, address expectedTonToken) internal {
        console.log("Deployed TONPaymaster address:", deployed);
        
        // 배포 확인
        assertGt(deployed.code.length, 0, "Contract should be deployed");
        
        TONPaymaster paymaster = TONPaymaster(payable(deployed));
        assertEq(address(paymaster.entryPoint()), expectedEntryPoint, "EntryPoint mismatch");
        assertEq(address(paymaster.token()), expectedTonToken, "TON token mismatch");
        assertEq(paymaster.owner(), deployerAddr, "Owner mismatch");
        
        // EntryPoint 예치 확인
        (uint256 deposit, , , , ) = paymaster.entryPoint().getDepositInfo(address(paymaster));
        assertGt(deposit, 0, "EntryPoint should have a deposit");
    }
}
