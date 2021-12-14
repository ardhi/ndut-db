const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
const fp = require('fastify-plugin')
const getModelByAlias = require('./get-model-by-alias')
const doBuild = require('./build.js')
const buildInterceptor = require('../model/interceptor')
const extendTimestamp = require('../model/timestamp')
const extendExtra = require('../model/extra')
const extendByHookFile = require('../model/hook-file')
const instanceHook = require('./instance-hook')
// wrapper
const exec = require('./wrapper/exec')
const find = require('./wrapper/find')
const findOne = require('./wrapper/find-one')
const findById = require('./wrapper/find-by-id')
const create = require('./wrapper/create')
const update = require('./wrapper/update')
const remove = require('./wrapper/remove')
const count = require('./wrapper/count')

module.exports = fp(async function (fastify, options) {
  const { _, aneka, bind, fastGlob } = fastify.ndut.helper
  const { requireDeep } = aneka
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
      'feature', 'ndut', 'disableAliasCall', 'file'])
    if (config.appMode === 'build') {
      opts.forceId = false
    }
    const mdl = builder.define(schema.name, props, opts)
    extendTimestamp(fastify, builder, mdl, schema)
    extendExtra(fastify, builder, mdl, schema)
    extendByHookFile(fastify, mdl, schema)
    mdl.attachTo(ds[schema.dataSource])
    model[schema.name] = mdl
  }

  instanceHook(fastify, ds, model)

  if (config.appMode === 'build') await doBuild(fastify, ds, model)

  const helper = bind(fastify, {
    getModelByAlias
  })

  const wrapper = bind(fastify, {
    exec, find, findOne, findById, create, update, remove, count
  })

  const interceptor = {}

  for (const n of config.nduts) {
    const files = await fastGlob(`${n.dir}/ndutDb/interceptor/*.js`)
    buildInterceptor(fastify, files, interceptor)
  }
  const files = await fastGlob(`${config.dir.base}/ndutDb/interceptor/*.js`)
  buildInterceptor(fastify, files, interceptor)

  const decorator = _.merge({
    ds,
    model,
    helper,
    interceptor
  }, wrapper)

  fastify.decorate('ndutDb', decorator)
})
