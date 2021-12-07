const { fp, _, aneka } = require('ndut-helper')
const { requireDeep } = aneka
const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
const getModelByAlias = require('./lib/get-model-by-alias')
const formatRest = require('./lib/format-rest')
const doBuild = require('./build.js')
const extendTimestamp = require('./model/timestamp')

module.exports = fp(async function (fastify, options) {
  const { config } = fastify

  const builder = new ModelBuilder()
  const ds = {}
  const model = {}

  for (const db of options.dataSources) {
    fastify.log.debug(`+ Datasource '${db.name}'`)
    if (db.connector === 'memory') ds[db.name] = new DataSource(db)
    else {
      const name = db.connector
      db.connector = requireDeep(db.connector)
      ds[db.name] = new DataSource(db)
      db.connector = name
    }
  }

  for (const schema of options.schemas) {
    fastify.log.debug(`+ Model '${schema.name}' on '${schema.dataSource}'`)
    const props = schema.properties
    const opts = _.omit(schema, ['properties', 'acls', 'base', 'http', 'remoting'])
    if (config.mode === 'build') opts.forceId = false
    const m = builder.define(schema.name, props, opts)
    extendTimestamp(builder, m, schema)
    m.attachTo(ds[schema.dataSource])
    model[schema.name] = m
  }

  if (config.mode === 'build') await doBuild(fastify, ds, model)

  const helper = {
    getModelByAlias,
    formatRest
  }
  fastify.decorate('ndutDb', { ds, model, helper })
})
