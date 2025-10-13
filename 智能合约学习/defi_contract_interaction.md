# CryptoSwap前端与智能合约交互详细流程

## 1. 钱包连接与初始化

### 1.1 连接钱包
```javascript
// 检测并连接MetaMask钱包
const connectWallet = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      // 请求连接账户
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      // 获取网络信息
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      
      // 检查是否为支持的网络（如以太坊主网、BSC等）
      if (chainId !== '0x1') { // 0x1 = 以太坊主网
        await switchNetwork();
      }
      
      return accounts[0];
    }
  } catch (error) {
    console.error('钱包连接失败:', error);
  }
};
```

### 1.2 初始化Web3实例
```javascript
import { ethers } from 'ethers';

// 创建provider和signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// 合约地址配置
const CONTRACT_ADDRESSES = {
  FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};
```

## 2. 智能合约实例化

### 2.1 工厂合约(Factory Contract)
```javascript
// Uniswap V2 Factory ABI（核心方法）
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)'
];

// 实例化工厂合约
const factoryContract = new ethers.Contract(
  CONTRACT_ADDRESSES.FACTORY,
  FACTORY_ABI,
  signer
);
```

### 2.2 路由合约(Router Contract)
```javascript
// Uniswap V2 Router ABI（主要交互方法）
const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
];

const routerContract = new ethers.Contract(
  CONTRACT_ADDRESSES.ROUTER,
  ROUTER_ABI,
  signer
);
```

### 2.3 交易对合约(Pair Contract)
```javascript
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint)',
  'function balanceOf(address owner) external view returns (uint)'
];
```

## 3. 代币交换(Swap)流程

### 3.1 获取交换价格
```javascript
const getSwapQuote = async (tokenIn, tokenOut, amountIn) => {
  try {
    // 构建交换路径
    const path = [tokenIn, tokenOut];
    
    // 如果不是直接交易对，通过WETH中转
    const pairAddress = await factoryContract.getPair(tokenIn, tokenOut);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      path = [tokenIn, CONTRACT_ADDRESSES.WETH, tokenOut];
    }
    
    // 获取输出金额
    const amounts = await routerContract.getAmountsOut(
      ethers.utils.parseUnits(amountIn, 18),
      path
    );
    
    return {
      amountOut: ethers.utils.formatUnits(amounts[amounts.length - 1], 18),
      path: path,
      priceImpact: calculatePriceImpact(amounts)
    };
  } catch (error) {
    console.error('获取报价失败:', error);
  }
};
```

### 3.2 执行代币交换
```javascript
const executeSwap = async (tokenIn, tokenOut, amountIn, amountOutMin, userAddress) => {
  try {
    // 1. 首先检查并授权代币
    await approveToken(tokenIn, CONTRACT_ADDRESSES.ROUTER, amountIn);
    
    // 2. 构建交换路径
    const path = [tokenIn, tokenOut];
    
    // 3. 设置交易截止时间（当前时间 + 20分钟）
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // 4. 执行交换
    const tx = await routerContract.swapExactTokensForTokens(
      ethers.utils.parseUnits(amountIn, 18),
      ethers.utils.parseUnits(amountOutMin, 18),
      path,
      userAddress,
      deadline,
      {
        gasLimit: 300000,
        gasPrice: ethers.utils.parseUnits('20', 'gwei')
      }
    );
    
    // 5. 等待交易确认
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('交换失败:', error);
    throw error;
  }
};
```

## 4. 流动性提供(Liquidity)流程

### 4.1 添加流动性
```javascript
const addLiquidity = async (tokenA, tokenB, amountA, amountB, userAddress) => {
  try {
    // 1. 授权两个代币
    await approveToken(tokenA, CONTRACT_ADDRESSES.ROUTER, amountA);
    await approveToken(tokenB, CONTRACT_ADDRESSES.ROUTER, amountB);
    
    // 2. 计算最小金额（设置5%滑点容忍度）
    const amountAMin = ethers.utils.parseUnits((parseFloat(amountA) * 0.95).toString(), 18);
    const amountBMin = ethers.utils.parseUnits((parseFloat(amountB) * 0.95).toString(), 18);
    
    // 3. 设置截止时间
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // 4. 添加流动性
    const tx = await routerContract.addLiquidity(
      tokenA,
      tokenB,
      ethers.utils.parseUnits(amountA, 18),
      ethers.utils.parseUnits(amountB, 18),
      amountAMin,
      amountBMin,
      userAddress,
      deadline,
      {
        gasLimit: 350000,
        gasPrice: ethers.utils.parseUnits('20', 'gwei')
      }
    );
    
    return await tx.wait();
  } catch (error) {
    console.error('添加流动性失败:', error);
    throw error;
  }
};
```

### 4.2 移除流动性
```javascript
const removeLiquidity = async (tokenA, tokenB, liquidityAmount, userAddress) => {
  try {
    // 1. 获取LP代币合约地址
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    
    // 2. 授权LP代币给路由合约
    await approveLPToken(pairAddress, CONTRACT_ADDRESSES.ROUTER, liquidityAmount);
    
    // 3. 获取当前储备量计算最小输出
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, signer);
    const reserves = await pairContract.getReserves();
    const totalSupply = await pairContract.totalSupply();
    
    // 计算预期输出（设置5%滑点）
    const expectedA = reserves[0].mul(liquidityAmount).div(totalSupply);
    const expectedB = reserves[1].mul(liquidityAmount).div(totalSupply);
    const amountAMin = expectedA.mul(95).div(100);
    const amountBMin = expectedB.mul(95).div(100);
    
    // 4. 移除流动性
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const tx = await routerContract.removeLiquidity(
      tokenA,
      tokenB,
      liquidityAmount,
      amountAMin,
      amountBMin,
      userAddress,
      deadline
    );
    
    return await tx.wait();
  } catch (error) {
    console.error('移除流动性失败:', error);
    throw error;
  }
};
```

