// src/components/TokenSwap.js
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContract } from '../contracts/useContract';

const TokenSwap = () => {
  const { account, contract: routerContract, callContractMethod, sendTransaction, loading } = useContract();
  
  // 交换状态
  const [swapData, setSwapData] = useState({
    fromToken: {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000', // ETH地址用0地址表示
      amount: '',
      balance: '0'
    },
    toToken: {
      symbol: 'USDC',
      address: '0xA0b86a33E6441D8DEce9f2Bb01e5A91Dd6b43bC4', // 示例USDC地址，需要替换
      amount: '',
      balance: '0'
    }
  });
  
  const [priceImpact, setPriceImpact] = useState('0');
  const [exchangeRate, setExchangeRate] = useState('0');
  const [isSwapLoading, setIsSwapLoading] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState('0.5'); // 0.5%滑点容忍度
  const [swapStatus, setSwapStatus] = useState(null);

  // 支持的代币列表（需要根据实际情况配置）
  const supportedTokens = [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0xA0b86a33E6441D8DEce9f2Bb01e5A91Dd6b43bC4', decimals: 6 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }
  ];

  // 获取代币余额
  const getTokenBalance = useCallback(async (tokenAddress, userAddress) => {
    try {
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // ETH余额
        const balance = await callContractMethod('getBalance', userAddress);
        return balance;
      } else {
        // ERC20代币余额
        const balance = await callContractMethod('balanceOf', userAddress, { contractAddress: tokenAddress });
        return balance;
      }
    } catch (error) {
      console.error('获取代币余额失败:', error);
      return '0';
    }
  }, [callContractMethod]);

  // 获取交换汇率
  const getSwapQuote = useCallback(async (fromToken, toToken, amount) => {
    if (!amount || amount === '0') {
      setExchangeRate('0');
      return;
    }

    try {
      const amountIn = ethers.parseUnits(amount, fromToken.decimals || 18);
      
      // 调用router合约的getAmountsOut方法获取报价
      const path = [fromToken.address, toToken.address];
      const amounts = await callContractMethod('getAmountsOut', amountIn, path);
      
      if (amounts && amounts.length > 1) {
        const amountOut = amounts[amounts.length - 1];
        const formattedAmountOut = ethers.formatUnits(amountOut, toToken.decimals || 18);
        
        setSwapData(prev => ({
          ...prev,
          toToken: { ...prev.toToken, amount: formattedAmountOut }
        }));
        
        // 计算汇率
        const rate = parseFloat(formattedAmountOut) / parseFloat(amount);
        setExchangeRate(rate.toFixed(6));
        
        // 计算价格影响（简化版）
        const impact = Math.abs((rate - 1) * 100);
        setPriceImpact(impact.toFixed(2));
      }
    } catch (error) {
      console.error('获取报价失败:', error);
      setExchangeRate('0');
    }
  }, [callContractMethod]);

  // 处理代币选择
  const handleTokenSelect = (tokenType, token) => {
    setSwapData(prev => ({
      ...prev,
      [tokenType]: {
        ...prev[tokenType],
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals
      }
    }));
  };

  // 处理数量输入
  const handleAmountChange = (tokenType, value) => {
    setSwapData(prev => ({
      ...prev,
      [tokenType]: { ...prev[tokenType], amount: value }
    }));

    if (tokenType === 'fromToken') {
      // 输入fromToken数量时，自动计算toToken数量
      const fromToken = supportedTokens.find(t => t.symbol === swapData.fromToken.symbol);
      const toToken = supportedTokens.find(t => t.symbol === swapData.toToken.symbol);
      getSwapQuote(fromToken, toToken, value);
    }
  };

  // 交换fromToken和toToken
  const handleSwapTokens = () => {
    setSwapData(prev => ({
      fromToken: {
        ...prev.toToken,
        amount: prev.fromToken.amount
      },
      toToken: {
        ...prev.fromToken,
        amount: prev.toToken.amount
      }
    }));
  };

  // 设置最大数量
  const handleMaxAmount = () => {
    const maxAmount = ethers.formatUnits(swapData.fromToken.balance, swapData.fromToken.decimals || 18);
    handleAmountChange('fromToken', maxAmount);
  };

  // 执行交换
  const handleSwap = async () => {
    if (!account || !routerContract) {
      setSwapStatus({ type: 'error', message: '请先连接钱包' });
      return;
    }

    if (!swapData.fromToken.amount || !swapData.toToken.amount) {
      setSwapStatus({ type: 'error', message: '请输入交换数量' });
      return;
    }

    try {
      setIsSwapLoading(true);
      setSwapStatus({ type: 'loading', message: '正在处理交换...' });

      const fromToken = supportedTokens.find(t => t.symbol === swapData.fromToken.symbol);
      const toToken = supportedTokens.find(t => t.symbol === swapData.toToken.symbol);
      
      const amountIn = ethers.parseUnits(swapData.fromToken.amount, fromToken.decimals);
      const amountOutMin = ethers.parseUnits(
        (parseFloat(swapData.toToken.amount) * (100 - parseFloat(slippageTolerance)) / 100).toString(),
        toToken.decimals
      );
      
      const path = [fromToken.address, toToken.address];
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30分钟后过期

      let result;
      
      if (fromToken.address === '0x0000000000000000000000000000000000000000') {
        // 从ETH交换到代币
        result = await sendTransaction('swapExactETHForTokens', 
          [amountOutMin, path, account, deadline],
          { value: amountIn }
        );
      } else if (toToken.address === '0x0000000000000000000000000000000000000000') {
        // 从代币交换到ETH
        result = await sendTransaction('swapExactTokensForETH', 
          [amountIn, amountOutMin, path, account, deadline]
        );
      } else {
        // 代币到代币交换
        result = await sendTransaction('swapExactTokensForTokens', 
          [amountIn, amountOutMin, path, account, deadline]
        );
      }

      if (result.success) {
        setSwapStatus({ 
          type: 'success', 
          message: `交换成功! 交易哈希: ${result.hash}` 
        });
        
        // 清空输入
        setSwapData(prev => ({
          ...prev,
          fromToken: { ...prev.fromToken, amount: '' },
          toToken: { ...prev.toToken, amount: '' }
        }));
        
        // 刷新余额
        setTimeout(() => {
          updateBalances();
        }, 2000);
      } else {
        setSwapStatus({ 
          type: 'error', 
          message: `交换失败: ${result.error}` 
        });
      }
    } catch (error) {
      setSwapStatus({ 
        type: 'error', 
        message: `交换失败: ${error.message}` 
      });
    } finally {
      setIsSwapLoading(false);
    }
  };

  // 更新余额
  const updateBalances = useCallback(async () => {
    if (!account) return;

    try {
      const [fromBalance, toBalance] = await Promise.all([
        getTokenBalance(swapData.fromToken.address, account),
        getTokenBalance(swapData.toToken.address, account)
      ]);

      setSwapData(prev => ({
        ...prev,
        fromToken: { ...prev.fromToken, balance: fromBalance.toString() },
        toToken: { ...prev.toToken, balance: toBalance.toString() }
      }));
    } catch (error) {
      console.error('更新余额失败:', error);
    }
  }, [account, swapData.fromToken.address, swapData.toToken.address, getTokenBalance]);

  // 渲染状态消息
  const renderStatus = (status) => {
    if (!status) return null;
    
    const bgColor = {
      loading: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white'
    }[status.type];
    
    return (
      <div className={`p-3 rounded-lg ${bgColor} mb-4 text-center`}>
        {status.message}
      </div>
    );
  };

  // 初始化余额
  useEffect(() => {
    if (account) {
      updateBalances();
    }
  }, [account, updateBalances]);

  if (!account) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-br from-purple-900 to-purple-700 p-8 rounded-xl text-white text-center">
        <div className="mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">请先连接钱包</h3>
        <p className="text-purple-200">连接钱包后即可开始交换代币</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-purple-900 to-purple-700 p-6 rounded-xl text-white">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">交换</h2>
      </div>

      {renderStatus(swapStatus)}

      {/* From Token */}
      <div className="bg-purple-800/50 rounded-lg p-4 mb-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-purple-200">从</span>
          <span className="text-sm text-purple-200">
            余额: {parseFloat(ethers.formatUnits(swapData.fromToken.balance, swapData.fromToken.decimals || 18)).toFixed(4)} {swapData.fromToken.symbol}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={swapData.fromToken.symbol}
            onChange={(e) => {
              const token = supportedTokens.find(t => t.symbol === e.target.value);
              handleTokenSelect('fromToken', token);
            }}
            className="bg-purple-700 text-white px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-purple-400"
          >
            {supportedTokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          
          <div className="flex-1 relative">
            <input
              type="number"
              value={swapData.fromToken.amount}
              onChange={(e) => handleAmountChange('fromToken', e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-right text-2xl font-semibold outline-none placeholder-purple-300"
            />
            <button
              onClick={handleMaxAmount}
              className="absolute right-0 top-8 text-xs text-purple-300 hover:text-white"
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-4">
        <button
          onClick={handleSwapTokens}
          className="bg-purple-600 hover:bg-purple-500 p-2 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Token */}
      <div className="bg-purple-800/50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-purple-200">到</span>
          <span className="text-sm text-purple-200">
            余额: {parseFloat(ethers.formatUnits(swapData.toToken.balance, swapData.toToken.decimals || 18)).toFixed(4)} {swapData.toToken.symbol}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={swapData.toToken.symbol}
            onChange={(e) => {
              const token = supportedTokens.find(t => t.symbol === e.target.value);
              handleTokenSelect('toToken', token);
            }}
            className="bg-purple-700 text-white px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-purple-400"
          >
            {supportedTokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          
          <div className="flex-1">
            <input
              type="number"
              value={swapData.toToken.amount}
              readOnly
              placeholder="0.0"
              className="w-full bg-transparent text-right text-2xl font-semibold outline-none placeholder-purple-300"
            />
          </div>
        </div>
      </div>

      {/* Exchange Info */}
      {exchangeRate !== '0' && (
        <div className="bg-purple-800/30 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-purple-200">汇率</span>
            <span>1 {swapData.fromToken.symbol} = {exchangeRate} {swapData.toToken.symbol}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-purple-200">价格影响</span>
            <span className={parseFloat(priceImpact) > 2 ? 'text-red-400' : 'text-green-400'}>
              {priceImpact}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-200">滑点容忍度</span>
            <input
              type="number"
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(e.target.value)}
              className="bg-transparent text-right w-16 outline-none"
              step="0.1"
              min="0.1"
              max="10"
            />
            <span>%</span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={isSwapLoading || !swapData.fromToken.amount || !swapData.toToken.amount}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
      >
        {isSwapLoading ? '交换中...' : '交换'}
      </button>
    </div>
  );
};

export default TokenSwap;