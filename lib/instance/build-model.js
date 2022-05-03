const { ModelBuilder } = require('loopback-datasource-juggler')
const extendByHookFile = require('./extend-by-hook-file')
const path = require('path')
const builder = new ModelBuilder()

module.exports = async function (schema) {
  const { _, fs, getConfig, getNdutConfig, fastGlob, iterateNduts } = this.ndut.helper
  const config = getConfig()
  this.ndutDb.model = this.ndutDb.model || {}
  const { customSchemaKeys } = this.ndutDb.helper
  const opts = _.omit(schema, _.concat(['properties', 'acls', 'base', 'http', 'remoting'], customSchemaKeys))
  if (config.appMode === 'build') {
    opts.forceId = false
  }
  const cfg = getNdutConfig(_.get(schema, 'rebuild.from'))
  if (cfg) {
    const file = `${cfg.dir}/ndutDb/builder/rebuild.js`
    if (fs.existsSync(file)) {
      this.log.debug(`* Rebuild '${schema.name}' from '${cfg.instanceName}' with type '${schema.rebuild.type}'`)
      await require(file).call(this, schema)
    }
  }
  delete schema.rebuild
  const featureHandlers = []
  await iterateNduts(async function (cfg) {
    const files = await fastGlob(`${cfg.dir}/ndutDb/feature/*.js`)
    for (const f of files) {
      const base = _.camelCase(`${cfg.instanceName === 'ndutDb' ? '' : cfg.instanceName} ${path.basename(f, '.js')}`)
      const options = _.get(schema, `feature.${base}`)
      if (!options) continue
      const mod = require(f)
      if (_.isPlainObject(mod) && mod.properties) schema.properties = _.merge(schema.properties, mod.properties)
      if (mod.handler) featureHandlers.push({ options, handler: _.isPlainObject(mod) ? mod.handler : mod })
    }
  })
  // apply defaults
  const dbName = this.ndutDb.dataSourceInstance[schema.dataSource].adapter.name
  if (['postgresql', 'mysql', 'sqlite3', 'oracle'].includes(dbName)) {
    _.forOwn(schema.properties, (v, k) => {
      const typeIsString = typeof v.type === 'string' && v.type.toLowerCase() === 'string'
      const typeIsStringFn = typeof v.type === 'function' && v.type.name === 'String'
      if ((typeIsString || typeIsStringFn) && v.length && !v[dbName]) {
        v[dbName] = {
          dataType: 'VARCHAR',
          dataLength: v.length
        }
      }
    })
  }
  const model = builder.define(schema.name, schema.properties, opts)
  for (const f of featureHandlers) {
    await f.handler.call(this, { builder, schema, model, options: f.options })
  }
  this.ndutDb.model[schema.name] = model
  await extendByHookFile.call(this, model, schema)
  model.attachTo(this.ndutDb.dataSourceInstance[schema.dataSource])

  return { builder, model }
}