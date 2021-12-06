const { fp, _, aneka } = require('ndut-helper')
const { requireDeep } = aneka
const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
const getModelByAlias = require('./lib/get-model-by-alias')
const formatRest = require('./lib/format-rest')
const doBuild = require('./build.js')

module.exports = fp(async function (fastify, options) {
  const { config } = fastify

  const builder = new ModelBuilder()
  const ds = {}
  const model = {}

  for (const db of options.connections) {
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
    fastify.log.debug(`+ Model '${schema.name}' on '${schema.connection}'`)
    const def = _.reduce(schema.columns, (o, c) => {
      o[c.name] =  _.omit(c, ['name'])
      return o
    }, {})
    model[schema.name] = builder.define(schema.name, def, { forceId: false })
    model[schema.name].attachTo(ds[schema.connection])
  }

  if (config.mode === 'build') await doBuild(fastify, ds, model)

  const helper = {
    getModelByAlias,
    formatRest
  }
  fastify.decorate('ndutDb', { ds, model, helper })
})
