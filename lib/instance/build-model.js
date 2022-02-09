const { ModelBuilder } = require('loopback-datasource-juggler')
const extendByHookFile = require('./extend-by-hook-file')
const path = require('path')
const builder = new ModelBuilder()

module.exports = async function (schema) {
  const { _, getConfig, fastGlob, iterateNduts } = this.ndut.helper
  const config = getConfig()
  this.ndutDb.model = this.ndutDb.model || {}
  const { customSchemaKeys } = this.ndutDb.helper
  const opts = _.omit(schema, _.concat(['properties', 'acls', 'base', 'http', 'remoting'], customSchemaKeys))
  if (config.appMode === 'build') {
    opts.forceId = false
  }
  const rebuild = []
  await iterateNduts(async function (cfg) {
    const files = await fastGlob(`${cfg.dir}/ndutDb/rebuild/*.js`)
    for (const f of files) {
      const base = _.camelCase(`${cfg.instanceName === 'ndutDb' ? '' : cfg.instanceName} ${path.basename(f, '.js')}`)
      const options = _.get(schema, `rebuild.${base}`)
      if (!options) continue
      const mod = require(f)
      rebuild.push({ options, handler: mod })
    }
  })
  for (const r of rebuild) {
    await r.handler.call(this, schema, r.options)
  }
  delete schema.rebuild
  const feature = []
  await iterateNduts(async function (cfg) {
    const files = await fastGlob(`${cfg.dir}/ndutDb/feature/*.js`)
    for (const f of files) {
      const base = _.camelCase(`${cfg.instanceName === 'ndutDb' ? '' : cfg.instanceName} ${path.basename(f, '.js')}`)
      const options = _.get(schema, `feature.${base}`)
      if (!options) continue
      const mod = require(f)
      feature.push({ options, handler: mod })
    }
  })
  const model = builder.define(schema.name, schema.properties, opts)
  for (const f of feature) {
    await f.handler.call(this, { builder, schema, model, options: f.options })
  }
  this.ndutDb.model[schema.name] = model
  await extendByHookFile.call(this, model, schema)
  model.attachTo(this.ndutDb.dataSourceInstance[schema.dataSource])

  return { builder, model }
}