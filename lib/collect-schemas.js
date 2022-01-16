let transformer = require('../model/transformer')

module.exports = async function () {
  transformer = transformer.bind(this)
  const { aneka, _, getNdutConfig, getConfig } = this.ndut.helper
  const { requireBaseDeep, findDuplicate, humanJoin } = aneka
  const config = await getConfig()
  let allSchemas = []
  // nduts schemas
  for (let n of config.nduts) {
    n = await getNdutConfig(n)
    if (n.name === 'app') continue
    const opts = { ndut: n }
    const schemas = await requireBaseDeep(n.dir + '/ndutDb/schema', transformer, { transformer: opts })
    allSchemas = _.concat(allSchemas, schemas)
  }

  // app schemas
  const schemas = await requireBaseDeep(config.dir.base + '/ndutDb/schema', transformer)
  for (const s of schemas) {
    const idx = _.findIndex(allSchemas, { name: s.name })
    if (idx > -1) {
      if (_.get(allSchemas[idx], 'override.schema') === false) {
        // do nothing !!!
      } else {
        allSchemas[idx] = _.merge(_.cloneDeep(allSchemas[idx]), _.omit(s, ['file']))
      }
    } else allSchemas.push(s)
  }
  duplicates = findDuplicate(allSchemas, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for schema '${humanJoin(duplicates)}'`)
  this.ndutDb.schemas = allSchemas
}
