Solidity是一种面向智能合约的高级编程语言，专为以太坊和其他兼容EVM的区块链设计，它的语法类似于JavaScript和C++，用于编写 可自动执行的去中心化应用（DApp）。

Solidity有以下核心特性：
- 静态类型：变量类型需要显式声明，如uint256、address，减少运行时错误；
- 合约导向：代码以contract为单位，包含状态变量、函数和事件；
- 安全性优先：支持修饰器如onlyOwner，异常处理如require、revert，和防溢出机制；

Solidity的典型应用场景：
- 代币发行：如ERC-20， ERC-721
- 去中心化金融：DeFi, 借贷协议，交易所；
- DAO（去中心化组织）：治理投票，资金管理

Solidity代码示例：
```
// SPDX-License-Identifier: MIT  
pragma solidity 0.8.28;
contract SimpleStorage {
  unit256 public value;
  function setValue(uint256 _val) public {
    value = _val;
  }
}
```

solidity开发工具链包括：
- 编译器solc、
- 开发框架 hardHat、Foundry、Truffle。
- 测试网： Sopelia/Goerli。

Solidity安全注意事项：
- 重入攻击：使用 ReentrancyGuard；
- 整数溢出：Solidity0.8.0+ 默认启用检查；
- 权限控制：避免滥用 tx.origin；改用msg.sender。
