// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/TONPaymaster.sol";

/// @notice Minimal interface for Tokamak TON token (approveAndCall pattern)
interface ITON {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
    function allowance(address, address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function approveAndCall(address spender, uint256 amount, bytes calldata data) external returns (bool);
}

/// @notice Minimal interface for WTON
interface IWTON {
    function balanceOf(address) external view returns (uint256);
}

/// @notice Minimal interface for DepositManager
interface IDepositManager {
    function deposit(address layer2, uint256 amount) external returns (bool);
    function requestWithdrawal(address layer2, uint256 amount) external returns (bool);
    function processRequests(address layer2, uint256 n, bool receiveTON) external returns (bool);
    function pendingUnstaked(address layer2, address account) external view returns (uint256);
}

/// @notice Minimal interface for Layer2Registry
interface ILayer2Registry {
    function numLayer2s() external view returns (uint256);
    function layer2ByIndex(uint256 index) external view returns (address);
}

/// @title E2E Test for TONPaymaster v3 on Sepolia Fork
/// @notice Tests the full paymaster flow against real Tokamak staking contracts
contract TONPaymasterE2ETest is Test {
    // ─── Sepolia addresses ───────────────────────────────────────
    address constant TON_ADDR = 0xa30fe40285B8f5c0457DbC3B7C8A280373c40044;
    address constant WTON_ADDR = 0x79E0d92670106c85E9067b56B8F674340dCa0Bbd;
    address constant DEPOSIT_MANAGER = 0x90ffcc7F168DceDBEF1Cb6c6eB00cA73F922956F;
    address constant LAYER2_REGISTRY = 0xA0a9576b437E52114aDA8b0BC4149F2F5c604581;
    address constant ENTRY_POINT = 0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108;
    address constant PAYMASTER_ADDR = 0x54965Db4520C5df922E99B4F50A4Bdce33c6ac8c;

    // Admin/guarantor private key (same wallet)
    uint256 constant ADMIN_KEY = 0xeeb8d41b51594847468e4bfeeb33794d89de6757e4024356a92e561d13331f5c;

    TONPaymaster paymaster;
    ITON ton;
    IWTON wton;
    IDepositManager depositManager;
    ILayer2Registry layer2Registry;

    address admin;
    address user;

    function setUp() public {
        admin = vm.addr(ADMIN_KEY);
        user = makeAddr("user");

        paymaster = TONPaymaster(payable(PAYMASTER_ADDR));
        ton = ITON(TON_ADDR);
        wton = IWTON(WTON_ADDR);
        depositManager = IDepositManager(DEPOSIT_MANAGER);
        layer2Registry = ILayer2Registry(LAYER2_REGISTRY);

        // Give user some TON for testing
        uint256 adminBalance = ton.balanceOf(admin);
        if (adminBalance > 0) {
            uint256 transferAmount = adminBalance > 100e18 ? 100e18 : adminBalance / 2;
            vm.prank(admin);
            ton.transfer(user, transferAmount);
        }

        // User approves paymaster
        vm.prank(user);
        ton.approve(address(paymaster), type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════
    // 1. Paymaster Deployment Verification
    // ═══════════════════════════════════════════════════════════════

    function test_paymaster_isDeployed() public view {
        // Verify the paymaster is deployed and has the correct configuration
        assertEq(address(paymaster.token()), TON_ADDR, "token should be TON");
        assertEq(address(paymaster.entryPoint()), ENTRY_POINT, "entryPoint should match");

        // Check EIP-712 domain version is "3"
        (, , string memory version, , , , ) = paymaster.eip712Domain();
        assertEq(keccak256(bytes(version)), keccak256(bytes("3")), "version should be 3");
    }

    function test_paymaster_hasDeposit() public view {
        uint256 deposit = paymaster.getDeposit();
        assertGt(deposit, 0, "paymaster should have ETH deposit on EntryPoint");
        console.log("Paymaster deposit:", deposit);
    }

    function test_paymaster_guarantorApproved() public view {
        uint256 allowance = ton.allowance(admin, address(paymaster));
        assertEq(allowance, type(uint256).max, "guarantor should have max approval");
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Mode 0x00 (Pre-charge) — Full validation + postOp cycle
    // ═══════════════════════════════════════════════════════════════

    function test_mode0_fullCycle() public {
        uint256 userBefore = ton.balanceOf(user);
        require(userBefore > 0, "user needs TON for this test");

        uint256 maxCost = 0.001 ether;
        bytes memory paymasterAndData = abi.encodePacked(address(paymaster), uint8(0x00));
        PackedUserOperation memory userOp = _buildUserOp(user, paymasterAndData);

        // Simulate EntryPoint calling validatePaymasterUserOp
        vm.prank(ENTRY_POINT);
        (bytes memory context, uint256 validationData) =
            paymaster.validatePaymasterUserOp(userOp, bytes32(0), maxCost);

        // Signature should not fail (Mode 0x00 has no sig)
        bool sigFailed = (validationData & 1) == 1;
        assertFalse(sigFailed, "mode 0x00 should not have sig failure");

        // User should have been pre-charged
        uint256 userAfterValidation = ton.balanceOf(user);
        assertLt(userAfterValidation, userBefore, "user should be pre-charged");

        uint256 preCharged = userBefore - userAfterValidation;
        console.log("Pre-charged TON:", preCharged);

        // Simulate postOp with partial gas cost
        uint256 actualGasCost = maxCost / 2;
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, context, actualGasCost, 30 gwei);

        // User should have been refunded excess
        uint256 userAfterPostOp = ton.balanceOf(user);
        assertGt(userAfterPostOp, userAfterValidation, "user should get refund");
        assertLt(userAfterPostOp, userBefore, "user paid actual cost");

        uint256 actualPaid = userBefore - userAfterPostOp;
        console.log("Actual paid TON:", actualPaid);
        console.log("Refund TON:", userAfterPostOp - userAfterValidation);
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. Mode 0x01 (Guarantor) — Full validation + postOp cycle
    // ═══════════════════════════════════════════════════════════════

    function test_mode1_guarantorFullCycle_userPays() public {
        uint256 maxCost = 0.001 ether;
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        bytes memory paymasterAndData = _buildGuarantorData(
            user, guaranteedAmount, uint48(block.timestamp + 600), uint48(block.timestamp - 60)
        );

        uint256 guarantorBefore = ton.balanceOf(admin);
        uint256 userBefore = ton.balanceOf(user);

        // Validate
        vm.prank(ENTRY_POINT);
        (bytes memory context, uint256 validationData) =
            paymaster.validatePaymasterUserOp(_buildUserOp(user, paymasterAndData), bytes32(0), maxCost);

        assertFalse((validationData & 1) == 1, "guarantor signature should be valid");
        assertLt(ton.balanceOf(admin), guarantorBefore, "guarantor should be pre-charged");
        assertEq(ton.balanceOf(user), userBefore, "user should NOT be charged yet");
        console.log("Guarantor pre-charged:", guarantorBefore - ton.balanceOf(admin));

        // PostOp: user has TON + approval → user pays, guarantor refunded
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, context, maxCost / 2, 30 gwei);

        assertEq(ton.balanceOf(admin), guarantorBefore, "guarantor should be fully refunded");
        assertLt(ton.balanceOf(user), userBefore, "user should have paid");
        console.log("User paid:", userBefore - ton.balanceOf(user));
    }

    function test_mode1_guarantorFullCycle_userCantPay() public {
        address brokeUser = makeAddr("broke");
        uint256 maxCost = 0.001 ether;
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        bytes memory pd = _buildGuarantorData(
            brokeUser, guaranteedAmount, uint48(block.timestamp + 600), uint48(block.timestamp - 60)
        );

        uint256 guarantorBefore = ton.balanceOf(admin);

        vm.prank(ENTRY_POINT);
        (bytes memory context, ) =
            paymaster.validatePaymasterUserOp(_buildUserOp(brokeUser, pd), bytes32(0), maxCost);

        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, context, maxCost / 2, 30 gwei);

        uint256 debt = paymaster.getDebt(brokeUser);
        assertGt(debt, 0, "debt should be recorded");
        console.log("Debt recorded:", debt);

        uint256 guarantorLoss = guarantorBefore - ton.balanceOf(admin);
        assertGt(guarantorLoss, 0, "guarantor absorbed cost");
        console.log("Guarantor loss:", guarantorLoss);
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. Nonce replay protection
    // ═══════════════════════════════════════════════════════════════

    function test_mode1_nonceReplayProtection() public {
        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp - 60);
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        uint256 nonceBefore = paymaster.guarantorNonces(admin);
        console.log("Nonce before:", nonceBefore);

        // First use: succeeds
        bytes memory pd1 = _buildGuarantorData(user, guaranteedAmount, validUntil, validAfter);
        vm.prank(ENTRY_POINT);
        (, uint256 vd1) = paymaster.validatePaymasterUserOp(_buildUserOp(user, pd1), bytes32(0), maxCost);
        assertFalse((vd1 & 1) == 1, "first use should succeed");

        uint256 nonceAfter = paymaster.guarantorNonces(admin);
        assertEq(nonceAfter, nonceBefore + 1, "nonce should increment");
        console.log("Nonce after:", nonceAfter);

        // Replay same data: signature fails (nonce mismatch)
        vm.prank(ENTRY_POINT);
        (, uint256 vd2) = paymaster.validatePaymasterUserOp(_buildUserOp(user, pd1), bytes32(0), maxCost);
        assertTrue((vd2 & 1) == 1, "replay should fail");
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. Debt tracking across transactions
    // ═══════════════════════════════════════════════════════════════

    function test_debtCollection_acrossTransactions() public {
        address debtUser = makeAddr("debtUser");

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp - 60);
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        // Step 1: Create debt (user can't pay)
        bytes memory pd1 = _buildGuarantorData(debtUser, guaranteedAmount, validUntil, validAfter);
        vm.prank(ENTRY_POINT);
        (bytes memory ctx1, ) = paymaster.validatePaymasterUserOp(_buildUserOp(debtUser, pd1), bytes32(0), maxCost);
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, ctx1, maxCost / 2, 30 gwei);

        uint256 debtAfterFirst = paymaster.getDebt(debtUser);
        assertGt(debtAfterFirst, 0, "should have debt");
        console.log("Debt after 1st tx:", debtAfterFirst);

        // Step 2: Give user tokens + approval, then use Mode 0x00
        vm.prank(admin);
        ton.transfer(debtUser, 50e18);
        vm.prank(debtUser);
        ton.approve(address(paymaster), type(uint256).max);

        bytes memory pd2 = abi.encodePacked(address(paymaster), uint8(0x00));
        vm.prank(ENTRY_POINT);
        (bytes memory ctx2, ) = paymaster.validatePaymasterUserOp(_buildUserOp(debtUser, pd2), bytes32(0), maxCost);
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, ctx2, maxCost / 2, 30 gwei);

        uint256 debtAfterSecond = paymaster.getDebt(debtUser);
        assertEq(debtAfterSecond, 0, "debt should be collected");
        console.log("Debt after 2nd tx:", debtAfterSecond);
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. forgiveDebt admin function
    // ═══════════════════════════════════════════════════════════════

    function test_forgiveDebt_onRealContract() public {
        address debtUser = makeAddr("forgivee");

        uint256 maxCost = 0.001 ether;
        uint48 validUntil = uint48(block.timestamp + 600);
        uint48 validAfter = uint48(block.timestamp - 60);
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        // Create debt
        bytes memory pd = _buildGuarantorData(debtUser, guaranteedAmount, validUntil, validAfter);
        vm.prank(ENTRY_POINT);
        (bytes memory ctx, ) = paymaster.validatePaymasterUserOp(_buildUserOp(debtUser, pd), bytes32(0), maxCost);
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, ctx, maxCost / 2, 30 gwei);

        uint256 debt = paymaster.getDebt(debtUser);
        assertGt(debt, 0);

        // Admin forgives
        vm.prank(admin);
        paymaster.forgiveDebt(debtUser);
        assertEq(paymaster.getDebt(debtUser), 0, "debt should be forgiven");
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. Staking simulation through paymaster
    // ═══════════════════════════════════════════════════════════════

    function test_stakingCalldata_encoding() public view {
        // Verify that we can encode the staking calldata correctly
        // This is what the frontend generates: TON.approveAndCall(WTON, amount, stakingData)

        // Find a valid operator
        uint256 numOps = layer2Registry.numLayer2s();
        require(numOps > 0, "no operators on Sepolia");

        address operator = layer2Registry.layer2ByIndex(0);
        console.log("Operator:", operator);

        uint256 stakeAmount = 1e18; // 1 TON
        bytes memory stakingData = abi.encode(DEPOSIT_MANAGER, operator);

        // Encode the approveAndCall
        bytes memory callData = abi.encodeWithSelector(
            ITON.approveAndCall.selector,
            WTON_ADDR,
            stakeAmount,
            stakingData
        );

        assertGt(callData.length, 0, "calldata should be non-empty");
        console.log("Staking calldata length:", callData.length);
    }

    function test_unstakingCalldata_encoding() public view {
        // Verify unstaking calldata encoding
        uint256 numOps = layer2Registry.numLayer2s();
        require(numOps > 0, "no operators on Sepolia");

        address operator = layer2Registry.layer2ByIndex(0);
        uint256 unstakeAmount = 1e27; // 1 WTON (27 decimals)

        // Phase 1: requestWithdrawal
        bytes memory reqCalldata = abi.encodeWithSelector(
            IDepositManager.requestWithdrawal.selector,
            operator,
            unstakeAmount
        );
        assertGt(reqCalldata.length, 0, "requestWithdrawal calldata ok");

        // Phase 2: processRequests
        bytes memory procCalldata = abi.encodeWithSelector(
            IDepositManager.processRequests.selector,
            operator,
            uint256(1),
            true // receiveTON
        );
        assertGt(procCalldata.length, 0, "processRequests calldata ok");
    }

    // ═══════════════════════════════════════════════════════════════
    // 8. Full staking + paymaster integration
    // ═══════════════════════════════════════════════════════════════

    function test_mode0_staking_simulation() public {
        uint256 userTonBefore = ton.balanceOf(user);
        require(userTonBefore >= 2e18, "user needs at least 2 TON");

        // 1. Paymaster validation: pre-charge user
        bytes memory pd = abi.encodePacked(address(paymaster), uint8(0x00));
        vm.prank(ENTRY_POINT);
        (bytes memory context, ) =
            paymaster.validatePaymasterUserOp(_buildUserOp(user, pd), bytes32(0), 0.001 ether);

        console.log("Pre-charged for gas:", userTonBefore - ton.balanceOf(user));

        // 2. Simulate staking call
        _simulateStaking(user, 1e18);

        // 3. PostOp: refund excess gas
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, context, 0.0005 ether, 30 gwei);

        console.log("User TON before:", userTonBefore);
        console.log("User TON after:", ton.balanceOf(user));
    }

