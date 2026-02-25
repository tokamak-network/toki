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

/// @notice Minimal Uniswap V3 pool interface for oracle reads
interface IUniswapV3Pool {
    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);

    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );
}

// ─── Inlined Uniswap V3 math (ported to Solidity 0.8.26) ────────────────────

/// @notice 512-bit math from Uniswap V3 (FullMath), ported to 0.8.x with unchecked blocks
library FullMath {
    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0;
            uint256 prod1;
            assembly {
                let mm := mulmod(a, b, not(0))
                prod0 := mul(a, b)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            if (prod1 == 0) {
                require(denominator > 0);
                assembly {
                    result := div(prod0, denominator)
                }
                return result;
            }

            require(denominator > prod1);

            uint256 remainder;
            assembly {
                remainder := mulmod(a, b, denominator)
            }
            assembly {
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            uint256 twos = (0 - denominator) & denominator;
            assembly {
                denominator := div(denominator, twos)
            }
            assembly {
                prod0 := div(prod0, twos)
            }
            assembly {
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;

            uint256 inv = (3 * denominator) ^ 2;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;
            inv *= 2 - denominator * inv;

            result = prod0 * inv;
        }
    }
}

/// @notice Tick math from Uniswap V3, ported to 0.8.x
library TickMath {
    int24 internal constant MIN_TICK = -887272;
    int24 internal constant MAX_TICK = 887272;

    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        unchecked {
            uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
            require(absTick <= uint256(uint24(MAX_TICK)), "T");

            uint256 ratio = absTick & 0x1 != 0
                ? 0xfffcb933bd6fad37aa2d162d1a594001
                : 0x100000000000000000000000000000000;
            if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
            if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
            if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
            if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
            if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
            if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
            if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
            if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
            if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
            if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
            if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
            if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
            if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
            if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
            if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
            if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
            if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
            if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
            if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;

            if (tick > 0) ratio = type(uint256).max / ratio;

            sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
        }
    }
}

/// @notice Inlined Uniswap V3 oracle helpers (ported from OracleLibrary.sol)
library OracleHelper {
    /// @notice Get TWAP tick from a Uniswap V3 pool
    function consult(address pool, uint32 secondsAgo) internal view returns (int24 arithmeticMeanTick) {
        require(secondsAgo != 0, "BP");

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(secondsAgos);

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];

        arithmeticMeanTick = int24(tickCumulativesDelta / int56(uint56(secondsAgo)));
        // Always round to negative infinity
        if (tickCumulativesDelta < 0 && (tickCumulativesDelta % int56(uint56(secondsAgo)) != 0)) {
            arithmeticMeanTick--;
        }
    }

    /// @notice Convert tick to quote amount using FullMath and TickMath
    /// @dev For WTON/WETH pool: baseToken=WETH (token0), quoteToken=WTON (token1)
    ///      We query "how much WTON for 1 ETH" → getQuoteAtTick(tick, 1e18, WETH, WTON)
    function getQuoteAtTick(
        int24 tick,
        uint128 baseAmount,
        address baseToken,
        address quoteToken
    ) internal pure returns (uint256 quoteAmount) {
        uint160 sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);

        if (sqrtRatioX96 <= type(uint128).max) {
            uint256 ratioX192 = uint256(sqrtRatioX96) * sqrtRatioX96;
            quoteAmount = baseToken < quoteToken
                ? FullMath.mulDiv(ratioX192, baseAmount, 1 << 192)
                : FullMath.mulDiv(1 << 192, baseAmount, ratioX192);
        } else {
            uint256 ratioX128 = FullMath.mulDiv(sqrtRatioX96, sqrtRatioX96, 1 << 64);
            quoteAmount = baseToken < quoteToken
                ? FullMath.mulDiv(ratioX128, baseAmount, 1 << 128)
                : FullMath.mulDiv(1 << 128, baseAmount, ratioX128);
        }
    }
}

