#### 币安交易所-资金费率套利【node】：
`原理如下`
1. 自动寻找币安交易所 正负费率 最大的交易对

2. 在每天 0点，早8点，16点，资金费率结算的前一秒，进行对冲开单建仓

3. 资金费率结算完成后，当多空浮盈覆盖手续费后，清仓

4. 策略可定制【vx:wkc19891】


## 配置文件说明
```
{
    "env": "prod",//部署环境，默认prod，无需配置
    "isRestart": true,//策略停止重启时，是否重置程序运行记录，默认false
    "apiKey": "",//秘钥
    "apiSecret": "",//秘钥
    "teleBotToken": "5039617435:AAG9lgyAM-t7LwI-TfVS39pk31W6XlUrz9w",//tg token
    "proxyIp": "127.0.0.1",//非国外服务器 配置代理 防止被墙，国外服务器运行 无需理会次参数
    "proxy": 1087,//非国外服务器 配置代理 防止被墙，国外服务器运行 无需理会次参数
    "kTime": "5m",//趋势K线周期 默认"5m"
    "chat_id": [
        -1001784840574 //tg 推送消息群chatid
    ],
    "pft": 0.5,//止盈触发 0.5 指 0.5%
    "pftBack": 0.1,//回调止盈 0.1 指 0.1%
    "maxStep": 6,//最大加仓次数
    "coinList": [
        "BTCUSDT"//运行交易对
    ],
    "BTCUSDT": {//运行交易对 配置
        "runBet": {
            "next_buy_price": 2750,//多单买入/补仓价格 程序自动赋值 默认填0即可
            "grid_sell_price": 2750,//无需配置
            "step": 0,//加仓次数统计 无需配置 默认 0
            "recorded_price": [],//加仓价格记录 无需配置 默认[]
            "next_buy_price_s": 2750,//空单卖出/补仓价格 程序自动赋值 默认填0即可
            "grid_sell_price_s": 2750,//无需配置
            "step_s": 0,加仓次数统计 无需配置 默认 0
            "recorded_price_s": []//加仓价格记录 无需配置 默认[]
        },
        "config": {
            "cointype": "BTCUSDT",//运行交易对
            "profit_ratio": 0.5,//和double_throw_ratio配置一致即可 0.5 指 0.5%
            "double_throw_ratio": 0.5,//补仓比率
            "quantity": [
                50,//首单 单位 "USDT" 50 指50U
                60,//第一次加仓
                70,//第二次加仓
                80,
                90,
                180//第五次加仓
            ]
        }
    }
}
```
## 配置多交易对

```

{
    "env": "prod",//部署环境，默认prod，无需配置
    "isRestart": true,//策略停止重启时，是否重置程序运行记录，默认false
    "apiKey": "",//秘钥
    "apiSecret": "",//秘钥
    "teleBotToken": "5039617435:AAG9lgyAM-t7LwI-TfVS39pk31W6XlUrz9w",//tg token
    "proxyIp": "127.0.0.1",//非国外服务器 配置代理 防止被墙，国外服务器运行 无需理会次参数
    "proxy": 1087,//非国外服务器 配置代理 防止被墙，国外服务器运行 无需理会次参数
    "kTime": "5m",//趋势K线周期 默认"5m"
    "chat_id": [
        -1001784840574 //tg 推送消息群chatid
    ],
    "pft": 0.5,//止盈触发 0.5 指 0.5%
    "pftBack": 0.1,//回调止盈 0.1 指 0.1%
    "maxStep": 6,//最大加仓次数
    "coinList": [
        "ETHUSDT",
        "MATICUSDT",
        "FTMUSDT",
        "EOSUSDT",
        "ONEUSDT"
    ],
    "ETHUSDT": {
        "runBet": {
            "next_buy_price": 2750,
            "grid_sell_price": 2750,
            "step": 0,
            "recorded_price": []
        },
        "config": {
            "cointype": "ETHUSDT",
            "profit_ratio": 0.3,
            "double_throw_ratio": 0.5,
            "quantity": [
                100,
                120,
                140,
                160,
                180,
                360
            ]
        }
    },
    "MATICUSDT": {
        "runBet": {
            "next_buy_price": 1.805,
            "grid_sell_price": 1.81,
            "step": 0,
            "recorded_price": []
        },
        "config": {
            "cointype": "MATICUSDT",
            "profit_ratio": 0.2,
            "double_throw_ratio": 0.5,
            "quantity": [
                100,
                120,
                140,
                160,
                180,
                360
            ]
        }
    },
    "FTMUSDT": {
        "runBet": {
            "next_buy_price": 2750,
            "grid_sell_price": 2750,
            "step": 0,
            "recorded_price": []
        },
        "config": {
            "cointype": "FTMUSDT",
            "profit_ratio": 0.3,
            "double_throw_ratio": 0.5,
            "quantity": [
                100,
                120,
                140,
                160,
                180,
                360
            ]
        }
    },
    "EOSUSDT": {
        "runBet": {
            "next_buy_price": 2750,
            "grid_sell_price": 2750,
            "step": 0,
            "recorded_price": []
        },
        "config": {
            "cointype": "EOSUSDT",
            "profit_ratio": 0.3,
            "double_throw_ratio": 0.5,
            "quantity": [
                100,
                120,
                140,
                160,
                180,
                360
            ]
        }
    },
    "ONEUSDT": {
        "runBet": {
            "next_buy_price": 2750,
            "grid_sell_price": 2750,
            "step": 0,
            "recorded_price": []
        },
        "config": {
            "cointype": "ONEUSDT",
            "profit_ratio": 0.3,
            "double_throw_ratio": 0.5,
            "quantity": [
                100,
                120,
                140,
                160,
                180,
                360
            ]
        }
    }
}

```