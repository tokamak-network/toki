// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ICreateX} from "createx/ICreateX.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TONPaymaster, IEntryPoint} from "../src/TONPaymaster.sol";

/**
 * @title DeployDeterministic
 * @notice Script to deploy TONPaymaster to the same address across all networks.
 * @dev Uses CreateX (canonical address 0xba5e015b1f344a2488cf3321d6ce542f8e9f3055)
 *      to perform a CREATE3 deployment.
 *      
 *      CreateX is a permissionless factory that allows for safe and easy use of CREATE2/CREATE3.
 *      GitHub: https://github.com/pcaversaccio/createx
 */
contract DeployDeterministic is Script {
    // Canonical CreateX address
    address constant CREATEX_FACTORY = 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);

        // Load configuration from environment
        address entryPoint = vm.envOr("ENTRY_POINT", vm.envAddress("ENTRY_POINT_V08"));
        address tonToken = vm.envOr("TON_TOKEN", vm.envAddress("SEPOLIA_TON_TOKEN"));
        uint256 tokenPerEth = vm.envOr("TOKEN_PER_ETH", vm.envUint("DEFAULT_TOKEN_PER_ETH"));

        console.log("EntryPoint:", entryPoint);
        console.log("TON Token:", tonToken);
        console.log("Token per ETH:", tokenPerEth);

        // 1. Prepare CreateX Guarded Salt:
        // [20 bytes: deployer] + [1 byte: 0x00] + [11 bytes: entropy]
        // Setting the 21st byte to 0x00 disables cross-chain redeploy protection,
        // which means the same salt will result in the same address across all chains.
        bytes11 entropy = bytes11(keccak256(abi.encodePacked("TONPaymaster-V1")));
        bytes32 salt = bytes32(abi.encodePacked(deployer, hex"00", entropy));

        // 2. Prepare Init Code (Creation Code + Constructor Arguments)
        bytes memory constructorArgs = abi.encode(
            IEntryPoint(entryPoint),
            IERC20(tonToken),
            tokenPerEth,
            deployer // Initial owner
        );
        bytes memory initCode = abi.encodePacked(type(TONPaymaster).creationCode, constructorArgs);

        // 3. Pre-calculate the deterministic address
        // CreateX internally "guards" the salt. For (MsgSender + FalseRedeployProtection),
        // it hashes the sender address with the salt.
        bytes32 guardedSalt = keccak256(abi.encodePacked(bytes32(uint256(uint160(deployer))), salt));
        address computedAddress = ICreateX(CREATEX_FACTORY).computeCreate3Address(guardedSalt);
        
        console.log("Computed TONPaymaster address:", computedAddress);

        // 4. Check if CreateX is available
        if (CREATEX_FACTORY.code.length == 0) {
            console.log("CreateX factory not found at", CREATEX_FACTORY);
            console.log("Please ensure CreateX is deployed on this network.");
            revert("CreateX factory not found");
        }

        // 5. Deploy if not already deployed
        if (computedAddress.code.length > 0) {
            console.log("Contract already deployed at:", computedAddress);
        } else {
            vm.startBroadcast(deployerPrivateKey);

            // Using deployCreate3 for cross-chain address consistency (independent of initCode)
            address deployed = ICreateX(CREATEX_FACTORY).deployCreate3(
                salt,
                initCode
            );

            console.log("TONPaymaster deployed at:", deployed);
            require(deployed == computedAddress, "Address mismatch");

            // Initial setup: deposit some ETH for gas to EntryPoint if balance is low
            TONPaymaster paymaster = TONPaymaster(payable(deployed));
            (uint256 deposit, , , , ) = IEntryPoint(entryPoint).getDepositInfo(address(paymaster));
            if (deposit < 0.01 ether) {
                paymaster.deposit{value: 0.1 ether}();
                console.log("Deposited 0.1 ETH to EntryPoint for gas prefunding");
            }

            vm.stopBroadcast();
        }
    }
}
