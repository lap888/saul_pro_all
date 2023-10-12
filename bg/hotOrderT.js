/* hotcoin api 下单接口
 * @Author: topbrids@gmail.com 
 * @Date: 2022-12-24 15:07:58 
 * @Last Modified by: topbrids@gmail.com
 * @Last Modified time: 2023-02-17 10:23:50
 */
const crypto = require('crypto');
const axios = require('axios');
const env = false
const ExKey = [
    {
        id: 1,
        name: 'MyTop',
        apiKey: '39fc51519cee432fb4fba4336f2c10cd',
        secretKey: '457D3409CD3D339BDF1262E7D4D7EB00',
        passphrase: 'xh18819513042',
        amount: 20,
        isDo: true,
        pos: 'a|u'
    },
]
let ErrTryDoCount = {}
// 签名算法
let hmacSha256 = "HmacSHA256";
// 签名版本号
let version = "2";
// 签名域名
let host = 'api.hotcoin.top'
// 请求域名
let domain = 'https://api-ct.hotcoin.fit'

const stringifyKeyValuePair = ([key, value]) => {
    const valueString = Array.isArray(value) ? `["${value.join('","')}"]` : value
    return `${key}=${encodeURIComponent(valueString)}`
}

const buildQueryString = params => {
    if (!params) return ''
    return Object.entries(params).sort().map(stringifyKeyValuePair)
        .join('&')
}


