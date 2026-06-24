// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Minimal interface for the canonical CreateX factory.
/// @dev Full factory: https://github.com/pcaversaccio/createx
///      Deployed at 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed on all major
///      chains (incl. mainnet + sepolia). Only the two functions we use are
///      declared here so the deploy scripts don't need the full lib/submodule.
interface ICreateX {
    /// @notice Deploys `initCode` via CREATE3 using a guarded `salt`.
    /// @dev The resulting address depends only on the (guarded) salt and the
    ///      factory address — NOT on `initCode` — so it is identical across
    ///      chains for the same salt.
    function deployCreate3(bytes32 salt, bytes memory initCode)
        external
        payable
        returns (address newContract);

    /// @notice Computes the CREATE3 address for an already-guarded salt.
    function computeCreate3Address(bytes32 salt)
        external
        view
        returns (address computedAddress);
}