## 5. 代币授权管理

### 5.1 检查授权额度
```javascript
const checkAllowance = async (tokenAddress, ownerAddress, spenderAddress) => {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function allowance(address owner, address spender) external view returns (uint256)'],
    provider
  );
  
  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  return allowance;
};
```

### 5.2 授权代币
```javascript
const approveToken = async (tokenAddress, spenderAddress, amount) => {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)'
      ],
      signer
    );
    
    const userAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(userAddress, spenderAddress);
    const requiredAmount = ethers.utils.parseUnits(amount, 18);
    
    // 如果当前授权额度不足，则进行授权
    if (currentAllowance.lt(requiredAmount)) {
      const tx = await tokenContract.approve(
        spenderAddress,
        ethers.constants.MaxUint256, // 授权最大值，避免重复授权
        {
          gasLimit: 100000,
          gasPrice: ethers.utils.parseUnits('20', 'gwei')
        }
      );
      
      await tx.wait();
    }
  } catch (error) {
    console.error('代币授权失败:', error);
    throw error;
  }
};
```

## 6. 实时数据获取

### 6.1 获取代币余额
```javascript
const getTokenBalance = async (tokenAddress, userAddress) => {
  try {
    if (tokenAddress === 'ETH') {
      // 获取ETH余额
      const balance = await provider.getBalance(userAddress);
      return ethers.utils.formatEther(balance);
    } else {
      // 获取ERC20代币余额
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address owner) external view returns (uint256)'],
        provider
      );
      const balance = await tokenContract.balanceOf(userAddress);
      return ethers.utils.formatUnits(balance, 18);
    }
  } catch (error) {
    console.error('获取余额失败:', error);
    return '0';
  }
};
```

### 6.2 获取交易对信息
```javascript
const getPairInfo = async (tokenA, tokenB) => {
  try {
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return null; // 交易对不存在
    }
    
    const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserves, token0, token1] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.token1()
    ]);
    
    return {
      pairAddress,
      token0,
      token1,
      reserve0: ethers.utils.formatUnits(reserves[0], 18),
      reserve1: ethers.utils.formatUnits(reserves[1], 18),
      lastUpdate: reserves[2]
    };
  } catch (error) {
    console.error('获取交易对信息失败:', error);
    return null;
  }
};
```

## 7. 错误处理与用户体验

### 7.1 交易状态管理
```javascript
const TransactionStates = {
  IDLE: 'idle',
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  FAILED: 'failed'
};

const [txState, setTxState] = useState(TransactionStates.IDLE);
const [txHash, setTxHash] = useState('');

const handleTransaction = async (txPromise) => {
  try {
    setTxState(TransactionStates.PENDING);
    
    const tx = await txPromise;
    setTxHash(tx.hash);
    setTxState(TransactionStates.CONFIRMING);
    
    const receipt = await tx.wait();
    setTxState(TransactionStates.SUCCESS);
    
    // 显示成功消息
    showNotification('交易成功！', 'success');
    
    return receipt;
  } catch (error) {
    setTxState(TransactionStates.FAILED);
    handleTransactionError(error);
  }
};
```

### 7.2 常见错误处理
```javascript
const handleTransactionError = (error) => {
  let message = '交易失败';
  
  if (error.code === 4001) {
    message = '用户取消了交易';
  } else if (error.code === -32603) {
    message = '交易执行失败，请检查参数';
  } else if (error.message.includes('insufficient funds')) {
    message = '余额不足';
  } else if (error.message.includes('slippage')) {
    message = '滑点过大，请调整滑点设置';
  } else if (error.message.includes('deadline')) {
    message = '交易已超时';
  }
  
  showNotification(message, 'error');
  console.error('交易错误:', error);
};
```

## 8. 前端状态管理

### 8.1 使用Context管理全局状态
```javascript
// Web3Context.js
const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [provider, setProvider] = useState(null);
  const [contracts, setContracts] = useState({});
  
  const connectWallet = async () => {
    // 钱包连接逻辑
  };
  
  const value = {
    account,
    chainId,
    provider,
    contracts,
    connectWallet,
    // 其他方法
  };
  
  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
```

### 8.2 监听区块链事件
```javascript
const setupEventListeners = () => {
  // 监听账户变化
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // 用户断开连接
      setAccount('');
    } else {
      setAccount(accounts[0]);
    }
  });
  
  // 监听网络变化
  window.ethereum.on('chainChanged', (chainId) => {
    setChainId(chainId);
    window.location.reload(); // 重新加载页面
  });
  
  // 监听合约事件
  routerContract.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
    console.log('Swap事件:', { sender, amount0In, amount1In, amount0Out, amount1Out, to });
    // 更新UI状态
  });
};
```

## 总结

这个交互流程涵盖了DeFi应用的核心功能：

1. **钱包集成**: 连接MetaMask，管理账户状态
2. **合约交互**: 实例化工厂、路由、交易对合约
3. **交易功能**: 代币交换、流动性管理
4. **授权管理**: ERC20代币授权机制
5. **实时数据**: 余额、价格、储备量查询
6. **错误处理**: 完善的错误捕获和用户提示
7. **状态管理**: React Context管理全局状态
8. **事件监听**: 实时响应区块链状态变化

通过这些交互机制，前端应用可以安全、高效地与智能合约进行通信，为用户提供完整的DeFi交易体验。