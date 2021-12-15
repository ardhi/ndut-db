let transformer = require('./model/transformer')
const { sanitizeSqlite3, sanitizeMemory } = require('./model/sanitizer')

module.exports = async function (fastify) {
  transformer = transformer.bind(fastify)
  const { fs, fp, aneka, _, getNdutConfig } = fastify.ndut.helper
  const { requireBase, requireBaseDeep, findDuplicate, humanJoin } = aneka
  const name = 'ndut-db'
  const { config } = fastify
  const options = getNdutConfig(fastify, 'ndut-db')
  options.dataDir = config.dir.data + '/ndutDb'
  for (const d of ['dump', 'data']) {
    await fs.ensureDir(options.dataDir + '/' + d)
  }
  options.dataSources = []
  options.schemas = []

  // datasource dataSources
  options.dataSources = await requireBase(config.dir.base + '/ndutDb/datasource', fastify)
  if (_.isPlainObject(options.dataSources)) options.dataSources = [options.dataSources]
  let duplicates = findDuplicate(options.dataSources, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for data source '${humanJoin(duplicates)}'`)
  if (!_.find(options.dataSources, { name: 'default' }))
    throw new Error(`No 'default' data source found. You need to explicitly name one of your sources 'default'`)
  for (const conn of options.dataSources) {
    if (conn.connector.includes('sqlite')) sanitizeSqlite3.call(fastify, conn, options)
    else if (conn.connector.includes('memory')) sanitizeMemory.call(fastify, conn, options)
  }

  // nduts schemas
  for (const n of config.nduts) {
    options.ndut = n
    const schemas = await requireBaseDeep(n.dir + '/ndutDb/schema', transformer, { transformer: options })
    options.schemas = _.concat(options.schemas, schemas)
    delete options.ndut
  }

  // app schemas
  const schemas = await requireBaseDeep(config.dir.base + '/ndutDb/schema', transformer, { transformer: options })
  for (const s of schemas) {
    const idx = _.findIndex(options.schemas, { name: s.name })
    if (idx > -1) {
      if (_.get(options.schemas[idx], 'override.schema') === false) {
        // do nothing !!!
      } else {
        options.schemas[idx] = _.merge(_.cloneDeep(options.schemas[idx]), _.omit(s, ['file']))
      }
    } else options.schemas.push(s)
  }
  duplicates = findDuplicate(options.schemas, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for schema '${humanJoin(duplicates)}'`)

  const earlyPlugin = fp(require('./lib/early-plugin'))

  return { name, earlyPlugin, options, appModes: ['serve', 'build'] }
}
