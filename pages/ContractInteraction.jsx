import React, { useState, useEffect } from 'react';
import { useContract } from '../contracts/useContract';

const ContractInteraction = ({isConnected}) => {
  const { 
    account,
    callContractMethod, 
    sendTransaction, 
    listenToEvent,
    loading 
  } = useContract();
  
  const [balance, setBalance] = useState('0');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');

  // 读取余额（只读方法）
  const fetchBalance = async () => {
    try {
      const result = await callContractMethod('balanceOf', account);
      setBalance(result.toString());
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  // 转账（写入方法）
  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) {
      alert('请填写完整信息');
      return;
    }

    const result = await sendTransaction('transfer', [
      transferTo,
      ethers.parseEther(transferAmount)
    ]);

    if (result.success) {
      alert(`转账成功! 交易哈希: ${result.hash}`);
      setTransferAmount('');
      setTransferTo('');
      fetchBalance(); // 刷新余额
    } else {
      alert(`转账失败: ${result.error}`);
    }
  };

  // 监听转账事件
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = listenToEvent('Transfer', (from, to, value) => {
      console.log('转账事件:', { from, to, value: value.toString() });
      fetchBalance(); // 有转账时刷新余额
    });

    return unsubscribe;
  }, [isConnected]);

  // 初始加载余额
  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p>请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">合约交互</h2>
      
      {/* 余额显示 */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">当前余额:</p>
        <p className="text-2xl font-bold">{balance} ETH</p>
        <button 
          onClick={fetchBalance}
          className="mt-2 text-blue-500 hover:text-blue-600"
        >
          刷新余额
        </button>
      </div>

      {/* 转账表单 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">接收地址</label>
          <input
            type="text"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">转账金额</label>
          <input
            type="number"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={handleTransfer}
          disabled={loading || !transferTo || !transferAmount}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loading ? '处理中...' : '转账'}
        </button>
      </div>
    </div>
  );
};

export default ContractInteraction;