// CanUserHy()
async function Assets(accessKey, secretKey) {
    // HTTP请求方式
    let httpMethod = "GET";
    // 接口URI
    let uri = "/api/v1/perpetual/account/assets";
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString()//"2022-07-22T22:16:06.123Z";
    businessData["SignatureVersion"] = version;
    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    console.log('业务参数拼接', paramPair)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    console.log('待签名的原始字符串', unSign)
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    console.log("签名串URI编码:" + signature);
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`//buildQueryString(businessData);
    console.log("-----------------------------------------------------");
    console.log("Assets|最终请求:" + fullUrl);

    try {
        let response = await axios.get(fullUrl)
        console.log(response.data)
    } catch (e) {
        console.log(e.response.data)
    }

}
async function AssetsOne(accessKey, secretKey, contractCode) {
    // HTTP请求方式
    let httpMethod = "GET";
    // 接口URI
    let uri = `/api/v1/perpetual/account/assets/${contractCode}`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    businessData["SignatureVersion"] = version;
    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    console.log('业务参数拼接', paramPair)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    console.log('待签名的原始字符串', unSign)
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    console.log("签名串URI编码:" + signature);
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    console.log("AssetsOne|最终请求:" + fullUrl);

    try {
        let response = await axios.get(fullUrl)
        console.log(response.data)
    } catch (e) {
        console.log(e.response.data)
    }

}

async function OrderList(accessKey, secretKey, contractCode) {
    // HTTP请求方式
    let httpMethod = "GET";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/list`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    // 以下为接口的具体业务参数

    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    console.log('业务参数拼接', paramPair)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    console.log('待签名的原始字符串', unSign)
    // let signature = crypto.createHmac('sha256', encodeURIComponent(secretKey)).update(encodeURIComponent(unSign)).digest("base64");
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    console.log("签名串URI编码:" + signature);
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`//buildQueryString(businessData);
    console.log("-----------------------------------------------------");
    console.log("OrderList|最终请求:" + fullUrl);
    try {
        console.log('businessData', businessData)
        let response = await axios.get(fullUrl, {
            params: businessData,
            //请求头配置  
            headers: { 'Content-Type': 'application/json' }
        })
        // let response = await axios.get(fullUrl)
        console.log(response.data)
    } catch (e) {
        console.log(e.response?.data)
    }

}

/**
 * 订单交易详情
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 */
async function OrderDetail(accessKey, secretKey, contractCode) {
    // HTTP请求方式
    let httpMethod = "GET";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/orderDetail`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    // 以下为接口的具体业务参数

    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    console.log('业务参数拼接', paramPair)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    console.log('待签名的原始字符串', unSign)
    
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    console.log("签名串URI编码:" + signature);
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`//buildQueryString(businessData);
    console.log("-----------------------------------------------------");
    console.log("订单交易详情|最终请求:" + fullUrl);
    try {
        let response = await axios.get(fullUrl, {
            params: businessData,
            //请求头配置  
            headers: { 'Content-Type': 'application/json' }
        })
        // let response = await axios.get(fullUrl)
        console.log(response.data)
    } catch (e) {
        console.log(e.response?.data)
    }

}
/**
 * 调整杠杆
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 * @param {*} type 全仓:0,逐仓:1
 * @param {*} shortLeverL 
 * @param {*} longLever 
 */
async function Lever(accessKey, secretKey, contractCode, type = 0, shortLeverL = 30, longLever = 30) {
    // HTTP请求方式
    let httpMethod = "POST";
    // 接口URI
    let uri = `/api/v1/perpetual/position/${contractCode}/lever`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    // 以下为接口的具体业务参数
    // businessData["type"] = type;
    // businessData["shortLeverL"] = shortLeverL;
    // businessData["longLever"] = longLever;

    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    console.log('业务参数拼接', paramPair)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    console.log('待签名的原始字符串', unSign)
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    console.log("签名串URI编码:" + signature);
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    console.log("Lever|最终请求:" + fullUrl);
    try {
        let response = await axios.post(fullUrl, { type: type, shortLeverL: shortLeverL, longLever: longLever }, {
            //请求头配置  
            headers: { 'Content-Type': 'application/json' }
        })
        console.log(response.data)
    } catch (e) {
        console.log(e.response.data)
    }
}


/**
 * 买入开多
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 * @param {*} amount 
 * @param {*} type 10 限价 11 市价
 * @param {*} price 
 */
async function Buy(accessKey, secretKey, contractCode, amount, type = 11, price = -1) {
    contractCode=contractCode.toLowerCase()
    ErrTryDoCount[`${accessKey}_buy`] = 0
    // HTTP请求方式
    let httpMethod = "POST";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/order`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    if (env) {
        console.log('待签名的原始字符串', unSign)
    }
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    try {
        let _d = { type: type, amount: amount, side: 'open_long' }
        if (type == 10) {
            _d['price'] = price
        }
        let response = await axios.post(fullUrl, _d, {
            headers: { 'Content-Type': 'application/json' }
        })
        if (response.data == undefined || response.data['id'] == undefined) {
            console.log(response.data.id, `买入开多 | 失败 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return ''
        } else {
            console.log(response.data.id, `买入开多 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return response.data;
        }
    } catch (e) {
        console.log(`买入开多 | 异常 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl, e.response.data);
        return ''
    }
}
/**
 * 卖出平多
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 * @param {*} amount 
 * @param {*} type 10 限价 11 市价
 * @param {*} price 
 */
async function BuyClose(accessKey, secretKey, contractCode, amount, type = 11, price = -1) {
    contractCode=contractCode.toLowerCase()
    // HTTP请求方式
    let httpMethod = "POST";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/order`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    if (env) {
        console.log('待签名的原始字符串', unSign)
    }
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    try {
        let _d = { type: type, amount: amount, side: 'close_long' }
        if (type == 10) {
            _d['price'] = price
        }
        let response = await axios.post(fullUrl, _d, {
            headers: { 'Content-Type': 'application/json' }
        })
        if (response.data == undefined || response.data['id'] == undefined) {
            if (ErrTryDoCount[`${accessKey}_buy`] < 3) {
                ErrTryDoCount[`${accessKey}_buy`] = ErrTryDoCount[`${accessKey}_buy`] + 1
                BuyClose(accessKey, secretKey, contractCode, amount, type = 11, price = -1)
            } else {
                return response.data;
            }
        } else {
            console.log(response.data.id, `卖出平多 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return response.data;
        }
    } catch (e) {
        console.log(`卖出平多异常 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl, '\n' + e.response.data);
        if (ErrTryDoCount[`${accessKey}_buy`] < 3) {
            ErrTryDoCount[`${accessKey}_buy`] = ErrTryDoCount[`${accessKey}_buy`] + 1
            BuyClose(accessKey, secretKey, contractCode, amount, type = 11, price = -1)
        } else {
            return ''
        }

    }
}

/**
 * 卖出开空
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 * @param {*} amount 
 * @param {*} type 10 限价 11 市价
 * @param {*} price 
 */
async function Sell(accessKey, secretKey, contractCode, amount, type = 11, price = -1) {
    contractCode=contractCode.toLowerCase()
    ErrTryDoCount[`${accessKey}_sell`] = 0
    // HTTP请求方式
    let httpMethod = "POST";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/order`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();

    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    if (env) {
        console.log('待签名的原始字符串', unSign)
    }
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    try {
        let _d = { type: type, amount: amount, side: 'open_short' }
        if (type == 10) {
            _d['price'] = price
        }
        let response = await axios.post(fullUrl, _d, {
            headers: { 'Content-Type': 'application/json' }
        })
        if (response.data == undefined || response.data['id'] == undefined) {
            console.log(response.data.id, `卖出开空 | 失败 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return '';
        } else {
            console.log(response.data.id, `卖出开空 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return response.data;
        }
    } catch (e) {
        console.log(`卖出开空 | 异常 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl, e.response.data);
        return ''
    }
}
/**
 * 买入平空
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 * @param {*} amount 
 * @param {*} type 10 限价 11 市价
 * @param {*} price 
 */
async function SellClose(accessKey, secretKey, contractCode, amount, type = 11, price = -1) {
    contractCode=contractCode.toLowerCase()
    // HTTP请求方式
    let httpMethod = "POST";
    // 接口URI
    let uri = `/api/v1/perpetual/products/${contractCode}/order`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();

    //拼接业务参数
    let paramPair = buildQueryString(businessData)

    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    if (env) {
        console.log('待签名的原始字符串', unSign)
    }
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");

    try {
        let _d = { type: type, amount: amount, side: 'close_short' }
        if (type == 10) {
            _d['price'] = price
        }
        let response = await axios.post(fullUrl, _d, {
            headers: { 'Content-Type': 'application/json' }
        })

        if (response.data == undefined || response.data['id'] == undefined) {
            if (ErrTryDoCount[`${accessKey}_sell`] < 3) {
                ErrTryDoCount[`${accessKey}_sell`] = ErrTryDoCount[`${accessKey}_sell`] + 1
                SellClose(accessKey, secretKey, contractCode, amount)
            } else {
                return ''
            }
        } else {
            console.log(response.data.id, `买入平空 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl);
            return response.data;
        }
    } catch (e) {
        console.log(`卖出平多 | 异常 | ${type == 10 ? '限价' : '市价'} | 最终请求:\n` + fullUrl, e.response.data);
        if (ErrTryDoCount[`${accessKey}_sell`] < 3) {
            ErrTryDoCount[`${accessKey}_sell`] = ErrTryDoCount[`${accessKey}_sell`] + 1
            SellClose(accessKey, secretKey, contractCode, amount)
        } else {
            return ''
        }

    }
}

/**
 * 查询持仓
 * @param {*} accessKey 
 * @param {*} secretKey 
 * @param {*} contractCode 
 */
async function Pos(accessKey, secretKey, contractCode) {
    // HTTP请求方式
    let httpMethod = "GET";
    // 接口URI
    let uri = `/api/v1/perpetual/position/${contractCode}/list`;
    let businessData = {}
    businessData["AccessKeyId"] = accessKey;
    businessData["SignatureMethod"] = hmacSha256;
    businessData["SignatureVersion"] = version;
    // 当前UTC时间
    businessData["Timestamp"] = new Date().toISOString();
    // 以下为接口的具体业务参数

    //拼接业务参数
    let paramPair = buildQueryString(businessData)
    let unSign = `${httpMethod}\n${host}\n${uri}\n${paramPair}`
    if (env) {
        console.log('待签名的原始字符串:\n' + unSign)
    }
    let signature = crypto.createHmac('sha256', secretKey).update(unSign).digest("base64");
    signature = encodeURIComponent(signature)
    // 添加到请求参数
    businessData["Signature"] = signature

    let fullUrl = domain + uri + "?" + `${paramPair}&Signature=${signature}`
    console.log("-----------------------------------------------------");
    console.log("查询持仓|最终请求:\n" + fullUrl);
    try {
        // let response = await axios.get(fullUrl, {
        // params: businessData,
        //     headers: { 'Content-Type': 'application/json' }
        // })
        let response = await axios.get(fullUrl)
        return response.data
    } catch (e) {
        console.log(e.response?.data)
    }

}
// API访问Key
let accessKey = "b74629cfabcc466892b38b5573106648";
// 签名秘钥
let secretKey = "44C14F561BA2468572EE18616616E3A3";
Assets(accessKey, secretKey)
// AssetsOne(accessKey, secretKey, 'ethusdt')
// OrderList(accessKey, secretKey, 'ethusdt')
// OrderList(accessKey, secretKey, 'ethusdt')
// OrderList(accessKey, secretKey, 'btcusdt')
// OrderList(accessKey, secretKey, 'ltcusdt')
// OrderList(accessKey, secretKey, 'xrpusdt')
// ChangeMargin(accessKey, secretKey, 'ethusdt')
// Lever(accessKey, secretKey, 'ethusdt', 1, 100, 100)
// Buy(accessKey, secretKey, 'ethusdt', 1).then(res => {
//     console.log('Buy', res)
// })

// Sell(accessKey, secretKey, 'btcusdt', 1).then(res => {
//     console.log('sell', res)
// })


// BuyClose(accessKey, secretKey, 'ethusdt', 1).then(res => {
//     console.log('BuyClose', res)
// })
// SellClose(accessKey, secretKey, 'ethusdt', 1).then(res => {
//     console.log('SellClose', res)
// })
// Pos(accessKey, secretKey, 'ethusdt').then(res => {
//     console.log('pos', res)
//     let longPos = res.find(v => v.side == 'long')
//     let sPos = res.find(v => v.side == 'short')
//     console.log('lPos=', longPos, 'sPos=', sPos)
// })

// Pos(accessKey, secretKey, 'btcusdt').then(res => {
//     console.log('pos', res)
// })

module.exports = {
    Assets,
    Buy,
    BuyClose,
    Sell,
    SellClose,
    Pos
}