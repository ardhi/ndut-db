const { fp, _, aneka } = require('ndut-helper')
const { requireDeep } = aneka
const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
const getModelByAlias = require('./get-model-by-alias')
const formatRest = require('./format-rest')
const doBuild = require('./build.js')
const extendTimestamp = require('../model/timestamp')

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
    const opts = _.omit(schema, ['properties', 'acls', 'base', 'http', 'remoting', 'override',
      'feature', 'ndut', 'disableAliasCall'])
    if (config.appMode === 'build') {
      opts.forceId = false
    }
    const m = builder.define(schema.name, props, opts)
    extendTimestamp(fastify, builder, m, schema)
    m.attachTo(ds[schema.dataSource])
    model[schema.name] = m
  }

  if (config.appMode === 'build') await doBuild(fastify, ds, model)

  fastify.addHook('onClose', async (instance, done) => {
    for (const k of _.keys(ds)) {
      fastify.log.debug(`Closing datasource '${k}'`)
      await ds[k].disconnect()
    }
    done()
  })

  const helper = {
    getModelByAlias,
    formatRest
  }
  fastify.decorate('ndutDb', { ds, model, helper })
})
