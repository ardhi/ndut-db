const path = require('path')
const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
const collectSchemas = require('../lib/collect-schemas')
const collectDatasources = require('../lib/collect-datasources')

const doBuild = require('../lib/build')
const extendByHookFile = require('../model/hook-file')
// instance
const builtIn = require('../lib/instance/built-in')
const instanceHook = require('../lib/instance/hook')

const customSchemaKeys = ['alias', 'ndut', 'expose', 'feature', 'extend', 'disableAliasCall', 'file']

module.exports = async function () {
  const { _, aneka, bindTo, getConfig, getNdutConfig, fastGlob } = this.ndut.helper
  const { requireDeep } = aneka
  const config = getConfig()
  await collectDatasources.call(this)
  await collectSchemas.call(this)

  const builder = new ModelBuilder()
  const ds = {}
  const model = {}
  const { dataSources, schemas } = this.ndutDb

  for (const db of dataSources) {
    this.log.debug(`* Datasource '${db.name}'`)
    if (db.connector === 'memory') ds[db.name] = new DataSource(db)
    else {
      const name = db.connector
      db.connector = requireDeep(db.connector)
      ds[db.name] = new DataSource(db)
      db.connector = name
    }
  }

  for (const schema of schemas) {
    this.log.debug(`* Model '${schema.name}' on '${schema.dataSource}'`)
    const props = schema.properties
    const opts = _.omit(schema, _.concat(['properties', 'acls', 'base', 'http', 'remoting'], customSchemaKeys))
    if (config.appMode === 'build') {
      opts.forceId = false
    }
    const mdl = builder.define(schema.name, props, opts)
    for (const n of config.nduts) {
      const cfg = getNdutConfig(n)
      const files = await fastGlob(`${cfg.dir}/ndutDb/feature/*.js`)
      for (const f of files) {
        const base = _.camelCase(`${cfg.instanceName === 'ndutDb' ? '' : cfg.instanceName} ${path.basename(f, '.js')}`)
        const fn = require(f)
        const opts = _.get(schema, `feature.${base}`)
        if (opts) await fn.call(this, { builder, model: mdl, schema, options: opts })
      }
    }
    await extendByHookFile.call(this, mdl, schema)
    mdl.attachTo(ds[schema.dataSource])
    model[schema.name] = mdl
  }
  instanceHook.call(this, ds, model)

  if (config.appMode === 'build') await doBuild.call(this, ds, model)

  await builtIn.call(this, model)

  this.ndutDb.customSchemaKeys = customSchemaKeys
  this.ndutDb.model = model
  this.ndutDb.dataSourceInstance = ds
}
