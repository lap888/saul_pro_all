## 运行启动说明
1. npm i 安装依赖
2. 使用node 或者 pm2 启动

## 前端项目说明

1. cd 进入 front_end 文件夹
2. yarn i 安装依赖
3. npm run build 打包



## 配置文件说明
``` json
{
    "env": "dev",//运行环境 本地运行 dev 服务器运行 prod
    "isRestart": true,//重启重置配置 选 true 表示重置 false 表示不重置
    "apiKey": "秘钥",
    "apiSecret": "密匙",
    "proxyIp": "127.0.0.1",//代理host env 为 dev 生效
    "proxy": 1087,//代理端口 env 为 dev 生效
    "listenPort": 30010,//express 监听端口
    "bCoins": [//运行交易对币种集合 
        {
            "type": "hy",//类型 合约=hy,现货=xh
            "orderRate": 0.06,//下单金额占总仓位比例 0.06=6% ,账户有1000U 本次下单使用 60U
            "userId": 1001,//自定义用户编号
            "coin": "ETHUSDT",//运行币种
            "status": 1,//运行状态 1 运行 0 停止
            "lever": 50,//杠杆 只在type=hy时生效
            "margin": 1,//保证金 只在type=hy时生效
            "minAmount": 20,//分批购买单笔买入最小金额
            "indicator": [
                "1h&SAR|0.02|0.2",//币种运行指标="时间周期&指标名称|参数1|参数2"
                "5m&MA|7&MA|21",
                "5m&KDJ|9|3|3",
                "5m&BOLL|21|2"
            ],
            "orderType": "limit",//订单类型limit=限价分批购买 market市价购买 首选limit
            "stopPft": 1,//1=1% 表示盈利达到1%
            "sellRate":50,//50=50% 表示卖掉持有仓位的50%
            "stopLoss": 1,//1=1% -1=指标信号反转且浮亏达到1%止损 ，1指标信号反转止损 
            "startTime": 0,// 策略运行开始时间 0=零点
            "endTime": 24,// 策略运行结束时间 24=23：59：59 [配置 startTime =0 endTime=24 表示24小时运行]
            "cancelTime":10//10=10秒 指限价挂单10s未成交 撤销重新挂单
            "stopPftBack": 1,//系统默认参数无需修改
            "posPrice": 0,//系统默认参数无需修改
            "onPftData1": 0,//系统默认参数无需修改
            "onPftData2": 0,//系统默认参数无需修改
        },
        {
            "type": "hy",
            "orderRate": 0.06,
            "posPrice": 0,
            "userId": 1001,
            "coin": "BTCUSDT",
            "status": 1,
            "lever": 100,
            "margin": 0.5,
            "totalAmount": 1000,
            "minAmount": 20,
            "indicator": [
                "1h&SAR|0.02|0.2"
            ],
            "orderType": "limit",
            "stopPft": 1,
            "sellRate":50,
            "stopPftBack": 1,
            "stopLoss": 1,
            "startTime": 0,
            "endTime": 24,
            "onPftData1": 0,
            "onPftData2": 0,
            "cancelTime":10
        }
    ],
    "teleBotToken": "telegram token",
    "chat_id": [
        -1001784840574 // telegram 消息推送群id或个人id
    ],
}
```