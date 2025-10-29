/**
 * 移除流动性确认弹窗组件
 */

import { X, AlertTriangle, ArrowDown } from 'lucide-react';
import { formatTokenAmount } from '../utils/web3';

export default function RemoveLiquidityModal({
  isOpen,
  onClose,
  onConfirm,
  tokenA,
  tokenB,
  lpAmount,
  amountA,
  amountB,
  sharePercent,
  slippage,
  loading,
}) {
  if (!isOpen) return null;

  const isHighRemoval = parseFloat(sharePercent) > 50;

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
          <h3 className="text-xl font-bold text-white">移除流动性</h3>
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
          {/* 大额移除警告 */}
          {isHighRemoval && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                <div className="flex-1">
                  <div className="font-semibold text-yellow-400 mb-1">
                    移除大量流动性
                  </div>
                  <div className="text-sm text-slate-300">
                    您将移除超过 50% 的流动性份额，这可能会影响池子价格。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LP Token 销毁 */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <div>
                  <div className="text-sm text-slate-400">销毁 LP Token</div>
                  <div className="text-lg font-semibold text-white">
                    {tokenA.symbol}-{tokenB.symbol} LP
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {lpAmount}
                </div>
                <div className="text-sm text-slate-400">
                  占比 {parseFloat(sharePercent).toFixed(4)}%
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

          {/* 接收详情 */}
          <div className="space-y-3">
            {/* 代币 A */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{tokenA.icon || '💎'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">接收</div>
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

            {/* 代币 B */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">{tokenB.icon || '💰'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">接收</div>
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

          {/* 交易详情 */}
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">当前价格</span>
              <div className="text-right">
                <div className="text-white font-medium">
                  1 {tokenA.symbol} ={' '}
                  {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)}{' '}
                  {tokenB.symbol}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">滑点容忍</span>
              <span className="text-white font-medium">{slippage}%</span>
            </div>
          </div>

          {/* 提示 */}
          <div className="text-xs text-slate-400 text-center">
            移除流动性后，您将收到相应数量的代币，LP Token 将被销毁。如果价格变化超过滑点容忍度，交易将回滚。
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>确认中...</span>
              </>
            ) : (
              '确认移除'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
