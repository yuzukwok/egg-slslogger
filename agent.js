const slsTransports = require('./lib/slsTransport')
module.exports = app => {
  let SlsTransport = slsTransports(app)
  app.getLogger('logger').set('aliyunsls', new SlsTransport({ level: 'DEBUG', app }))
  app.getLogger('coreLogger').set('aliyunsls', new SlsTransport({ level: 'DEBUG', app }))
  app.getLogger('errorLogger').set('aliyunsls', new SlsTransport({ level: 'DEBUG', app }))
  app.coreLogger.info('[egg-slslogger] start logger transport to sls')
}
