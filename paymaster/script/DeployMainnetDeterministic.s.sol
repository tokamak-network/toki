// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ICreateX} from "createx/ICreateX.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TONPaymaster, IEntryPoint} from "../src/TONPaymaster.sol";

contract DeployMainnetDeterministic is Script {
    function run() public returns(address) {
        address createxFactory = vm.envAddress("CREATEX_FACTORY");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        address entryPoint = vm.envAddress("ENTRY_POINT_V08");
        address tonToken = vm.envAddress("MAINNET_TON_TOKEN");
        uint256 tokenPerEth = vm.envUint("DEFAULT_TOKEN_PER_ETH");
        string memory entropyString = vm.envOr("SALT_ENTROPY", string("TONPaymaster-V1"));
        uint256 initialDeposit = vm.envUint("INITIAL_DEPOSIT");

        bytes11 entropy = bytes11(keccak256(abi.encodePacked(entropyString)));
        bytes32 salt = bytes32(abi.encodePacked(deployer, hex"00", entropy));

        bytes memory constructorArgs = abi.encode(
            IEntryPoint(entryPoint),
            IERC20(tonToken),
            tokenPerEth,
            deployer
        );
        bytes memory initCode = abi.encodePacked(type(TONPaymaster).creationCode, constructorArgs);

        bytes32 guardedSalt = keccak256(abi.encodePacked(bytes32(uint256(uint160(deployer))), salt));
        address computedAddress = ICreateX(createxFactory).computeCreate3Address(guardedSalt);

        if (computedAddress.code.length > 0) {
            console.log("Contract already deployed at:", computedAddress);
            return computedAddress;
        }

        vm.startBroadcast(deployerPrivateKey);
        address deployed = ICreateX(createxFactory).deployCreate3(salt, initCode);
        
        TONPaymaster paymaster = TONPaymaster(payable(deployed));
        if (initialDeposit > 0) {
            paymaster.deposit{value: initialDeposit}();
            console.log("Deposited", initialDeposit, "wei to EntryPoint");
        }
        
        vm.stopBroadcast();
        console.log("TONPaymaster deployed at:", deployed);
        return deployed;
    }
}
