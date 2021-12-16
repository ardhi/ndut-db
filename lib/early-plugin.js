const { ModelBuilder, DataSource } = require('loopback-datasource-juggler')
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

const customSchemaKeys = ['alias', 'ndut', 'expose', 'feature', 'override', 'disableAliasCall', 'file']

module.exports = async function (fastify, options) {
  const { _, aneka, bindTo, fastGlob } = fastify.ndut.helper
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
    const opts = _.omit(schema, _.concat(['properties', 'acls', 'base', 'http', 'remoting'], customSchemaKeys))
    if (config.appMode === 'build') {
      opts.forceId = false
    }
    const mdl = builder.define(schema.name, props, opts)
    extendTimestamp.call(fastify, builder, mdl, schema)
    extendExtra.call(fastify, builder, mdl, schema)
    extendByHookFile.call(fastify, mdl, schema)
    mdl.attachTo(ds[schema.dataSource])
    model[schema.name] = mdl
  }
  instanceHook.call(fastify, ds, model)

  if (config.appMode === 'build') await doBuild.call(fastify, ds, model)

  const fixture = _.map(options.schemas, s => ({ name: s.alias }))
  await model.DbModel.create(fixture)

  const wrapper = bindTo(fastify, {
    exec, find, findOne, findById, create, update, remove, count
  })

  const interceptor = {}

  for (const n of config.nduts) {
    const files = await fastGlob(`${n.dir}/ndutDb/interceptor/*.js`)
    buildInterceptor.call(fastify, files, interceptor)
  }
  const files = await fastGlob(`${config.dir.base}/ndutDb/interceptor/*.js`)
  buildInterceptor.call(fastify, files, interceptor)

  const decorator = _.merge({
    ds,
    customSchemaKeys,
    model,
    interceptor
  }, wrapper)

  fastify.decorate('ndutDb', decorator)
}
