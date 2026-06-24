// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TONPaymaster, IEntryPoint} from "../src/TONPaymaster.sol";
import {ICreateX} from "../src/interfaces/ICreateX.sol";

/// @notice Deterministic (CREATE3) deployment of TONPaymaster on Sepolia.
/// @dev Produces the SAME address on every chain for a given salt, via the
///      canonical CreateX factory. Mirrors the v4 post-deploy setup in
///      Deploy.s.sol (stake + deposit; oracle is mainnet-only). All config is
///      read from .env — see paymaster/.env.example.
///
/// Usage:
///   forge script script/DeploySepoliaDeterministic.s.sol \
///     --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract DeploySepoliaDeterministic is Script {
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
        TONPaymaster paymaster = TONPaymaster(payable(deployed));

        // v4 setup (mirrors Deploy.s.sol): stake + deposit on EntryPoint.
        paymaster.addStake{value: 0.01 ether}(86400);
        paymaster.deposit{value: 0.1 ether}();

        vm.stopBroadcast();

        console.log("TONPaymaster deployed at:", deployed);
        console.log("Owner:", deployer);
        return deployed;
    }

    /// @dev Salt layout: [deployer(20B)][0x00 redeploy-protection flag][entropy(11B)].
    ///      deployer prefix => CreateX permissioned protection (only this EOA can
    ///      deploy with this salt). 0x00 => no cross-chain redeploy protection, so
    ///      the address is identical across chains. Kept in a helper to bound the
    ///      stack and avoid via_ir.
    function _build(address deployer)
        internal
        view
        returns (bytes32 salt, bytes32 guardedSalt, bytes memory initCode)
    {
        address entryPoint = vm.envAddress("ENTRY_POINT_V08");
        address tonToken = vm.envAddress("SEPOLIA_TON_TOKEN");
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
}
