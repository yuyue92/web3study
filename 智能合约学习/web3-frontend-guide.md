# 前端调用智能合约完整流程指南

## 1. 技术栈准备

### 核心依赖安装
```bash
npm install ethers
# 或者使用 web3.js
npm install web3

# 可选：更好的用户体验
npm install @metamask/detect-provider
```

### 推荐技术栈
- **ethers.js**: 更现代，API设计更友好，TypeScript支持更好
- **web3.js**: 老牌库，社区大，文档丰富
- **MetaMask**: 最主流的钱包连接方式

## 2. 项目结构建议

```
src/
├── contracts/
│   ├── abi/
│   │   └── YourContract.json    # ABI文件
│   └── config.js               # 合约配置
├── hooks/
│   └── useContract.js          # 合约调用Hook
├── utils/
│   └── web3.js                 # Web3工具函数
└── components/
    └── WalletConnection.js     # 钱包连接组件
```

## 3. 核心代码实现

### 3.1 合约配置文件 (src/contracts/config.js)
```javascript
// 导入ABI文件
import ContractABI from './abi/YourContract.json';

export const CONTRACT_CONFIG = {
  // 主网地址
  address: '0x1234567890123456789012345678901234567890',
  abi: ContractABI,
  
  // 不同网络的合约地址
  networks: {
    1: '0x1234567890123456789012345678901234567890',     // 以太坊主网
    5: '0x0987654321098765432109876543210987654321',     // Goerli测试网
    137: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',    // Polygon
  }
};
```

### 3.2 Web3工具函数 (src/utils/web3.js)
```javascript
import { ethers } from 'ethers';

export class Web3Utils {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  // 连接钱包
  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 请求连接钱包
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 创建provider和signer
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        const address = await this.signer.getAddress();
        const network = await this.provider.getNetwork();
        
        return {
          address,
          chainId: Number(network.chainId),
          success: true
        };
      } catch (error) {
        console.error('连接钱包失败:', error);
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, error: '请安装MetaMask钱包' };
    }
  }

  // 切换网络
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error('切换网络失败:', error);
      return false;
    }
  }

  // 获取合约实例
  getContract(contractAddress, contractABI) {
    if (!this.signer) {
      throw new Error('请先连接钱包');
    }
    return new ethers.Contract(contractAddress, contractABI, this.signer);
  }

  // 监听账户变化
  onAccountsChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  // 监听网络变化
  onChainChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }
}
```

### 3.3 合约调用Hook (src/hooks/useContract.js)
```javascript
import { useState, useEffect, useCallback } from 'react';
import { Web3Utils } from '../utils/web3';
import { CONTRACT_CONFIG } from '../contracts/config';

export const useContract = () => {
  const [web3Utils] = useState(() => new Web3Utils());
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // 连接钱包
  const connectWallet = useCallback(async () => {
    setLoading(true);
    const result = await web3Utils.connectWallet();
    
    if (result.success) {
      setAccount(result.address);
      setChainId(result.chainId);
      
      // 创建合约实例
      const contractAddress = CONTRACT_CONFIG.networks[result.chainId];
      if (contractAddress) {
        const contractInstance = web3Utils.getContract(contractAddress, CONTRACT_CONFIG.abi);
        setContract(contractInstance);
      }
    }
    
    setLoading(false);
    return result;
  }, [web3Utils]);

  // 调用合约只读方法
  const callContractMethod = useCallback(async (methodName, ...args) => {
    if (!contract) {
      throw new Error('合约未初始化');
    }

    try {
      const result = await contract[methodName](...args);
      return result;
    } catch (error) {
      console.error(`调用合约方法 ${methodName} 失败:`, error);
      throw error;
    }
  }, [contract]);

  // 发送交易（写入方法）
  const sendTransaction = useCallback(async (methodName, args = [], options = {}) => {
    if (!contract) {
      throw new Error('合约未初始化');
    }

    try {
      setLoading(true);
      
      // 估算gas费用
      const estimatedGas = await contract[methodName].estimateGas(...args, options);
      
      // 发送交易
      const tx = await contract[methodName](...args, {
        ...options,
        gasLimit: estimatedGas * 120n / 100n // 增加20%的gas余量
      });
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      setLoading(false);
      return {
        success: true,
        hash: tx.hash,
        receipt
      };
    } catch (error) {
      setLoading(false);
      console.error(`发送交易 ${methodName} 失败:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [contract]);

  // 监听合约事件
  const listenToEvent = useCallback((eventName, callback) => {
    if (!contract) return;

    contract.on(eventName, callback);
    
    // 返回取消监听的函数
    return () => contract.off(eventName, callback);
  }, [contract]);

  // 初始化时检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await connectWallet();
      }
    };
    
    checkConnection();
    
    // 监听账户和网络变化
    web3Utils.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setContract(null);
      } else {
        connectWallet();
      }
    });
    
    web3Utils.onChainChanged(() => {
      window.location.reload(); // 简单处理：重新加载页面
    });
  }, [connectWallet, web3Utils]);

  return {
    account,
    chainId,
    contract,
    loading,
    connectWallet,
    callContractMethod,
    sendTransaction,
    listenToEvent,
    switchNetwork: web3Utils.switchNetwork
  };
};
```

### 3.4 钱包连接组件 (src/components/WalletConnection.js)
```javascript
import React from 'react';
import { useContract } from '../hooks/useContract';

