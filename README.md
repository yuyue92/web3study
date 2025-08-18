**web3学习笔记**

前端开发人员的 Web3 学习路线图

一、基础准备（Web2 → Web3 的过渡）

前端必备：
- HTML、CSS、JavaScript/TypeScript
- React / Vue / Next.js / Vite 等框架
- API 请求、状态管理（Redux, Zustand, Pinia）

网络与安全：HTTP vs WebSocket、JWT/OAuth 等 Web2 身份认证方式（对比 Web3 的钱包认证）

目标：能独立完成 Web2 前端开发，并理解传统登录/支付/存储的模式。

二、区块链与 Web3 基础

区块链原理：
- 区块、交易、共识机制（PoW, PoS）
- Gas、Nonce、智能合约
- 钱包、助记词、私钥、公钥

主流链：
- 以太坊 (Ethereum, EVM 生态)
- Polygon、Arbitrum、Optimism（L2）
- Solana、Aptos、Sui（非 EVM）

三、Web3 前端核心技能

🦊 钱包交互：Metamask、wallConnect
- window.ethereum API
- 连接钱包、获取账户、签名交易
- 钱包多链支持（ChainId 切换）

📦 常用库：
- ethers.js / viem
   - 合约调用 contract.methods.functionName()
   - 事件监听
   - 钱包签名与交易发送
 
- wagmi + RainbowKit (React)：
   - 快速集成钱包登录
   - 多链支持
   - UI 组件库
 
- 🖼 NFT & Token：
   - ERC-20（代币标准）
   - ERC-721（NFT）
   - ERC-1155（半同质化）
   - 读取余额、转账、铸造 NFT
 
- 📌 目标：能做一个 连接钱包 + 查询余额 + 转账/调用合约 的 dApp。

四、智能合约（Solidity）：
- 语言：Solidity 基础语法
- 开发框架：Hardhat / Foundry（合约开发、测试）、OpenZeppelin（安全的合约库）；
- 合约部署：测试网（Sepolia, Mumbai）、使用 Alchemy / Infura 提供的节点
- 目标：能与合约交互（ABI、合约地址），知道合约函数的输入输出。

五、去中心化存储 & 后端
- 去中心化存储：
   - IPFS / Pinata：上传图片/文件 → 得到哈希
   - Arweave：永久存储；
   - NFT.Storage / Web3.Storage
 
- 去中心化后端：
   - The Graph：区块链数据索引 → GraphQL 查询
   - Moralis / Alchemy SDK：链上数据 API（交易记录、NFT、钱包余额）



