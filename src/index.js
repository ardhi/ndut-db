const { fs, aneka, _, fp } = require('ndut-helper')
const path = require('path')
const { requireBase, requireBaseDeep, fatal, findDuplicate, humanJoin, requireDeep,
  pascalCase } = aneka

const sanitizeFile = (conn, config, ext) => {
  if (!conn.file) conn.file = `${conn.name}.${ext}`
  if (!path.isAbsolute(conn.file)) {
    const parts = path.parse(conn.file)
    conn.file = `${config.dir.db}/data/${parts.base}`
  }
  if (_.isEmpty(path.parse(conn.file).ext)) conn.file += `.${ext}`
}

const sanitizeMemory = (conn, config) => {
  sanitizeFile(conn, config, 'json')
}

const sanitizeSqlite3 = (conn, config) => {
  sanitizeFile(conn, config, 'sqlite3')
}

const schemaTransformer = (file, schema, config = {}) => {
  schema.name = pascalCase(path.parse(file).name)
  const db = _.find(config.db.connections, { name: schema.connection })
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

  for (const db of config.db.connections) {
    fastify.log.debug(`+ Datasource "${db.name}"`)
    if (db.connector === 'memory') ds[db.name] = new DS(db)
    else {
      const name = db.connector
      db.connector = requireDeep(db.connector)
      ds[db.name] = new DS(db)
      db.connector = name
    }
  }

  for (const schema of config.db.schemas) {
    fastify.log.debug(`+ Model "${schema.name}" on "${schema.connection}"`)
    const def = _.reduce(schema.columns, (o, c) => {
      o[c.name] =  _.omit(c, ['name'])
      return o
    }, {})
    model[schema.name] = builder.define(schema.name, def, { forceId: false })
    model[schema.name].attachTo(ds[schema.connection])
  }

  if (config.mode === 'build') await require('./build.js')(fastify, ds, model)

  fastify.decorate('datasource', ds)
  fastify.decorate('model', model)
})

module.exports = async function (fastify) {
  fastify.log.info('Initialize "ndut-db"')
  const { config } = fastify
  config.dir.db = config.dir.data + '/db'
  for (const d of ['schema', 'fixture', 'dump', 'data']) {
    await fs.ensureDir(config.dir.db + '/' + d)
  }
  config.db = {
    connections: [],
    schemas: []
  }

  try {
    config.db.connections = await requireBase(config.dir.db + '/connection', fastify)
    if (_.isPlainObject(config.db.connections)) config.db.connections = [config.db.connections]
    const duplicates = findDuplicate(config.db.connections, 'name')
    if (duplicates.length > 0) throw new Error(`Duplicate found for connection "${humanJoin(duplicates)}"`)
    for (const conn of config.db.connections) {
      if (conn.connector.includes('sqlite')) sanitizeSqlite3(conn, config)
      else if (conn.connector.includes('memory')) sanitizeMemory(conn, config)
    }
  } catch (err) {
    fatal(err)
  }
  try {
    config.db.schemas = await requireBaseDeep(config.dir.db + '/schema', schemaTransformer, { transformer: config })
    const duplicates = findDuplicate(config.db.schemas, 'name')
    if (duplicates.length > 0) throw new Error(`Duplicate found for schema "${humanJoin(duplicates)}"`)
  } catch (err) {
    fatal(err)
  }

  return { plugin }
}
