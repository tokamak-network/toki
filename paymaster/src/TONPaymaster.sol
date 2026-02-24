// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Minimal PackedUserOperation struct (ERC-4337 v0.7/v0.8)
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

/// @notice Minimal IEntryPoint interface for staking and deposits
interface IEntryPoint {
    function addStake(uint32 unstakeDelaySec) external payable;
    function unlockStake() external;
    function withdrawStake(address payable withdrawAddress) external;
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function getDepositInfo(address account) external view returns (
        uint256 deposit,
        bool staked,
        uint112 stake,
        uint32 unstakeDelaySec,
        uint64 withdrawTime
    );
}

/// @notice Post-operation mode
enum PostOpMode {
    opSucceeded,
    opReverted,
    postOpReverted
}

/// @title TONPaymaster
/// @notice ERC-4337 Paymaster that accepts TON token for gas payment
/// @dev Works with EntryPoint v0.7/v0.8. The paymaster:
///   1. In validatePaymasterUserOp: checks user has enough TON balance + allowance
///   2. EntryPoint executes user's calldata (which should include approve to this paymaster)
///   3. In postOp: transfers actual gas cost in TON from user to paymaster
contract TONPaymaster is Ownable {
    using SafeERC20 for IERC20;

    IEntryPoint public immutable entryPoint;
    IERC20 public immutable token;

    /// @notice TON per ETH exchange rate (18 decimals)
    /// e.g., 2500e18 means 2500 TON = 1 ETH
    uint256 public tokenPerEth;

    /// @notice Price markup in basis points (10000 = 100%, 15000 = 150%)
    uint256 public markupBps;

    /// @notice Estimated gas for postOp (transferFrom). Added to cost calculation.
    uint256 public postOpGasOverhead;

    event PriceUpdated(uint256 tokenPerEth);
    event MarkupUpdated(uint256 markupBps);
    event GasPayment(address indexed sender, uint256 tonAmount, uint256 ethCost);

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "Not EntryPoint");
        _;
    }

    constructor(
        IEntryPoint _entryPoint,
        IERC20 _token,
        uint256 _tokenPerEth,
        address _owner
    ) Ownable(_owner) {
        entryPoint = _entryPoint;
        token = _token;
        tokenPerEth = _tokenPerEth;
        markupBps = 15000; // 150% default markup
        postOpGasOverhead = 60000; // ~60k gas for transferFrom in postOp
    }

    // ─── IPaymaster interface ─────────────────────────────────────

    /// @notice Called by EntryPoint to validate the paymaster's willingness to pay
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32, /* userOpHash */
        uint256 maxCost
    ) external onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        // Calculate max TON cost including postOp overhead
        // maxCost is in wei; add postOp gas cost
        uint256 maxFeePerGas = uint128(uint256(userOp.gasFees));
        uint256 totalMaxCost = maxCost + (postOpGasOverhead * maxFeePerGas);
        uint256 maxTokenCost = _ethToToken(totalMaxCost);

        address sender = userOp.sender;

        // NOTE: During validation, the UserOp's calldata hasn't executed yet.
        // The user must have pre-approved this paymaster, OR the calldata
        // includes an approve call that will execute before postOp.
        // We check balance here; allowance is checked in postOp since
        // the approve call in calldata hasn't executed during validation.
        require(token.balanceOf(sender) >= maxTokenCost, "TONPaymaster: insufficient TON");

        context = abi.encode(sender, maxTokenCost);
        validationData = 0; // valid, no time range
    }

    /// @notice Called by EntryPoint after UserOp execution to collect payment
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external onlyEntryPoint {
        if (mode == PostOpMode.postOpReverted) return;

        (address sender, ) = abi.decode(context, (address, uint256));

        // Calculate actual TON cost including postOp gas
        uint256 totalGasCost = actualGasCost + (postOpGasOverhead * actualUserOpFeePerGas);
        uint256 actualTokenCost = _ethToToken(totalGasCost);

        // Transfer TON from user to paymaster
        // This will revert if allowance is insufficient, reverting the entire UserOp
        token.safeTransferFrom(sender, address(this), actualTokenCost);

        emit GasPayment(sender, actualTokenCost, totalGasCost);
    }

    // ─── Owner functions ──────────────────────────────────────────

    function setPrice(uint256 _tokenPerEth) external onlyOwner {
        require(_tokenPerEth > 0, "Price must be > 0");
        tokenPerEth = _tokenPerEth;
        emit PriceUpdated(_tokenPerEth);
    }

    function setMarkup(uint256 _markupBps) external onlyOwner {
        require(_markupBps >= 10000, "Markup must be >= 100%");
        markupBps = _markupBps;
        emit MarkupUpdated(_markupBps);
    }

    function setPostOpGasOverhead(uint256 _overhead) external onlyOwner {
        postOpGasOverhead = _overhead;
    }

    // ─── EntryPoint staking & deposits ────────────────────────────

    function addStake(uint32 unstakeDelaySec) external payable onlyOwner {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    function deposit() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function getDeposit() external view returns (uint256) {
        (uint256 dep,,,,) = entryPoint.getDepositInfo(address(this));
        return dep;
    }

    function unlockStake() external onlyOwner {
        entryPoint.unlockStake();
    }

    function withdrawStake(address payable to) external onlyOwner {
        entryPoint.withdrawStake(to);
    }

    function withdrawDeposit(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
    }

    // ─── Token & ETH withdrawal ───────────────────────────────────

    function withdrawToken(address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }

    function withdrawEth(address payable to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    // ─── View helpers ─────────────────────────────────────────────

    function ethToToken(uint256 ethAmount) external view returns (uint256) {
        return _ethToToken(ethAmount);
    }

    function _ethToToken(uint256 ethAmount) internal view returns (uint256) {
        return (ethAmount * tokenPerEth * markupBps) / (1e18 * 10000);
    }

    /// @notice Required to receive ETH for staking
    receive() external payable {}
}
