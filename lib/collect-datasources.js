const { sanitizeSqlite3, sanitizeMemory } = require('../model/sanitizer')

module.exports = async function () {
  const { _, getConfig, getNdutConfig, aneka } = this.ndut.helper
  const { findDuplicate } = aneka
  const config = getConfig()
  const options = getNdutConfig('ndut-db')
  let ds = _.cloneDeep(options.dataSources) || []
  if (_.isPlainObject(ds)) ds = [ds]
  ds.push({ name: 'memory', connector: 'memory' })
  let duplicates = findDuplicate(ds, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for data source '${humanJoin(duplicates)}'`)
  if (!_.find(ds, { name: 'default' }))
    throw new Error(`No 'default' data source found. You need to explicitly name one of your sources 'default'`)
  for (const conn of ds) {
    if (conn.connector.includes('sqlite')) sanitizeSqlite3.call(this, conn, config)
    else if (conn.connector.includes('memory')) sanitizeMemory.call(this, conn, config)
  }
  this.ndutDb.dataSources = ds
}