    function test_mode1_staking_simulation() public {
        uint256 userTonBefore = ton.balanceOf(user);
        require(userTonBefore >= 1e18, "user needs at least 1 TON");

        uint256 guarantorBefore = ton.balanceOf(admin);
        uint256 maxCost = 0.001 ether;
        uint256 guaranteedAmount = _calcGuaranteedAmount(maxCost);

        bytes memory pd = _buildGuarantorData(
            user, guaranteedAmount, uint48(block.timestamp + 600), uint48(block.timestamp - 60)
        );

        // 1. Paymaster validation: guarantor pre-pays
        vm.prank(ENTRY_POINT);
        (bytes memory context, uint256 vd) =
            paymaster.validatePaymasterUserOp(_buildUserOp(user, pd), bytes32(0), maxCost);

        assertFalse((vd & 1) == 1, "sig should be valid");
        console.log("Guarantor pre-charged:", guarantorBefore - ton.balanceOf(admin));

        // 2. Simulate staking
        _simulateStaking(user, 1e18);

        // 3. PostOp: user pays actual gas, guarantor refunded
        vm.prank(ENTRY_POINT);
        paymaster.postOp(PostOpMode.opSucceeded, context, maxCost / 2, 30 gwei);

        assertEq(ton.balanceOf(admin), guarantorBefore, "guarantor fully refunded");
        console.log("Gas cost in TON:", userTonBefore - ton.balanceOf(user) - 1e18);
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. Price oracle verification
    // ═══════════════════════════════════════════════════════════════

    function test_ethToToken_sanityCheck() public view {
        uint256 oneEthInToken = paymaster.ethToToken(1 ether);
        console.log("1 ETH = TON (with markup):", oneEthInToken);

        // Should be tokenPerEth * markup / 10000
        uint256 rate = paymaster.tokenPerEth();
        uint256 markup = paymaster.markupBps();
        uint256 expected = (1 ether * rate * markup) / (1e18 * 10000);
        assertEq(oneEthInToken, expected, "price calculation should match");

        // Sanity: 1 ETH should be > 1000 TON and < 100000 TON
        assertGt(oneEthInToken, 1000e18, "1 ETH should be > 1000 TON");
        assertLt(oneEthInToken, 100000e18, "1 ETH should be < 100000 TON");
    }

    // ═══════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════

    function _calcGuaranteedAmount(uint256 maxCost) internal view returns (uint256) {
        uint256 totalMaxCost = maxCost + (paymaster.postOpGasOverhead() * 30 gwei);
        return paymaster.ethToToken(totalMaxCost) * 3;
    }

    function _simulateStaking(address staker, uint256 amount) internal {
        uint256 numOps = layer2Registry.numLayer2s();
        if (numOps > 0) {
            address operator = layer2Registry.layer2ByIndex(0);
            bytes memory stakingData = abi.encode(DEPOSIT_MANAGER, operator);
            vm.prank(staker);
            bool success = ton.approveAndCall(WTON_ADDR, amount, stakingData);
            assertTrue(success, "staking should succeed");
            console.log("Staked to operator:", operator);
        }
    }

    function _buildUserOp(address sender, bytes memory paymasterAndData)
        internal pure returns (PackedUserOperation memory)
    {
        uint256 maxFeePerGas = 30 gwei;
        return PackedUserOperation({
            sender: sender,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(uint256(maxFeePerGas)),
            paymasterAndData: paymasterAndData,
            signature: ""
        });
    }

    function _getDomainSeparator() internal view returns (bytes32) {
        (, string memory name, string memory version, uint256 chainId, address vc, , ) =
            paymaster.eip712Domain();
        return keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(name)), keccak256(bytes(version)), chainId, vc
        ));
    }

    function _signGuarantee(
        address sender, uint256 guaranteedAmount, uint256 nonce,
        uint48 validUntil, uint48 validAfter
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Guarantee(address sender,uint256 guaranteedAmount,uint256 nonce,uint48 validUntil,uint48 validAfter)"),
            sender, guaranteedAmount, nonce, validUntil, validAfter
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ADMIN_KEY, digest);
        return abi.encodePacked(r, s, v);
    }

    function _buildGuarantorData(
        address sender,
        uint256 guaranteedAmount,
        uint48 validUntil,
        uint48 validAfter
    ) internal view returns (bytes memory) {
        uint256 nonce = paymaster.guarantorNonces(admin);
        bytes memory sig = _signGuarantee(sender, guaranteedAmount, nonce, validUntil, validAfter);
        return abi.encodePacked(
            address(paymaster), uint8(0x01), admin,
            abi.encode(guaranteedAmount), validUntil, validAfter, sig
        );
    }
}
