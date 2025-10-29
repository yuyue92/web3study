/**
 * 交换确认弹窗组件
 */

import { X, AlertTriangle, ArrowDown, ExternalLink } from 'lucide-react';
import { formatTokenAmount } from '../utils/web3';

export default function SwapConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  inputToken,
  outputToken,
  inputAmount,
  outputAmount,
  minimumOutput,
  priceImpact,
  executionPrice,
  slippage,
  loading,
}) {
  if (!isOpen) return null;

  const priceImpactValue = parseFloat(priceImpact);
  const isHighImpact = priceImpactValue > 3;
  const isVeryHighImpact = priceImpactValue > 10;

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
          <h3 className="text-xl font-bold text-white">确认交换</h3>
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
          {/* 交换详情 */}
          <div className="space-y-3">
            {/* 输入代币 */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{inputToken.icon || '💎'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">卖出</div>
                    <div className="text-lg font-semibold text-white">
                      {inputToken.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {inputAmount}
                  </div>
                  <div className="text-sm text-slate-400">
                    {inputToken.name}
                  </div>
                </div>
              </div>
            </div>

            {/* 箭头 */}
            <div className="flex justify-center">
              <div className="p-2 bg-slate-800 rounded-full">
                <ArrowDown className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* 输出代币 */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{outputToken.icon || '💰'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">买入</div>
                    <div className="text-lg font-semibold text-white">
                      {outputToken.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatTokenAmount(outputAmount, outputToken.decimals, 6)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {outputToken.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 价格影响警告 */}
          {isHighImpact && (
            <div
              className={`p-4 rounded-xl border ${
                isVeryHighImpact
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 flex-shrink-0 ${
                    isVeryHighImpact ? 'text-red-400' : 'text-yellow-400'
                  }`}
                />
                <div className="flex-1">
                  <div
                    className={`font-semibold mb-1 ${
                      isVeryHighImpact ? 'text-red-400' : 'text-yellow-400'
                    }`}
                  >
                    {isVeryHighImpact ? '价格影响非常大' : '价格影响较大'}
                  </div>
                  <div className="text-sm text-slate-300">
                    此交易将导致 {priceImpact}% 的价格影响。
                    {isVeryHighImpact
                      ? '建议分批交换或选择流动性更好的池子。'
                      : '请确认您接受此影响。'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 交易详情 */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">执行价格</span>
              <span className="text-white font-medium">
                1 {inputToken.symbol} ={' '}
                {parseFloat(executionPrice).toFixed(6)} {outputToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">最小输出</span>
              <span className="text-white font-medium">
                {formatTokenAmount(minimumOutput, outputToken.decimals, 6)}{' '}
                {outputToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">价格影响</span>
              <span
                className={`font-medium ${
                  isVeryHighImpact
                    ? 'text-red-400'
                    : isHighImpact
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}
              >
                {priceImpact}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">滑点容忍</span>
              <span className="text-white font-medium">{slippage}%</span>
            </div>
          </div>

          {/* 提示 */}
          <div className="text-xs text-slate-400 text-center">
            输出预估。如果价格变化超过 {slippage}%，交易将回滚。
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
              '确认交换'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
