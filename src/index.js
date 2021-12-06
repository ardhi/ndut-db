const { fs, aneka, _, fp } = require('ndut-helper')
const path = require('path')
const { requireBase, requireBaseDeep, fatal, findDuplicate, humanJoin, requireDeep,
  pascalCase } = aneka

const sanitizeFile = (conn, config, ext) => {
  if (!conn.file) conn.file = `${conn.name}.${ext}`
  if (!path.isAbsolute(conn.file)) {
    const parts = path.parse(conn.file)
    conn.file = `${config.dataDir}/data/${parts.base}`
  }
  if (_.isEmpty(path.parse(conn.file).ext)) conn.file += `.${ext}`
}

const sanitizeMemory = (conn, config) => {
  sanitizeFile(conn, config, 'json')
}

const sanitizeSqlite3 = (conn, config) => {
  sanitizeFile(conn, config, 'sqlite3')
}

const schemaTransformer = (file, schema, options = {}) => {
  schema.name = pascalCase(path.parse(file).name)
  schema.alias = schema.alias || _.kebabCase(schema.name)
  const db = _.find(options.connections, { name: schema.connection })
  if (!db) throw new Error(`Invalid connection "${schema.connection}" in schema "${schema.name}"`)
  // TODO: validate columns
  return schema
}

const plugin = fp(async (fastify, options) => {
  const { config } = fastify
  const MB = require('loopback-datasource-juggler').ModelBuilder
  const DS = require('loopback-datasource-juggler').DataSource

  const builder = new MB()
  const ds = {}
  const model = {}

  for (const db of options.connections) {
    fastify.log.debug(`+ Datasource "${db.name}"`)
    if (db.connector === 'memory') ds[db.name] = new DS(db)
    else {
      const name = db.connector
      db.connector = requireDeep(db.connector)
      ds[db.name] = new DS(db)
      db.connector = name
    }
  }

  for (const schema of options.schemas) {
    fastify.log.debug(`+ Model "${schema.name}" on "${schema.connection}"`)
    const def = _.reduce(schema.columns, (o, c) => {
      o[c.name] =  _.omit(c, ['name'])
      return o
    }, {})
    model[schema.name] = builder.define(schema.name, def, { forceId: false })
    model[schema.name].attachTo(ds[schema.connection])
  }

  if (config.mode === 'build') await require('./build.js')(fastify, ds, model)

  const helper = {
    getModelByAlias: require('./lib/get-model-by-alias'),
    formatRest: require('./lib/format-rest')
  }
  fastify.decorate('ndutDb', { ds, model, helper })
})

module.exports = async function (fastify) {
  const { config } = fastify
  const ndutConfig = config.nduts[_.findIndex(config.nduts, { name: 'ndut-db' })]
  ndutConfig.dataDir = config.dir.data + '/ndutDb'
  for (const d of ['schema', 'fixture', 'dump', 'data']) {
    await fs.ensureDir(ndutConfig.dataDir + '/' + d)
  }
  ndutConfig.connections = []
  ndutConfig.schemas = []

  try {
    ndutConfig.connections = await requireBase(ndutConfig.dataDir + '/connection', fastify)
    if (_.isPlainObject(ndutConfig.connections)) ndutConfig.connections = [ndutConfig.connections]
    const duplicates = findDuplicate(ndutConfig.connections, 'name')
    if (duplicates.length > 0) throw new Error(`Duplicate found for connection "${humanJoin(duplicates)}"`)
    for (const conn of ndutConfig.connections) {
      if (conn.connector.includes('sqlite')) sanitizeSqlite3(conn, ndutConfig)
      else if (conn.connector.includes('memory')) sanitizeMemory(conn, ndutConfig)
    }
  } catch (err) {
    fatal(err)
  }
  try {
    ndutConfig.schemas = await requireBaseDeep(ndutConfig.dataDir + '/schema', schemaTransformer, { transformer: ndutConfig })
    const duplicates = findDuplicate(ndutConfig.schemas, 'name')
    if (duplicates.length > 0) throw new Error(`Duplicate found for schema "${humanJoin(duplicates)}"`)
  } catch (err) {
    fatal(err)
  }

  return { plugin, options: ndutConfig }
}
