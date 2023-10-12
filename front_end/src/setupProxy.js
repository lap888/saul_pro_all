const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
  app.use(
    '/base',
    createProxyMiddleware({
      target: 'http://127.0.0.1:30019',
      changeOrigin: true,
      pathRewrite: {
        '^/base': '/', // 如果是/api开头的请求全部跳至target对应的地址
      },
    })
  );
};