const WalletConnection = () => {
  const { account, chainId, loading, connectWallet, switchNetwork } = useContract();

  const handleConnect = async () => {
    const result = await connectWallet();
    if (!result.success) {
      alert(`连接失败: ${result.error}`);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '连接中...' : '连接钱包'}
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {formatAddress(account)}
          </div>
          <div className="text-sm text-gray-600">
            网络ID: {chainId}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
```

### 3.5 合约交互示例组件
```javascript
import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';

const ContractInteraction = () => {
  const { 
    contract, 
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
    if (!contract) return;

    const unsubscribe = listenToEvent('Transfer', (from, to, value) => {
      console.log('转账事件:', { from, to, value: value.toString() });
      fetchBalance(); // 有转账时刷新余额
    });

    return unsubscribe;
  }, [contract]);

  // 初始加载余额
  useEffect(() => {
    if (contract) {
      fetchBalance();
    }
  }, [contract]);

  if (!contract) {
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
```

## 4. 主要流程说明

### 4.1 初始化流程
1. **安装依赖**: 安装ethers.js或web3.js
2. **配置ABI**: 将合约ABI文件放在项目中
3. **设置网络**: 配置不同网络的合约地址
4. **创建工具类**: 封装Web3相关操作

### 4.2 连接钱包流程
1. **检测钱包**: 检查是否安装MetaMask等钱包
2. **请求连接**: 调用`eth_requestAccounts`方法
3. **创建Provider**: 创建ethers.js的Provider实例
4. **获取Signer**: 获取用户的Signer用于签名交易
5. **初始化合约**: 使用ABI和地址创建合约实例

### 4.3 合约调用流程
**只读方法（view/pure）**:
1. 直接调用合约方法
2. 无需gas费用
3. 立即返回结果

**写入方法（state-changing）**:
1. 估算gas费用
2. 构建交易参数
3. 用户确认交易
4. 发送到区块链
5. 等待交易确认
6. 处理结果

## 5. 错误处理和最佳实践

### 5.1 常见错误处理
```javascript
const handleContractCall = async () => {
  try {
    const result = await sendTransaction('methodName', args);
    if (result.success) {
      // 成功处理
    } else {
      // 失败处理
    }
  } catch (error) {
    if (error.code === 4001) {
      // 用户拒绝交易
      alert('用户取消了交易');
    } else if (error.code === -32603) {
      // 合约执行失败
      alert('合约执行失败，请检查参数');
    } else {
      // 其他错误
      alert(`交易失败: ${error.message}`);
    }
  }
};
```

### 5.2 性能优化建议
- 使用React.memo包装组件避免不必要重渲染
- 缓存合约实例和常用数据
- 合理使用useCallback和useMemo
- 批量处理多个合约调用

### 5.3 安全注意事项
- 始终验证用户输入
- 使用合理的gas limit
- 处理所有可能的异常情况
- 不在前端存储私钥等敏感信息

## 6. 测试建议

- 在测试网络上充分测试
- 模拟各种错误情况
- 测试不同钱包的兼容性
- 验证事件监听功能

这个流程涵盖了从零开始到完整实现的所有步骤，你可以根据具体的合约ABI和业务需求进行相应的调整。