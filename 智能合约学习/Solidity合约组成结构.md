智能合约的七个基本组成结构：
- 1、状态变量：
   - 是存储在链上的永久结构：如代币余额、合约所有者，示例
   - ```
     uint256 public totalSupply;  // 代币总供应量  
      address public owner;       // 合约管理员  
      ```
- 2、函数
   - 作用是定义可执行的操作，如转账、授权；分类有 pure、view（只读函数），payable（可接受ETH的函数），示例：
   - ```
     function transfer(address to, uint256 amount) public {  
       balances[msg.sender] -= amount;  
       balances[to] += amount;  
   }
     ```
- 3、事件
   - 作用是记录链上日志，供前端监听、如代币转账记录，示例：`event Transfer(address indexed from, address indexed to, uint256 value);`
- 4、修饰器
   - 作用是复用权限，或条件检查逻辑，如onlyOwner，示例：
   - ```
     modifier onlyOwner {  
          require(msg.sender == owner, "Not owner");  
          _;  // 继续执行函数体  
      
      }
      ```
- 5、构造函数
   - 作用是 在合约部署时 初始化状态，示例：`{ owner = msg.sender;   }` 关系：仅在部署时运行一次，初始化关键的状态变量；
- 6、回退函数（Fallback、Receive）
   - 作用是处理未匹配函数调用 或 纯ETH转账，示例：
   - ```
     receive() external payable {}  // 接收 ETH  
      fallback() external {}        // 处理未知调用
      ```
   - 回退函数作为合约的默认入口，与外部调用交互。

- 7、结构体与映射（Structs & Mappings）
   - 作用是组织复杂的数据，如用户信息，代币持有记录等；示例：
   - ```
     struct User {  
          uint256 balance;  
          bool isActive;  
      }  
      mapping(address => User) public users;
     ```
   - 作为状态变量的高级数据结构，被函数读写。
 
各个组件之间的协作关系是：
```
1. 用户调用函数 → 函数通过修饰器验证权限 → 触发事件；
2. 构造函数 初始化合约 → 设置所有者（owner）和初始状态；
3. 外部合约、用户发送ETH → 回退函数处理 → 更新余额状态变量。
```

总结：智能合约通过 七大结构的组合实现：数据存储（状态变量、结构体、映射）；逻辑执行（函数、构造函数、回退函数）；安全控制（修饰器）；链外通信（事件）。
