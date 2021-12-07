const { fs, aneka, _, getNdutConfig } = require('ndut-helper')
const path = require('path')
const { requireBase, requireBaseDeep, findDuplicate, humanJoin } = aneka
const transformer = require('./model/transformer')
const plugin = require('./plugin')
const { sanitizeSqlite3, sanitizeMemory } = require('./model/sanitizer')

module.exports = async function (fastify) {
  const { config } = fastify
  const options = getNdutConfig(fastify, 'ndut-db')
  options.dataDir = config.dir.data + '/ndutDb'
  for (const d of ['schema', 'fixture', 'dump', 'data']) {
    await fs.ensureDir(options.dataDir + '/' + d)
  }
  options.dataSources = []
  options.schemas = []

  // datasource dataSources
  options.dataSources = await requireBase(options.dataDir + '/datasource', fastify)
  if (_.isPlainObject(options.dataSources)) options.dataSources = [options.dataSources]
  let duplicates = findDuplicate(options.dataSources, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for data source '${humanJoin(duplicates)}'`)
  if (!_.find(options.dataSources, { name: 'default' }))
    throw new Error(`No 'default' data source found. You need to explicitly name one of your sources 'default'`)
  for (const conn of options.dataSources) {
    if (conn.connector.includes('sqlite')) sanitizeSqlite3(conn, options)
    else if (conn.connector.includes('memory')) sanitizeMemory(conn, options)
  }

  // model schemas
  for (const n of config.nduts) {
    options.ndut = n
    let schemas = await requireBaseDeep(n.dir + '/ndutDb', transformer, { transformer: options })
    options.schemas = _.concat(options.schemas, schemas)
    schemas = await requireBaseDeep(n.dir + '/src/ndutDb', transformer, { transformer: options })
    options.schemas = _.concat(options.schemas, schemas)
    delete options.ndut
  }
  const schemas = await requireBaseDeep(options.dataDir + '/schema', transformer, { transformer: options })
  for (const s of schemas) {
    const idx = _.findIndex(options.schemas, { name: s.name })
    if (idx > -1) {
      /*
      const merged = _.merge(_.cloneDeep(options.schemas[idx]), _.omit(s, ['columns']))
      _.each(s.columns, c => {
        const col = _.find(merged.columns, { name: c.name })
        if (col) col = _.merge(col, _.omit(c, ['type']))
        else merged.columns.push(c)
      })
      */
      options.schemas[idx] = _.merge(_.cloneDeep(options.schemas[idx]), s)
    } else options.schemas.push(s)
  }
  duplicates = findDuplicate(options.schemas, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for schema '${humanJoin(duplicates)}'`)

  return { plugin, options }
}
