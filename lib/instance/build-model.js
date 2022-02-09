const { ModelBuilder } = require('loopback-datasource-juggler')
const extendByHookFile = require('./extend-by-hook-file')
const path = require('path')
const builder = new ModelBuilder()

module.exports = async function (schema, omitFeature = []) {
  this.ndutDb.model = this.ndutDb.model || {}
  const { _, getConfig, getNdutConfig, fastGlob } = this.ndut.helper
  const config = getConfig()
  const { customSchemaKeys } = this.ndutDb.helper
  const opts = _.omit(schema, _.concat(['properties', 'acls', 'base', 'http', 'remoting'], customSchemaKeys))
  if (config.appMode === 'build') {
    opts.forceId = false
  }
  const extender = []
  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const files = await fastGlob(`${cfg.dir}/ndutDb/feature/*.js`)
    for (const f of files) {
      const base = _.camelCase(`${cfg.instanceName === 'ndutDb' ? '' : cfg.instanceName} ${path.basename(f, '.js')}`)
      if (omitFeature.includes(base)) continue
      let fn = require(f)
      if (_.isFunction(fn)) fn = { extender: fn }
      const options = _.get(schema, `feature.${base}`)
      if (options) {
        if (fn.builder) await fn.builder.call(this, schema, options)
        if (fn.extender) extender.push({ options, handler: fn.extender })
      }
    }
  }
  const model = builder.define(schema.name, schema.properties, opts)
  for (const ext of extender) {
    await ext.handler.call(this, { builder, schema, model, options: ext.options })
  }
  this.ndutDb.model[schema.name] = model
  await extendByHookFile.call(this, model, schema)
  model.attachTo(this.ndutDb.dataSourceInstance[schema.dataSource])

  return { builder, model }
}