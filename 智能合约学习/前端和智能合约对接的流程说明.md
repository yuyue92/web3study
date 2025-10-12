**主要流程说明**

一、初始化流程
- 安装依赖：安装ethers.js或web3.js；
- 配置ABI：将合约ABI文件放在项目中；
- 设置网络：配置不同网络的合约地址；
- 创建工具类：封装Web3相关操作；

二、连接钱包的流程
- 检测钱包：检查是否安装MetaMask等钱包；
- 请求连接：调用eth_requestAccounts方法；
- 创建Provider：创建ethers.js的Provider实例；
- 获取Signer:获取用户的Signer用于签名交易；
- 初始化合约：使用ABI和地址创建合约实例；

三、合约调用的流程：

只读方法（view/pure）:
- 直接调用合约方法
- 无需gas费用
- 立即返回结果

写入方法（state-changing）:
- 估算gas费用
- 构建交易参数
- 用户确认交易
- 发送到区块链
- 等待交易确认
- 处理结果