/// @title TONPaymaster
/// @notice ERC-4337 Paymaster that accepts TON token for gas payment
/// @dev Works with EntryPoint v0.7/v0.8. Supports two pricing modes:
///   - Manual: owner sets tokenPerEth rate directly
///   - Oracle: reads TWAP from Uniswap V3 WTON/WETH pool
///
/// The paymaster flow:
///   1. In validatePaymasterUserOp: checks user has enough TON balance
///   2. EntryPoint executes user's calldata (which should include approve to this paymaster)
///   3. In postOp: transfers actual gas cost in TON from user to paymaster
contract TONPaymaster is Ownable {
    using SafeERC20 for IERC20;

    IEntryPoint public immutable entryPoint;
    IERC20 public immutable token;

    // ─── Pricing: Manual mode ────────────────────────────────────
    /// @notice TON per ETH exchange rate (18 decimals)
    /// e.g., 2500e18 means 2500 TON = 1 ETH
    uint256 public tokenPerEth;

    // ─── Pricing: Oracle mode ────────────────────────────────────
    /// @notice Whether to use Uniswap V3 TWAP oracle for pricing
    bool public useOracle;

    /// @notice Uniswap V3 WTON/WETH pool address
    address public oraclePool;

    /// @notice WETH address (token0 in the pool)
    address public weth;

    /// @notice WTON address (token1 in the pool, 27 decimals)
    address public wton;

    /// @notice TWAP observation window in seconds (default: 30 min)
    uint32 public twapPeriod;

    // ─── Common pricing config ───────────────────────────────────
    /// @notice Price markup in basis points (10000 = 100%, 15000 = 150%)
    uint256 public markupBps;

    /// @notice Estimated gas for postOp (transferFrom). Added to cost calculation.
    uint256 public postOpGasOverhead;

    event PriceUpdated(uint256 tokenPerEth);
    event MarkupUpdated(uint256 markupBps);
    event OracleConfigUpdated(address pool, address weth, address wton, uint32 twapPeriod);
    event OracleModeUpdated(bool useOracle);
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
        twapPeriod = 1800; // 30 minutes default
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

    /// @notice Configure the Uniswap V3 oracle pool
    /// @param _pool WTON/WETH Uniswap V3 pool address
    /// @param _weth WETH address (must be one of the pool tokens)
    /// @param _wton WTON address (must be one of the pool tokens)
    /// @param _twapPeriod TWAP observation window in seconds
    function setOracleConfig(
        address _pool,
        address _weth,
        address _wton,
        uint32 _twapPeriod
    ) external onlyOwner {
        require(_pool != address(0), "Invalid pool");
        require(_weth != address(0) && _wton != address(0), "Invalid tokens");
        require(_twapPeriod > 0, "Invalid TWAP period");

        oraclePool = _pool;
        weth = _weth;
        wton = _wton;
        twapPeriod = _twapPeriod;

        emit OracleConfigUpdated(_pool, _weth, _wton, _twapPeriod);
    }

    /// @notice Toggle between manual and oracle pricing
    function setUseOracle(bool _useOracle) external onlyOwner {
        if (_useOracle) {
            require(oraclePool != address(0), "Oracle not configured");
        }
        useOracle = _useOracle;
        emit OracleModeUpdated(_useOracle);
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

    /// @notice Get the current TON/ETH exchange rate
    /// @return tokenPerEthRate TON amount per 1 ETH (18 decimals)
    function getTokenPerEth() external view returns (uint256 tokenPerEthRate) {
        if (useOracle && oraclePool != address(0)) {
            return _getOracleTokenPerEth();
        }
        return tokenPerEth;
    }

    /// @notice Convert ETH amount to TON (with markup)
    function ethToToken(uint256 ethAmount) external view returns (uint256) {
        return _ethToToken(ethAmount);
    }

    function _ethToToken(uint256 ethAmount) internal view returns (uint256) {
        uint256 rate;
        if (useOracle && oraclePool != address(0)) {
            rate = _getOracleTokenPerEth();
        } else {
            rate = tokenPerEth;
        }
        return (ethAmount * rate * markupBps) / (1e18 * 10000);
    }

    /// @notice Query Uniswap V3 TWAP oracle for WTON per ETH rate
    /// @dev Returns WTON amount for 1 ETH, then converts to TON (18 decimals)
    ///      WTON has 27 decimals, TON has 18 decimals, 1:1 value ratio
    ///      So we divide WTON amount by 1e9 to get TON amount
    function _getOracleTokenPerEth() internal view returns (uint256) {
        int24 meanTick = OracleHelper.consult(oraclePool, twapPeriod);

        // Get WTON amount for 1 ETH (1e18 wei)
        // weth < wton address-wise (WETH is token0, WTON is token1)
        uint256 wtonPerEth = OracleHelper.getQuoteAtTick(
            meanTick,
            1e18, // 1 ETH in wei
            weth,
            wton
        );

        // WTON has 27 decimals, TON has 18 decimals (1:1 value)
        // wtonPerEth is in 27-decimal WTON units
        // Convert to 18-decimal TON: divide by 1e9
        // Result is in 18 decimals (same scale as tokenPerEth)
        return wtonPerEth / 1e9;
    }

    /// @notice Required to receive ETH for staking
    receive() external payable {}
}
