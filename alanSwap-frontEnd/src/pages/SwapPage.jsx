import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "./useWallet";
import SwapConfirmModal from '../components/SwapConfirmModal';
import { useAccount } from 'wagmi';

// Hooks
import { useTokenBalance, useETHBalance } from '../hooks/useTokenBalance';
import { useSwapQuote } from '../hooks/useSwapQuote';
import { useSwap } from '../hooks/useSwap';
//config && utils
import { getTokensByChainId, isNativeToken } from '../config/tokens'
import { parseError } from '../utils/web3';

export default function SwapPage() {
    const { status } = useWallet();
    // 输入金额
    const [inputAmount, setInputAmount] = useState('');
    const [slippage, setSlippage] = useState('0.5');

    const handleFromToken = (val) => {
        console.log('from代币:', val);
        const ctoken = tokenslist.find(t => t.address === val);
        console.log('🔄 找到的from代币:', ctoken);
        if (ctoken) {
            setInputToken(ctoken);
            setInputAmount('');
        }
    }
    const handleToToken = (val) => {
        console.log('to代币:', val);
        const ctoken = tokenslist.find(t => t.address === val);
        console.log('🔄 找到的to代币:', ctoken);
        if (ctoken) {
            setOutputToken(ctoken);
        }
    }

    // 处理代币交换（输入输出互换）
    const handleSwapTokens = () => {
        const temp = inputToken;
        setInputToken(outputToken);
        setOutputToken(temp);
        setInputAmount(''); // 清空输入
    };
    const { address, chain } = useAccount();
    // 获取代币列表
    const tokenslist = getTokensByChainId(chain?.id || 1);
    // 代币选择 - 使用 lazy initialization 避免在 tokenslist 更新时出现问题
    const [inputToken, setInputToken] = useState(() => tokenslist[0]); // ETH
    const [outputToken, setOutputToken] = useState(() => tokenslist[2] || tokenslist[1]); // USDT
    // 查询 ETH 和代币余额 - 必须无条件调用所有 Hooks
    const ethBalance = useETHBalance();
    const inputTokenBalance = useTokenBalance(inputToken?.address);
    const outputTokenBalance = useTokenBalance(outputToken?.address);

    // 根据代币类型选择使用哪个余额
    const {
        balance: inputBalance,
        formattedBalance: inputFormattedBalance,
        refetch: refetchInputBalance,
    } = isNativeToken(inputToken?.address) ? ethBalance : inputTokenBalance;

    const { refetch: refetchOutputBalance } = isNativeToken(outputToken?.address)
        ? ethBalance
        : outputTokenBalance;

    // 获取交换报价
    const {
        outputAmount,
        formattedOutputAmount,
        minimumOutput,
        priceImpact,
        executionPrice,
        loading: quoteLoading,
        error: quoteError,
    } = useSwapQuote(
        inputToken?.address,
        outputToken?.address,
        inputAmount,
        inputToken?.decimals,
        outputToken?.decimals,
        slippage
    );

    // 交换 Hook
    const { swap, loading: swapLoading, approving, swapping } = useSwap();

    // 当链切换时更新代币
    useEffect(() => {
        if (chain?.id) {
            const newTokens = getTokensByChainId(chain.id);
            if (newTokens.length > 0) {
                // 检查当前选中的代币是否在新链的列表中
                const inputExists = newTokens.find(t => t.address === inputToken?.address);
                const outputExists = newTokens.find(t => t.address === outputToken?.address);

                if (!inputExists) {
                    setInputToken(newTokens[0]);
                }
                if (!outputExists) {
                    setOutputToken(newTokens[2] || newTokens[1]);
                }
            }
        }
    }, [chain?.id]);

    // 确认弹窗
    const [showConfirm, setShowConfirm] = useState(false);
    // 处理交换确认
    const handleConfirm = async () => {
        if (!address) {
            console.error('请先连接钱包');
            return;
        }

        console.log('准备交换...');

        try {
            await swap({
                inputToken: inputToken.address,
                outputToken: outputToken.address,
                inputAmount,
                minimumOutput,
                inputDecimals: inputToken.decimals,
                onSuccess: ({ hash }) => {
                    console.log('交换成功！')

                    // 关闭弹窗
                    setShowConfirm(false);

                    // 清空输入
                    setInputAmount('');

                    // 刷新余额
                    refetchInputBalance();
                    refetchOutputBalance();
                },
                onError: (error) => {
                    console.error(error );
                    setShowConfirm(false);
                },
            });
        } catch (error) {
            console.error('Swap failed:', error);
        }
    };

    // 检查是否是 ETH <-> WETH 组合
    const isETHWETHPair = () => {
        const ethAddresses = ['0x0000000000000000000000000000000000000000'];
        const wethAddress = tokenslist.find(t => t.symbol === 'WETH')?.address.toLowerCase();

        const inputIsETH = ethAddresses.includes(inputToken.address.toLowerCase());
        const outputIsWETH = outputToken.address.toLowerCase() === wethAddress;
        const inputIsWETH = inputToken.address.toLowerCase() === wethAddress;
        const outputIsETH = ethAddresses.includes(outputToken.address.toLowerCase());

        return (inputIsETH && outputIsWETH) || (inputIsWETH && outputIsETH);
    };

    // 检查是否可以交换
    const canSwap =
        address &&
        inputAmount &&
        parseFloat(inputAmount) > 0 &&
        outputAmount &&
        outputAmount !== '0' &&
        parseFloat(inputFormattedBalance) >= parseFloat(inputAmount) &&
        !isETHWETHPair(); // 禁止 ETH <-> WETH 直接交换

    const priceImpactWarning = parseFloat(priceImpact) > 5;

    return (

        <div className="w-full max-w-md mx-auto">
            {/* 交换卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-scale-in">
                {/* 标题和设置 */}
                <div className="flex items-center justify-between mb-6">
                    <div data-slot="card-title" className="text-xl font-bold neon-text-enhanced">交换</div>
                    <span className="text-sm text-black rounded-lg px-1 bg-slate-700/50 hover:bg-slate-700/70 transition-all">最优路径</span>
                </div>

                {/* 从 Token */}
                <div className="relative mb-4">
                    <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">从</span>
                            <span className="text-sm text-slate-400">
                                余额: {inputFormattedBalance || '0'} {inputToken.symbol}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={inputToken.address}
                                onChange={(e) => handleFromToken(e.target.value)}
                                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {tokenslist.map(token => (
                                    <option key={token.address} value={token.address}>
                                        {token.icon} {token.symbol}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                placeholder="0.0"
                                className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 交换按钮 */}
                <div className="flex justify-center mb-4 relative">
                    <button
                        onClick={handleSwapTokens}
                        className="bg-slate-700/50 hover:bg-slate-600/50 p-3 rounded-full border border-slate-600/30 transition-all hover:scale-110"
                    >
                        <ArrowUpDown className="w-5 h-5 text-slate-300" />
                    </button>
                </div>

                {/* 到 Token */}
                <div className="relative mb-6">
                    <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">到</span>
                            <span className="text-base text-slate-400">
                                {outputToken.symbol}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={outputToken.address}
                                onChange={(e) => handleToToken(e.target.value)}
                                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {tokenslist.map(token => (
                                    <option key={token.address} value={token.address}>
                                        {token.icon} {token.symbol}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={formattedOutputAmount}
                                readOnly
                                placeholder="0.0"
                                className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 交换信息 */}
                {inputAmount && outputAmount !== '0' && !quoteError && (<div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/20">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">汇率</span>
                        <span className="text-white">
                            1 {inputToken.symbol} ≈ {parseFloat(executionPrice).toFixed(6)} {outputToken.symbol}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">滑点</span>
                        <span className="text-white">{slippage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">手续费</span>
                        <span className={priceImpactWarning ? 'text-yellow-400' : 'text-green-400'}>
                            {priceImpact}%
                        </span>
                    </div>
                </div>)}
                {/* ETH <-> WETH 提示 */}
                {isETHWETHPair() && (
                    <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-base">
                        ETH 和 WETH 是 1:1 包装关系，请使用 Wrap/Unwrap 功能
                    </div>
                )}

                {/* 错误提示 */}
                {quoteError && inputAmount && !isETHWETHPair() && (
                    <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-base">
                        {parseError({ message: quoteError })}
                    </div>
                )}
                {/* 余额不足提示 */}
                {inputAmount &&
                    parseFloat(inputAmount) > 0 &&
                    inputFormattedBalance &&
                    parseFloat(inputFormattedBalance) < parseFloat(inputAmount) && (
                        <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-base">
                            余额不足
                        </div>
                    )}
                {/* 交换按钮 */}
                <button onClick={() => setShowConfirm(true)}
                    disabled={status === 'disconnected' || !canSwap}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed">
                    {!address
                        ? '请先连接钱包'
                        : isETHWETHPair()
                            ? '不支持 ETH/WETH 直接交换'
                            : !inputAmount || parseFloat(inputAmount) === 0
                                ? '输入金额'
                                : parseFloat(inputFormattedBalance) < parseFloat(inputAmount)
                                    ? '余额不足'
                                    : quoteLoading
                                        ? '计算中...'
                                        : approving
                                            ? '授权中...'
                                            : swapping
                                                ? '交换中...'
                                                : '交换'}
                </button>
            </div>

            {/* 市场趋势卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl mt-6 animate-scale-in">
                <h3 className="text-lg font-semibold text-white mb-4">市场概览</h3>
                <div className="grid grid-cols-2 gap-4">
                    {tokenslist.slice(0, 4).map((token, index) => (
                        <div key={token.symbol} className="bg-slate-800/50 rounded-lg p-3 duration-300 card-cyber transition-all animate-float-slow" style={{ animationDelay: `${0.5 * index}s`, }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{token.icon}</span>
                                <span className="text-sm font-medium text-white">{token.symbol}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{token.name}</span>
                                <span className="text-sm font-semibold text-green-400">+2.34%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* 确认弹窗 */}
            <SwapConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirm}
                inputToken={inputToken}
                outputToken={outputToken}
                inputAmount={inputAmount}
                outputAmount={outputAmount}
                minimumOutput={minimumOutput}
                priceImpact={priceImpact}
                executionPrice={executionPrice}
                slippage={slippage}
                loading={swapLoading}
            />
        </div>
    )
}