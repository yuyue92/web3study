/**
 * 添加流动性确认弹窗组件
 */

import { X, AlertCircle, Plus } from 'lucide-react';
import { formatTokenAmount, parseTokenAmount } from '../utils/web3';
import BigNumber from 'bignumber.js';

export default function AddLiquidityModal({
  isOpen,
  onClose,
  onConfirm,
  tokenA,
  tokenB,
  amountA,
  amountB,
  sharePercent,
  lpTokens,
  slippage,
  loading,
  isNewPool = false,
}) {
  if (!isOpen) return null;

  // 对于新池子，计算预期的 LP Token
  // Uniswap V2 公式: liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
  const calculateNewPoolLP = () => {
    if (!isNewPool || !amountA || !amountB) return lpTokens;

    try {
      const MINIMUM_LIQUIDITY = '1000'; // Uniswap V2 固定值

      const amountAWei = parseTokenAmount(amountA, tokenA.decimals);
      const amountBWei = parseTokenAmount(amountB, tokenB.decimals);

      const amountABN = new BigNumber(amountAWei);
      const amountBBN = new BigNumber(amountBWei);

      // liquidity = sqrt(amountA * amountB)
      const liquidity = amountABN.multipliedBy(amountBBN).sqrt();

      // 减去 MINIMUM_LIQUIDITY（首次添加时会永久锁定）
      const lpAmount = liquidity.minus(MINIMUM_LIQUIDITY).toFixed(0);

      return lpAmount;
    } catch (error) {
      console.error('计算新池子 LP Token 失败:', error);
      return lpTokens;
    }
  };

  const displayLP = isNewPool ? calculateNewPoolLP() : lpTokens;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">
            {isNewPool ? '创建新流动性池' : '添加流动性'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 新池子提示 */}
          {isNewPool && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-400 mb-1">
                    首次添加流动性
                  </div>
                  <div className="text-sm text-slate-300">
                    您将创建一个新的流动性池。作为第一个流动性提供者，您设定的价格将成为初始价格。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 添加详情 */}
          <div className="space-y-3">
            {/* 代币 A */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{tokenA.icon || '💎'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">存入</div>
                    <div className="text-lg font-semibold text-white">
                      {tokenA.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {amountA}
                  </div>
                  <div className="text-sm text-slate-400">{tokenA.name}</div>
                </div>
              </div>
            </div>

            {/* 加号 */}
            <div className="flex justify-center">
              <div className="p-2 bg-slate-800 rounded-full">
                <Plus className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* 代币 B */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{tokenB.icon || '💰'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">存入</div>
                    <div className="text-lg font-semibold text-white">
                      {tokenB.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {amountB}
                  </div>
                  <div className="text-sm text-slate-400">{tokenB.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 流动性详情 */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">将获得 LP Token</span>
              <span className="text-white font-medium">
                {formatTokenAmount(displayLP || '0', 18, 6)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">池子份额</span>
              <span className="text-white font-medium">
                {parseFloat(sharePercent || 0).toFixed(4)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">滑点容忍</span>
              <span className="text-white font-medium">{slippage}%</span>
            </div>

            {!isNewPool && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">价格</span>
                <div className="text-right">
                  <div className="text-white font-medium">
                    1 {tokenA.symbol} ={' '}
                    {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)}{' '}
                    {tokenB.symbol}
                  </div>
                  <div className="text-white font-medium">
                    1 {tokenB.symbol} ={' '}
                    {(parseFloat(amountA) / parseFloat(amountB)).toFixed(6)}{' '}
                    {tokenA.symbol}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 提示 */}
          <div className="text-xs text-slate-400 text-center">
            {isNewPool
              ? '您将设定初始价格。请确保代币比例合理。'
              : `添加流动性后，您将获得 LP Token。移除流动性时可兑换回代币。`}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>确认中...</span>
              </>
            ) : (
              '确认添加'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
