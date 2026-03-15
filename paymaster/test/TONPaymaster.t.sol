// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/TONPaymaster.sol";

/// @notice Mock ERC-20 token for testing
contract MockTON {
    string public name = "Tokamak Network";
    string public symbol = "TON";
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @notice Mock EntryPoint that forwards calls to paymaster
contract MockEntryPoint {
    // Minimal deposit tracking
    mapping(address => uint256) public deposits;
    mapping(address => bool) public staked;

    function addStake(uint32) external payable {
        staked[msg.sender] = true;
    }

    function unlockStake() external {}
    function withdrawStake(address payable) external {}

    function depositTo(address account) external payable {
        deposits[account] += msg.value;
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external {
        deposits[msg.sender] -= withdrawAmount;
        (bool ok,) = withdrawAddress.call{value: withdrawAmount}("");
        require(ok);
    }

    function getDepositInfo(address account) external view returns (
        uint256 deposit, bool _staked, uint112 stake, uint32 unstakeDelaySec, uint64 withdrawTime
    ) {
        return (deposits[account], staked[account], 0, 0, 0);
    }

    /// @notice Simulate EntryPoint calling validatePaymasterUserOp
    function simulateValidation(
        TONPaymaster paymaster,
        PackedUserOperation calldata userOp,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData) {
        return paymaster.validatePaymasterUserOp(userOp, bytes32(0), maxCost);
    }

    /// @notice Simulate EntryPoint calling postOp
    function simulatePostOp(
        TONPaymaster paymaster,
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external {
        paymaster.postOp(mode, context, actualGasCost, actualUserOpFeePerGas);
    }

    receive() external payable {}
}

contract TONPaymasterTest is Test {
    TONPaymaster public paymaster;
    MockTON public ton;
    MockEntryPoint public entryPoint;

    address public owner = address(0xABCD);
    address public user = address(0x1111);
    address public guarantor;
    uint256 public guarantorKey;

    uint256 public constant TOKEN_PER_ETH = 2500e18;
    uint256 public constant INITIAL_BALANCE = 1_000_000e18;

    function setUp() public {
        // Generate guarantor keypair for EIP-712 signing
        guarantorKey = 0xBEEF;
        guarantor = vm.addr(guarantorKey);

        ton = new MockTON();
        entryPoint = new MockEntryPoint();
        paymaster = new TONPaymaster(
            IEntryPoint(address(entryPoint)),
            IERC20(address(ton)),
            TOKEN_PER_ETH,
            owner
        );

        // Fund accounts
        ton.mint(user, INITIAL_BALANCE);
        ton.mint(guarantor, INITIAL_BALANCE);

        // User approves paymaster
        vm.prank(user);
        ton.approve(address(paymaster), type(uint256).max);

        // Guarantor approves paymaster
        vm.prank(guarantor);
        ton.approve(address(paymaster), type(uint256).max);

        // Stake paymaster
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        paymaster.addStake{value: 0.01 ether}(86400);

        vm.prank(owner);
        paymaster.deposit{value: 0.1 ether}();
    }

    // ─── Helper: build a minimal PackedUserOperation ──────────────

    function _buildUserOp(address sender, bytes memory paymasterAndData)
        internal pure returns (PackedUserOperation memory)
    {
        // gasFees: lower 128 bits = maxFeePerGas, upper 128 bits = maxPriorityFeePerGas
        uint256 maxFeePerGas = 30 gwei;
        bytes32 gasFees = bytes32(uint256(maxFeePerGas));

        return PackedUserOperation({
            sender: sender,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: gasFees,
            paymasterAndData: paymasterAndData,
            signature: ""
        });
    }

    function _buildPaymasterAndData(uint8 mode) internal view returns (bytes memory) {
        return abi.encodePacked(address(paymaster), mode);
    }

    function _buildGuarantorPaymasterAndData(
        address sender,
        uint256 maxTokenCost,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bytes memory) {
        // Sign the guarantor hash
        bytes32 hash = _getGuarantorHash(sender, maxTokenCost, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(guarantorKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        return abi.encodePacked(
            address(paymaster),  // 20 bytes
            uint8(0x01),         // mode byte
            guarantor,           // 20 bytes
            validUntil,          // 6 bytes
            validAfter,          // 6 bytes
            signature            // 65 bytes
        );
    }

    function _getGuarantorHash(
        address sender,
        uint256 maxTokenCost,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bytes32) {
        bytes32 GUARANTOR_TYPEHASH = keccak256(
            "Guarantee(address sender,uint256 maxTokenCost,uint48 validUntil,uint48 validAfter)"
        );

        bytes32 structHash = keccak256(abi.encode(
            GUARANTOR_TYPEHASH, sender, maxTokenCost, validUntil, validAfter
        ));

        // Build domain separator from eip712Domain() components
        bytes32 domainSeparator = _buildDomainSeparator();
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _buildDomainSeparator() internal view returns (bytes32) {
        (, string memory name, string memory version, uint256 chainId, address verifyingContract, , ) =
            paymaster.eip712Domain();
        bytes32 TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
        return keccak256(abi.encode(TYPE_HASH, keccak256(bytes(name)), keccak256(bytes(version)), chainId, verifyingContract));
    }

    // ─── Helper: extract validation data fields ──────────────────

    function _unpackValidationData(uint256 validationData)
        internal pure returns (bool sigFailed, uint48 validUntil, uint48 validAfter)
    {
        sigFailed = (validationData & 1) == 1;
        validUntil = uint48(validationData >> 160);
        validAfter = uint48(validationData >> 208);
    }

    // ═══════════════════════════════════════════════════════════════
    // Mode 0x00: CHARGE_IN_VALIDATE tests
    // ═══════════════════════════════════════════════════════════════

    function test_mode0_preChargeAndRefund() public {
        uint256 maxCost = 0.001 ether; // in wei
        bytes memory paymasterAndData = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        uint256 userBalanceBefore = ton.balanceOf(user);

        // Validate: should pre-charge user
        (bytes memory context, uint256 validationData) =
            entryPoint.simulateValidation(paymaster, userOp, maxCost);

        // User should have been charged
        uint256 userBalanceAfterValidation = ton.balanceOf(user);
        assertLt(userBalanceAfterValidation, userBalanceBefore, "user should be pre-charged");

        // Decode context
        (address ctxSender, uint256 ctxMaxTokenCost, uint8 ctxMode) =
            abi.decode(context, (address, uint256, uint8));
        assertEq(ctxSender, user);
        assertEq(ctxMode, 0x00);
        assertGt(ctxMaxTokenCost, 0);

        // Validation data should have time range
        (bool sigFailed, uint48 validUntil, uint48 validAfter) = _unpackValidationData(validationData);
        assertFalse(sigFailed);
        assertEq(validUntil, uint48(block.timestamp) + 300); // default 5 min
        assertEq(validAfter, 0);

        // PostOp: should refund excess
        uint256 actualGasCost = 0.0005 ether; // less than maxCost
        uint256 actualFeePerGas = 30 gwei;

        entryPoint.simulatePostOp(
            paymaster,
            PostOpMode.opSucceeded,
            context,
            actualGasCost,
            actualFeePerGas
        );

        uint256 userBalanceAfterPostOp = ton.balanceOf(user);
        // User should have been refunded some tokens (actual < max)
        assertGt(userBalanceAfterPostOp, userBalanceAfterValidation, "user should get refund");
        // But still less than original (paid actual cost)
        assertLt(userBalanceAfterPostOp, userBalanceBefore, "user paid actual cost");
    }

    function test_mode0_insufficientBalance_reverts() public {
        // User with no balance
        address poorUser = address(0x9999);
        ton.mint(poorUser, 0); // no tokens
        vm.prank(poorUser);
        ton.approve(address(paymaster), type(uint256).max);

        bytes memory paymasterAndData = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp = _buildUserOp(poorUser, paymasterAndData);

        vm.expectRevert(); // SafeERC20 will revert
        entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);
    }

    function test_mode0_noApproval_reverts() public {
        // User with balance but no approval
        address noApproveUser = address(0x8888);
        ton.mint(noApproveUser, INITIAL_BALANCE);
        // No approval given

        bytes memory paymasterAndData = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp = _buildUserOp(noApproveUser, paymasterAndData);

        vm.expectRevert(); // SafeERC20 will revert on transferFrom
        entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);
    }

    function test_mode0_emptyPaymasterData_defaultsToMode0() public {
        // paymasterAndData with only the paymaster address (no mode byte)
        bytes memory paymasterAndData = abi.encodePacked(address(paymaster));
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        (bytes memory context, ) = entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);

        (, , uint8 ctxMode) = abi.decode(context, (address, uint256, uint8));
        assertEq(ctxMode, 0x00, "should default to mode 0x00");
    }

    // ═══════════════════════════════════════════════════════════════
    // Mode 0x01: CHARGE_WITH_GUARANTOR tests
    // ═══════════════════════════════════════════════════════════════

    function test_mode1_guarantorPrePays_userRepays() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, maxTokenCost, validUntil, validAfter
        );

        uint256 guarantorBalanceBefore = ton.balanceOf(guarantor);
        uint256 userBalanceBefore = ton.balanceOf(user);

        // Validate: guarantor should be charged
        (bytes memory context, uint256 validationData) =
            entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);

        assertLt(ton.balanceOf(guarantor), guarantorBalanceBefore, "guarantor should be pre-charged");
        assertEq(ton.balanceOf(user), userBalanceBefore, "user should NOT be charged yet");

        // Validation data: signature valid, time range matches
        {
            (bool sigFailed, uint48 vUntil, uint48 vAfter) = _unpackValidationData(validationData);
            assertFalse(sigFailed, "signature should be valid");
            assertEq(vUntil, validUntil);
            assertEq(vAfter, validAfter);
        }

        // PostOp: user has balance + approval, so user pays and guarantor gets refunded
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);

        // Guarantor should get full pre-payment back
        assertEq(ton.balanceOf(guarantor), guarantorBalanceBefore, "guarantor should be fully refunded");
        // User should have paid actual cost
        assertLt(ton.balanceOf(user), userBalanceBefore, "user should have paid actual cost");
    }

    function test_mode1_guarantorPays_userCantPay() public {
        // User with NO approval and NO balance
        address brokeUser = address(0x7777);
        // No tokens, no approval

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);

        uint256 maxFeePerGas = 30 gwei;
        uint256 totalMaxCost = maxCost + (60000 * maxFeePerGas);
        uint256 maxTokenCost = paymaster.ethToToken(totalMaxCost);

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            brokeUser, maxTokenCost, validUntil, validAfter
        );
        PackedUserOperation memory userOp = _buildUserOp(brokeUser, paymasterAndData);

        uint256 guarantorBalanceBefore = ton.balanceOf(guarantor);

        // Validate: guarantor pre-pays
        (bytes memory context, ) = entryPoint.simulateValidation(paymaster, userOp, maxCost);

        // PostOp: user can't pay, guarantor absorbs cost
        uint256 actualGasCost = 0.0005 ether;
        uint256 actualFeePerGas = 30 gwei;

        entryPoint.simulatePostOp(
            paymaster,
            PostOpMode.opSucceeded,
            context,
            actualGasCost,
            actualFeePerGas
        );

        // Guarantor should only get partial refund (maxTokenCost - actualTokenCost)
        uint256 guarantorBalanceAfter = ton.balanceOf(guarantor);
        assertLt(guarantorBalanceAfter, guarantorBalanceBefore, "guarantor absorbs actual cost");
        // But guarantor gets excess back
        uint256 actualTokenCost = paymaster.ethToToken(actualGasCost + (60000 * actualFeePerGas));
        uint256 expectedGuarantorLoss = actualTokenCost;
        assertEq(
            guarantorBalanceBefore - guarantorBalanceAfter,
            expectedGuarantorLoss,
            "guarantor loss should equal actual token cost"
        );
    }

    function _buildBadSigPaymasterData(uint256 maxTokenCost, uint48 validUntil, uint48 validAfter)
        internal view returns (bytes memory)
    {
        // Sign with WRONG key
        bytes32 hash = _getGuarantorHash(user, maxTokenCost, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xDEAD, hash);
        return abi.encodePacked(
            address(paymaster),
            uint8(0x01),
            guarantor,
            validUntil,
            validAfter,
            abi.encodePacked(r, s, v)
        );
    }

    function test_mode1_invalidSignature_sigFailed() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildBadSigPaymasterData(maxTokenCost, validUntil, validAfter);
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        (, uint256 validationData) = entryPoint.simulateValidation(paymaster, userOp, maxCost);

        (bool sigFailed, , ) = _unpackValidationData(validationData);
        assertTrue(sigFailed, "signature validation should fail");
    }

    function test_mode1_invalidGuarantorData_reverts() public {
        // Too short paymasterData (missing guarantor fields)
        bytes memory paymasterAndData = abi.encodePacked(address(paymaster), uint8(0x01));
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        vm.expectRevert("TONPaymaster: invalid guarantor data");
        entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    // Time range tests
    // ═══════════════════════════════════════════════════════════════

    function test_timeRange_mode0_defaultWindow() public {
        bytes memory paymasterAndData = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        (, uint256 validationData) = entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);

        (, uint48 validUntil, uint48 validAfter) = _unpackValidationData(validationData);
        assertEq(validUntil, uint48(block.timestamp) + 300);
        assertEq(validAfter, 0);
    }

    function test_timeRange_customWindow() public {
        vm.prank(owner);
        paymaster.setValidityWindow(600); // 10 minutes

        bytes memory paymasterAndData = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        (, uint256 validationData) = entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);

        (, uint48 validUntil, ) = _unpackValidationData(validationData);
        assertEq(validUntil, uint48(block.timestamp) + 600);
    }

    function test_timeRange_mode1_usesGuarantorValues() public {
        uint48 validUntil = uint48(block.timestamp + 3600); // 1 hour
        uint48 validAfter = uint48(block.timestamp + 60);   // starts in 1 min

        uint256 maxFeePerGas = 30 gwei;
        uint256 totalMaxCost = 0.001 ether + (60000 * maxFeePerGas);
        uint256 maxTokenCost = paymaster.ethToToken(totalMaxCost);

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, maxTokenCost, validUntil, validAfter
        );
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        (, uint256 validationData) = entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);

        (, uint48 vUntil, uint48 vAfter) = _unpackValidationData(validationData);
        assertEq(vUntil, validUntil);
        assertEq(vAfter, validAfter);
    }

    // ═══════════════════════════════════════════════════════════════
    // Invalid mode test
    // ═══════════════════════════════════════════════════════════════

    function test_invalidMode_reverts() public {
        bytes memory paymasterAndData = abi.encodePacked(address(paymaster), uint8(0x02));
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        vm.expectRevert("TONPaymaster: invalid mode");
        entryPoint.simulateValidation(paymaster, userOp, 0.001 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    // PostOp: postOpReverted skips
    // ═══════════════════════════════════════════════════════════════

    function test_postOp_reverted_skips() public {
        bytes memory context = abi.encode(user, 1000e18, uint8(0x00));

        // Should not revert, just return silently
        entryPoint.simulatePostOp(
            paymaster,
            PostOpMode.postOpReverted,
            context,
            0.001 ether,
            30 gwei
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // Owner functions
    // ═══════════════════════════════════════════════════════════════

    function test_setValidityWindow() public {
        vm.prank(owner);
        paymaster.setValidityWindow(120);
        assertEq(paymaster.validityWindow(), 120);
    }

    function test_setValidityWindow_zero_reverts() public {
        vm.prank(owner);
        vm.expectRevert("Validity window must be > 0");
        paymaster.setValidityWindow(0);
    }

    function test_setValidityWindow_nonOwner_reverts() public {
        vm.prank(user);
        vm.expectRevert();
        paymaster.setValidityWindow(120);
    }

    // ═══════════════════════════════════════════════════════════════
    // Constructor / defaults
    // ═══════════════════════════════════════════════════════════════

    function test_constructor_defaults() public view {
        assertEq(paymaster.validityWindow(), 300);
        assertEq(paymaster.MODE_CHARGE(), 0x00);
        assertEq(paymaster.MODE_GUARANTOR(), 0x01);
        assertEq(paymaster.markupBps(), 15000);
        assertEq(paymaster.postOpGasOverhead(), 60000);
    }

    // ═══════════════════════════════════════════════════════════════
    // EIP-712 domain separator
    // ═══════════════════════════════════════════════════════════════

    function test_domainSeparator_exists() public view {
        bytes32 ds = _buildDomainSeparator();
        assertTrue(ds != bytes32(0), "domain separator should be non-zero");
    }
}
