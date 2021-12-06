const { fs, aneka, _, getNdutConfig } = require('ndut-helper')
const path = require('path')
const { requireBase, requireBaseDeep, findDuplicate, humanJoin } = aneka
const schemaTransformer = require('./schema-transformer')
const plugin = require('./plugin')
const { sanitizeSqlite3, sanitizeMemory } = require('./sanitizer')

module.exports = async function (fastify) {
  const { config } = fastify
  const options = getNdutConfig(fastify, 'ndut-db')
  options.dataDir = config.dir.data + '/ndutDb'
  for (const d of ['schema', 'fixture', 'dump', 'data']) {
    await fs.ensureDir(options.dataDir + '/' + d)
  }
  options.connections = []
  options.schemas = []

  // datasource connections
  options.connections = await requireBase(options.dataDir + '/connection', fastify)
  if (_.isPlainObject(options.connections)) options.connections = [options.connections]
  let duplicates = findDuplicate(options.connections, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for connection '${humanJoin(duplicates)}'`)
  if (!_.find(options.connections, { name: 'default' }))
    throw new Error(`No 'default' connection found. You need to explicitly name one of your database connections your 'default' connection`)
  for (const conn of options.connections) {
    if (conn.connector.includes('sqlite')) sanitizeSqlite3(conn, options)
    else if (conn.connector.includes('memory')) sanitizeMemory(conn, options)
  }

  // model schemas
  for (const n of config.nduts) {
    options.ndut = n
    let schemas = await requireBaseDeep(n.dir + '/ndutDb', schemaTransformer, { transformer: options })
    options.schemas = _.concat(options.schemas, schemas)
    schemas = await requireBaseDeep(n.dir + '/src/ndutDb', schemaTransformer, { transformer: options })
    options.schemas = _.concat(options.schemas, schemas)
    delete options.ndut
  }
  const schemas = await requireBaseDeep(options.dataDir + '/schema', schemaTransformer, { transformer: options })
  for (const s of schemas) {
    const idx = _.findIndex(options.schemas, { name: s.name })
    if (idx > -1) {
      const merged = _.merge(_.cloneDeep(options.schemas[idx]), _.omit(s, ['columns']))
      _.each(s.columns, c => {
        const col = _.find(merged.columns, { name: c.name })
        if (col) col = _.merge(col, _.omit(c, ['type']))
        else merged.columns.push(c)
      })
      options.schemas[idx] = merged
    } else options.schemas.push(s)
  }
  duplicates = findDuplicate(options.schemas, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for schema '${humanJoin(duplicates)}'`)

  return { plugin, options }
}
