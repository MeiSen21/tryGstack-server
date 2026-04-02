// 阿里云函数计算入口
const server = require('./simple-server');

// 导出 handler 给 FC 使用
exports.handler = (req, res, context) => {
  server.emit('request', req, res);
};
