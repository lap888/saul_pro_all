
/**
 * API websocket账户信息推流 endpoints
 * @module accountpush
 * @param {*} superclass
 */
const AccountPush = superclass => class extends superclass {

  /**
   * 生成listenKey (USER_STREAM)<br>
   *
   * POST /fapi/v1/listenKey<br>
   *
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#listenkey-user_stream}
   *
   */
  listenKeyPost(options = {}) {
    return this.signRequest(
      'POST',
      '/fapi/v1/listenKey',
      options
    )
  }

  /**
   * 获取交易规则和交易对 NONE
   * @param {*} options 
   * 
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#3f1907847c} 
   */
  exchangeInfo(options = {}) {
    return this.publicRequest(
      'GET',
      '/fapi/v1/exchangeInfo',
      options
    )
  }
  /**
   * 获取服务器时间
   * @param {*} options 
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#3f1907847c} 
   */
  time(options = {}) {
    return this.publicRequest(
      'GET',
      '/fapi/v1/time',
      options
    )
  }

  /**
   * 获取交易对价格
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#8ff46b58de} 
   * @param {*} symbol 
   * @param {*} options 
   * @returns 
   */
  price(options = {}) {
    // symbol = symbol + "USDT";
    return this.publicRequest(
      'GET',
      '/fapi/v1/ticker/price',
      options
    )
  }

  /**
     * 获取交易对价格
     * {@link https://binance-docs.github.io/apidocs/spot/cn/#24hr} 
     * @param {*} symbol 
     * @param {*} options 
     * @returns 
     */
  pricev3(options = {}) {
    // symbol = symbol + "USDT";
    return this.publicRequest(
      'GET',
      '/api/v3/ticker/price',
      options
    )
  }

  /**
   * 延长listenKey有效期 (USER_STREAM)<br>
   *
   * PUT /fapi/v1/listenKey<br>
   *
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#listenkey-user_stream-2}
   *
   */

  listenKeyPut() {
    return this.signRequest(
      'PUT',
      '/fapi/v1/listenKey'
    )
  }

  /**
   * 关闭listenKey (USER_STREAM)<br>
   *
   * DELETE /fapi/v1/listenKey<br>
   *
   * {@link https://binance-docs.github.io/apidocs/futures/cn/#listenkey-user_stream-3}
   *
   */

  listenKeyDelete() {
    return this.signRequest(
      'DELETE',
      '/fapi/v1/listenKey'
    )
  }
}

module.exports = AccountPush
