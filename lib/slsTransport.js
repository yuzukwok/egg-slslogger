const Transport = require('egg-logger').Transport
const ALY = require('aliyun-sdk')
const util = require('util')
module.exports = app => {
  var sls = new ALY.SLS({
    accessKeyId: app.config.slslogger.accessKeyId,
    secretAccessKey: app.config.slslogger.secretAccessKey,
    endpoint: app.config.slslogger.endpoint,
    apiVersion: app.config.slslogger.apiVersion
  })
  class slsLoggerTransport extends Transport {
    makeSlsData (topic, kv) {
     // console.log(kv)
      var result = [{
        time: Math.floor(new Date().getTime() / 1000),
        contents: kv
      }]
      return result
    }
  // 定义 log 方法，在此方法中把日志上报给远端服务
    log (level, args, meta) {
     // console.log(args)
      var kv = []
      let logmsg
      if (args[0] instanceof Error) {
        const err = args[0]
        logmsg = util.format('%s: %s\n%s\npid: %s\n', err.name, err.message, err.stack, process.pid)
      } else {
        logmsg = util.format(...args)
      }
      kv.push({key: 'msg', value: logmsg})
      // if (meta) {
      //   for (var property in meta) {
      //     var v = meta[property] || ''
      //     if (typeof (v) === 'object') {
      //       v = JSON.stringify(v)
      //     } else {
      //       v = String(v)
      //     }
      //     kv.push({key: property, value: v})
      //   }
      // }
      if (meta && meta.paddingMessage) {
        kv.push({key: 'pid', value: String(meta.pid) || ''})
        kv.push({key: 'hostname', value: meta.hostname || ''})
        kv.push({key: 'level', value: meta.level || ''})
        // 分解paddingMessage
        let records = meta.paddingMessage.split(' ')
        if (records.length === 3) {
          kv.push({key: 'method', value: records[1]})
          kv.push({key: 'url', value: records[2].substring(0, records[2].length - 1)})
          let r2 = records[0].split('/')
          if (r2.length === 4) {
            kv.push({key: 'userId', value: r2[0].substr(1)})
            kv.push({key: 'ip', value: r2[1] || ''})
            kv.push({key: 'traceId', value: r2[2]})
            kv.push({key: 'use_ms', value: r2[3]})
          }
        }
      }

      var msgData = this.makeSlsData(level, kv)
      sls.putLogs({
        projectName: app.config.slslogger.slsProject,
        logStoreName: app.config.slslogger.logStoreName,
        logGroup: {
          logs: msgData,
          topic: level
        }
      }, function (err, data) {
        if (err) {
          console.log('error:', err)
        }
      })
    }
}
  return slsLoggerTransport
}
