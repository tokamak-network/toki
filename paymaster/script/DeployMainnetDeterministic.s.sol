// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TONPaymaster, IEntryPoint} from "../src/TONPaymaster.sol";
import {ICreateX} from "../src/interfaces/ICreateX.sol";

/// @notice Deterministic (CREATE3) deployment of TONPaymaster on Mainnet.
/// @dev Produces the SAME address on every chain for a given salt, via the
///      canonical CreateX factory. Mirrors the full v4 post-deploy setup in
///      DeployMainnet.s.sol — Uniswap V3 TWAP oracle, 5% markup, stake and
///      deposit — so the deterministic deploy ships a CONFIGURED paymaster, not
///      a bare one. All config is read from .env — see paymaster/.env.example.
///
/// Usage:
///   forge script script/DeployMainnetDeterministic.s.sol \
///     --rpc-url $MAINNET_RPC_URL --broadcast --verify
///
/// NOTE: If the deployer EOA carries EIP-7702 delegation code, multi-tx forge
///       broadcasts can fail with "gapped-nonce tx" — clear the delegation or
///       use a fresh EOA for deployment.
contract DeployMainnetDeterministic is Script {
    function run() external returns (address) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address factory = vm.envAddress("CREATEX_FACTORY");

        (bytes32 salt, bytes32 guardedSalt, bytes memory initCode) = _build(deployer);

        // Idempotent: if already deployed at the deterministic address, stop.
        address computed = ICreateX(factory).computeCreate3Address(guardedSalt);
        if (computed.code.length > 0) {
            console.log("TONPaymaster already deployed at:", computed);
            return computed;
        }

        vm.startBroadcast(pk);

        address deployed = ICreateX(factory).deployCreate3(salt, initCode);
        _configure(TONPaymaster(payable(deployed)));

        vm.stopBroadcast();

        console.log("TONPaymaster deployed at:", deployed);
        console.log("Owner:", deployer);
        return deployed;
    }

    /// @dev See DeploySepoliaDeterministic._build for the salt layout. Helper
    ///      keeps the stack bounded so the project compiles without via_ir.
    function _build(address deployer)
        internal
        view
        returns (bytes32 salt, bytes32 guardedSalt, bytes memory initCode)
    {
        address entryPoint = vm.envAddress("ENTRY_POINT_V08");
        address tonToken = vm.envAddress("MAINNET_TON_TOKEN");
        uint256 tokenPerEth = vm.envUint("DEFAULT_TOKEN_PER_ETH");
        string memory entropyString = vm.envOr("SALT_ENTROPY", string("TONPaymaster-V1"));

        bytes11 entropy = bytes11(keccak256(abi.encodePacked(entropyString)));
        salt = bytes32(abi.encodePacked(deployer, hex"00", entropy));
        guardedSalt = keccak256(abi.encodePacked(bytes32(uint256(uint160(deployer))), salt));

        initCode = abi.encodePacked(
            type(TONPaymaster).creationCode,
            abi.encode(IEntryPoint(entryPoint), IERC20(tonToken), tokenPerEth, deployer)
        );
    }

    /// @dev v4 post-deploy configuration (mirrors DeployMainnet.s.sol). Reads
    ///      oracle/markup config from .env; stake and deposit are fixed
    ///      operational amounts.
    function _configure(TONPaymaster paymaster) internal {
        // Uniswap V3 WTON/WETH TWAP oracle for manipulation-resistant pricing.
        paymaster.setOracleConfig(
            vm.envAddress("MAINNET_WTON_WETH_POOL"),
            vm.envAddress("MAINNET_WETH"),
            vm.envAddress("MAINNET_WTON_TOKEN"),
            uint32(vm.envOr("TWAP_PERIOD", uint256(1800)))
        );
        paymaster.setUseOracle(true);

        // Markup in bps (>= 10000). 10500 = 5%; default 15000 (50%) is test-only.
        paymaster.setMarkup(vm.envOr("MARKUP_BPS", uint256(10500)));

        // EntryPoint stake (bundler acceptance) + deposit (gas prepayment pool).
        paymaster.addStake{value: 0.01 ether}(86400);
        paymaster.deposit{value: 0.05 ether}();
    }
}
