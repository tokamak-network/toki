// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ICreateX} from "createx/ICreateX.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TONPaymaster, IEntryPoint} from "../src/TONPaymaster.sol";

/**
 * @title DeployDeterministic
 * @notice Script to deploy TONPaymaster to the same address across all networks.
 * @dev Uses CreateX (canonical address 0xBA5e015b1f344a2488Cf3321d6cE542F8E9f3055)
 *      to perform a CREATE3 deployment.
 */
contract DeployDeterministic is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Load common config from .env
        address CREATEX_FACTORY = vm.envAddress("CREATEX_FACTORY");
        address entryPoint = vm.envOr("ENTRY_POINT", vm.envAddress("ENTRY_POINT_V08"));
        address tonToken = vm.envOr("TON_TOKEN", vm.envAddress("SEPOLIA_TON_TOKEN"));
        uint256 tokenPerEth = vm.envOr("TOKEN_PER_ETH", vm.envUint("DEFAULT_TOKEN_PER_ETH"));

        vm.startBroadcast(deployerPrivateKey);

        // 1. CreateX Guarded Salt:
        // [20 bytes: deployer] + [1 byte: 0x00 for cross-chain consistency] + [11 bytes: entropy]
        bytes memory saltEntropy = abi.encodePacked(bytes11(keccak256("TONPaymaster-V1")));
        bytes32 salt = bytes32(abi.encodePacked(deployer, hex"00", saltEntropy));

        // 2. Encode constructor arguments
        bytes memory constructorArgs = abi.encode(
            IEntryPoint(entryPoint),
            IERC20(tonToken),
            tokenPerEth,
            deployer
        );

        // 3. Prepare creation code + constructor arguments
        bytes memory initCode = abi.encodePacked(type(TONPaymaster).creationCode, constructorArgs);

        // 4. Check if CreateX is deployed on this chain
        if (CREATEX_FACTORY.code.length == 0) {
            console.log("CreateX factory not found at", CREATEX_FACTORY);
            console.log("Please ensure CreateX is deployed or use a different factory.");
            revert("CreateX factory not found");
        }

        // 5. Deploy using CREATE3 via CreateX
        address deployed = ICreateX(CREATEX_FACTORY).deployCreate3(
            salt,
            initCode
        );

        console.log("TONPaymaster deployed deterministically at:", deployed);

        // 6. Initial setup
        TONPaymaster paymaster = TONPaymaster(payable(deployed));
        (uint256 deposit, , , , ) = paymaster.entryPoint().getDepositInfo(address(paymaster));
        if (deposit < 0.01 ether) {
            paymaster.deposit{value: 0.1 ether}();
            console.log("Deposited 0.1 ETH for gas prefunding on EntryPoint");
        }

        vm.stopBroadcast();
    }
}
