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

        // Admin deposits TON into paymaster pool (instead of guarantor approving)
        ton.mint(owner, INITIAL_BALANCE);
        vm.startPrank(owner);
        ton.approve(address(paymaster), type(uint256).max);
        paymaster.depositToken(INITIAL_BALANCE);
        vm.stopPrank();

        // Whitelist the test guarantor
        vm.prank(owner);
        paymaster.setTrustedGuarantor(guarantor, true);

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
        // EntryPoint v0.8: [paymaster(20B)][verificationGasLimit(16B)][postOpGasLimit(16B)][mode(1B)]
        return abi.encodePacked(
            address(paymaster),
            uint128(200000),  // verificationGasLimit (16B)
            uint128(100000),  // postOpGasLimit (16B)
            mode
        );
    }

    function _buildGuarantorPaymasterAndData(
        address sender,
        uint256 guaranteedAmount,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bytes memory) {
        uint256 nonce = paymaster.guarantorNonces(guarantor);
        // Sign the guarantor hash
        bytes32 hash = _getGuarantorHash(sender, guaranteedAmount, nonce, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(guarantorKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        return abi.encodePacked(
            address(paymaster),      // 20 bytes
            uint128(200000),         // verificationGasLimit (16B)
            uint128(100000),         // postOpGasLimit (16B)
            uint8(0x01),             // mode byte (at offset 52)
            guarantor,               // 20 bytes
            abi.encode(guaranteedAmount), // 32 bytes (abi-encoded uint256)
            validUntil,              // 6 bytes
            validAfter,              // 6 bytes
            signature                // 65 bytes
        );
    }

    function _getGuarantorHash(
        address sender,
        uint256 guaranteedAmount,
        uint256 nonce,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bytes32) {
        bytes32 GUARANTOR_TYPEHASH = keccak256(
            "Guarantee(address sender,uint256 guaranteedAmount,uint256 nonce,uint48 validUntil,uint48 validAfter)"
        );

        bytes32 structHash = keccak256(abi.encode(
            GUARANTOR_TYPEHASH, sender, guaranteedAmount, nonce, validUntil, validAfter
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
        // guaranteedAmount >= maxTokenCost; using same value
        uint256 guaranteedAmount = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, guaranteedAmount, validUntil, validAfter
        );

        uint256 poolBalanceBefore = ton.balanceOf(address(paymaster));
        uint256 userBalanceBefore = ton.balanceOf(user);

        // Validate: pool should have enough balance, no transfer happens
        (bytes memory context, uint256 validationData) =
            entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);

        assertEq(ton.balanceOf(address(paymaster)), poolBalanceBefore, "pool balance unchanged during validate");
        assertEq(ton.balanceOf(user), userBalanceBefore, "user should NOT be charged yet");

        // Validation data: signature valid, time range matches
        {
            (bool sigFailed, uint48 vUntil, uint48 vAfter) = _unpackValidationData(validationData);
            assertFalse(sigFailed, "signature should be valid");
            assertEq(vUntil, validUntil);
            assertEq(vAfter, validAfter);
        }

        // PostOp: user has balance + approval, so user pays
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);

        // User should have paid actual cost
        assertLt(ton.balanceOf(user), userBalanceBefore, "user should have paid actual cost");
    }

    function test_mode1_guarantorPays_userCantPay() public {
        // User with NO approval and NO balance
        address brokeUser = address(0x7777);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            brokeUser, maxTokenCost, validUntil, validAfter
        );

        uint256 poolBalanceBefore = ton.balanceOf(address(paymaster));

        // Validate: checks pool balance
        (bytes memory context, ) = entryPoint.simulateValidation(
            paymaster, _buildUserOp(brokeUser, paymasterAndData), maxCost
        );

        // PostOp: user can't pay, debt is recorded
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);

        // Pool balance unchanged
        assertEq(ton.balanceOf(address(paymaster)), poolBalanceBefore, "pool balance unchanged");

        // Debt should be recorded
        uint256 actualTokenCost = paymaster.ethToToken(0.0005 ether + (60000 * 30 gwei));
        assertEq(paymaster.getDebt(brokeUser), actualTokenCost, "debt should be recorded");
    }

    function _buildBadSigPaymasterData(uint256 guaranteedAmount, uint48 validUntil, uint48 validAfter)
        internal view returns (bytes memory)
    {
        uint256 nonce = paymaster.guarantorNonces(guarantor);
        // Sign with WRONG key
        bytes32 hash = _getGuarantorHash(user, guaranteedAmount, nonce, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xDEAD, hash);
        return abi.encodePacked(
            address(paymaster),
            uint128(200000),         // verificationGasLimit (16B)
            uint128(100000),         // postOpGasLimit (16B)
            uint8(0x01),
            guarantor,
            abi.encode(guaranteedAmount),
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
        bytes memory paymasterAndData = abi.encodePacked(
            address(paymaster),
            uint128(200000),  // verificationGasLimit
            uint128(100000),  // postOpGasLimit
            uint8(0x01)       // mode byte but no guarantor data
        );
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
        bytes memory paymasterAndData = abi.encodePacked(
            address(paymaster),
            uint128(200000),  // verificationGasLimit
            uint128(100000),  // postOpGasLimit
            uint8(0x02)       // invalid mode
        );
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

    // ═══════════════════════════════════════════════════════════════
    // v3: Guarantor nonce tests
    // ═══════════════════════════════════════════════════════════════

    function test_guarantorNonce_increments() public {
        assertEq(paymaster.guarantorNonces(guarantor), 0, "nonce should start at 0");

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 guaranteedAmount = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, guaranteedAmount, validUntil, validAfter
        );

        entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);
        assertEq(paymaster.guarantorNonces(guarantor), 1, "nonce should be 1 after first use");
    }

    function test_guarantorNonce_replayRejected() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 guaranteedAmount = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        // Build paymasterAndData with nonce=0
        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, guaranteedAmount, validUntil, validAfter
        );

        // First use: succeeds
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);

        // Replay with same data (nonce=0 signature, but contract expects nonce=1)
        // The signature will not match because the contract uses nonce=1 to verify
        (, uint256 validationData) =
            entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);

        (bool sigFailed, , ) = _unpackValidationData(validationData);
        assertTrue(sigFailed, "replayed signature should fail validation");
    }

    // ═══════════════════════════════════════════════════════════════
    // v3: guaranteedAmount tests
    // ═══════════════════════════════════════════════════════════════

    function test_guaranteedAmount_insufficientGuarantee_reverts() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);

        // guaranteedAmount is deliberately too small (1 wei)
        uint256 tinyGuarantee = 1;
        uint256 nonce = paymaster.guarantorNonces(guarantor);
        bytes32 hash = _getGuarantorHash(user, tinyGuarantee, nonce, validUntil, validAfter);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(guarantorKey, hash);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes memory paymasterAndData = abi.encodePacked(
            address(paymaster),
            uint128(200000),         // verificationGasLimit
            uint128(100000),         // postOpGasLimit
            uint8(0x01),
            guarantor,
            abi.encode(tinyGuarantee),
            validUntil,
            validAfter,
            signature
        );

        vm.expectRevert("TONPaymaster: insufficient guarantee");
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);
    }

    function test_guaranteedAmount_largerThanMaxTokenCost_succeeds() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        // guaranteedAmount is 2x maxTokenCost (generous)
        uint256 generousGuarantee = maxTokenCost * 2;

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, generousGuarantee, validUntil, validAfter
        );

        uint256 poolBalanceBefore = ton.balanceOf(address(paymaster));

        (bytes memory context, uint256 validationData) =
            entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);

        (bool sigFailed, , ) = _unpackValidationData(validationData);
        assertFalse(sigFailed, "signature should be valid");

        // Pool balance unchanged after validate
        assertEq(ton.balanceOf(address(paymaster)), poolBalanceBefore, "pool balance unchanged after validate");

        // PostOp: user pays
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);
    }

    // ═══════════════════════════════════════════════════════════════
    // v3: Debt tracking tests
    // ═══════════════════════════════════════════════════════════════

    function test_debt_recordedWhenUserCantPay() public {
        address brokeUser = address(0x7777);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            brokeUser, maxTokenCost, validUntil, validAfter
        );

        (bytes memory context, ) = entryPoint.simulateValidation(
            paymaster, _buildUserOp(brokeUser, paymasterAndData), maxCost
        );

        assertEq(paymaster.getDebt(brokeUser), 0, "no debt before postOp");

        uint256 actualGasCost = 0.0005 ether;
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, actualGasCost, 30 gwei);

        uint256 expectedDebt = paymaster.ethToToken(actualGasCost + (60000 * 30 gwei));
        assertEq(paymaster.getDebt(brokeUser), expectedDebt, "debt should be recorded");
    }

    function test_debt_collectedOnNextMode0Transaction() public {
        // Step 1: Create debt via guarantor mode with broke user
        address debtUser = address(0x6666);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            debtUser, maxTokenCost, validUntil, validAfter
        );

        (bytes memory context, ) = entryPoint.simulateValidation(
            paymaster, _buildUserOp(debtUser, paymasterAndData), maxCost
        );

        uint256 actualGasCost = 0.0005 ether;
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, actualGasCost, 30 gwei);

        uint256 debt = paymaster.getDebt(debtUser);
        assertGt(debt, 0, "debt should exist");

        // Step 2: User now has tokens and approval — do a Mode 0x00 transaction
        ton.mint(debtUser, INITIAL_BALANCE);
        vm.prank(debtUser);
        ton.approve(address(paymaster), type(uint256).max);

        bytes memory paymasterAndData2 = _buildPaymasterAndData(0x00);
        PackedUserOperation memory userOp2 = _buildUserOp(debtUser, paymasterAndData2);

        (bytes memory context2, ) = entryPoint.simulateValidation(paymaster, userOp2, maxCost);

        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context2, actualGasCost, 30 gwei);

        // Debt should be cleared
        assertEq(paymaster.getDebt(debtUser), 0, "debt cleared after mode0 postOp");
    }

    function test_debt_collectedOnNextMode1Transaction() public {
        // Step 1: Create debt
        address debtUser = address(0x5555);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            debtUser, maxTokenCost, validUntil, validAfter
        );

        (bytes memory context, ) = entryPoint.simulateValidation(
            paymaster, _buildUserOp(debtUser, paymasterAndData), maxCost
        );

        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);
        uint256 debt = paymaster.getDebt(debtUser);
        assertGt(debt, 0, "should have debt");

        // Step 2: User now has tokens — do Mode 0x01 where user CAN pay
        ton.mint(debtUser, INITIAL_BALANCE);
        vm.prank(debtUser);
        ton.approve(address(paymaster), type(uint256).max);

        // Build second guarantor transaction (nonce already incremented)
        bytes memory paymasterAndData2 = _buildGuarantorPaymasterAndData(
            debtUser, maxTokenCost, validUntil, validAfter
        );

        (bytes memory context2, ) = entryPoint.simulateValidation(
            paymaster, _buildUserOp(debtUser, paymasterAndData2), maxCost
        );

        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, context2, 0.0005 ether, 30 gwei);

        // Debt should be cleared
        assertEq(paymaster.getDebt(debtUser), 0, "debt collected in mode1 postOp");
    }

    function test_debt_accumulates() public {
        address brokeUser = address(0x4444);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        // First failed payment
        bytes memory pd1 = _buildGuarantorPaymasterAndData(brokeUser, maxTokenCost, validUntil, validAfter);
        (bytes memory ctx1, ) = entryPoint.simulateValidation(paymaster, _buildUserOp(brokeUser, pd1), maxCost);
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, ctx1, 0.0005 ether, 30 gwei);
        uint256 debt1 = paymaster.getDebt(brokeUser);

        // Second failed payment (nonce auto-incremented)
        bytes memory pd2 = _buildGuarantorPaymasterAndData(brokeUser, maxTokenCost, validUntil, validAfter);
        (bytes memory ctx2, ) = entryPoint.simulateValidation(paymaster, _buildUserOp(brokeUser, pd2), maxCost);
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, ctx2, 0.0005 ether, 30 gwei);
        uint256 debt2 = paymaster.getDebt(brokeUser);

        assertEq(debt2, debt1 * 2, "debt should accumulate");
    }

    // ═══════════════════════════════════════════════════════════════
    // v3: forgiveDebt tests
    // ═══════════════════════════════════════════════════════════════

    function test_forgiveDebt() public {
        // Create debt
        address brokeUser = address(0x3333);
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory pd = _buildGuarantorPaymasterAndData(brokeUser, maxTokenCost, validUntil, validAfter);
        (bytes memory ctx, ) = entryPoint.simulateValidation(paymaster, _buildUserOp(brokeUser, pd), maxCost);
        entryPoint.simulatePostOp(paymaster, PostOpMode.opSucceeded, ctx, 0.0005 ether, 30 gwei);

        assertGt(paymaster.getDebt(brokeUser), 0, "should have debt");

        // Owner forgives debt
        vm.prank(owner);
        paymaster.forgiveDebt(brokeUser);

        assertEq(paymaster.getDebt(brokeUser), 0, "debt should be forgiven");
    }

    function test_forgiveDebt_nonOwner_reverts() public {
        vm.prank(user);
        vm.expectRevert();
        paymaster.forgiveDebt(user);
    }

    // ═══════════════════════════════════════════════════════════════
    // v4: Pool-based tests
    // ═══════════════════════════════════════════════════════════════

    function test_depositToken_and_getTokenPool() public {
        uint256 depositAmount = 100e18;
        ton.mint(owner, depositAmount);
        vm.startPrank(owner);
        ton.approve(address(paymaster), depositAmount);
        paymaster.depositToken(depositAmount);
        vm.stopPrank();

        assertEq(paymaster.getTokenPool(), INITIAL_BALANCE + depositAmount);
    }

    function test_mode1_insufficientPool_reverts() public {
        // Withdraw all tokens from paymaster pool
        uint256 pool = ton.balanceOf(address(paymaster));
        vm.prank(owner);
        paymaster.withdrawToken(owner, pool);

        // Now try Mode 0x01 — should fail with insufficient pool
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, maxTokenCost, validUntil, validAfter
        );

        vm.expectRevert("TONPaymaster: insufficient token pool");
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);
    }

    // ═══════════════════════════════════════════════════════════════
    // v4: Guarantor Whitelist tests
    // ═══════════════════════════════════════════════════════════════

    function test_setTrustedGuarantor() public {
        address newGuarantor = address(0xAAAA);
        assertFalse(paymaster.trustedGuarantors(newGuarantor), "should not be trusted initially");

        vm.prank(owner);
        paymaster.setTrustedGuarantor(newGuarantor, true);
        assertTrue(paymaster.trustedGuarantors(newGuarantor), "should be trusted after adding");
    }

    function test_removeTrustedGuarantor() public {
        // Guarantor is already whitelisted in setUp
        assertTrue(paymaster.trustedGuarantors(guarantor), "should be trusted from setUp");

        vm.prank(owner);
        paymaster.setTrustedGuarantor(guarantor, false);
        assertFalse(paymaster.trustedGuarantors(guarantor), "should not be trusted after removal");
    }

    function test_setTrustedGuarantor_nonOwner_reverts() public {
        vm.prank(user);
        vm.expectRevert();
        paymaster.setTrustedGuarantor(address(0xBBBB), true);
    }

    function test_setTrustedGuarantor_zeroAddress_reverts() public {
        vm.prank(owner);
        vm.expectRevert("Invalid guarantor");
        paymaster.setTrustedGuarantor(address(0), true);
    }

    function test_mode1_untrustedGuarantor_reverts() public {
        // Remove guarantor from whitelist
        vm.prank(owner);
        paymaster.setTrustedGuarantor(guarantor, false);

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory paymasterAndData = _buildGuarantorPaymasterAndData(
            user, maxTokenCost, validUntil, validAfter
        );

        vm.expectRevert("TONPaymaster: untrusted guarantor");
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, paymasterAndData), maxCost);
    }

    function test_mode1_removedGuarantor_reverts() public {
        // Use guarantor once successfully
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp);
        uint256 maxTokenCost = paymaster.ethToToken(maxCost + (60000 * 30 gwei));

        bytes memory pd1 = _buildGuarantorPaymasterAndData(user, maxTokenCost, validUntil, validAfter);
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, pd1), maxCost);

        // Remove guarantor
        vm.prank(owner);
        paymaster.setTrustedGuarantor(guarantor, false);

        // Second attempt should fail
        bytes memory pd2 = _buildGuarantorPaymasterAndData(user, maxTokenCost, validUntil, validAfter);
        vm.expectRevert("TONPaymaster: untrusted guarantor");
        entryPoint.simulateValidation(paymaster, _buildUserOp(user, pd2), maxCost);
    }
}
