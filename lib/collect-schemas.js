let transformer = require('../model/transformer')

module.exports = async function (options) {
  transformer = transformer.bind(this)
  const { aneka, _, getNdutConfig, iterateNduts } = this.ndut.helper
  const { requireBaseDeep, findDuplicate, humanJoin } = aneka
  const appCfg = getNdutConfig('app')
  let allSchemas = []
  await iterateNduts(async function (cfg) {
    const opts = { ndut: cfg, nullOnBuild: options.nullOnBuild }
    const schemas = await requireBaseDeep(cfg.dir + '/ndutDb/schema', transformer, { transformer: opts, scope: this })
    allSchemas = _.concat(allSchemas, schemas)
  })

  // extending
  const schemas = await requireBaseDeep(appCfg.dir + '/ndutDb/schema/extend', transformer, { transformer: { extend: true } })
  for (const s of schemas) {
    const idx = _.findIndex(allSchemas, { name: s.name })
    if (idx > -1) {
      if (_.get(allSchemas[idx], 'extend.schema') === false) {
        // do nothing !!!
      } else {
        allSchemas[idx] = _.merge(_.cloneDeep(allSchemas[idx]), _.omit(s, ['file']))
      }
    }
  }
  duplicates = findDuplicate(allSchemas, 'name')
  if (duplicates.length > 0) throw new Error(`Duplicate found for schema '${humanJoin(duplicates)}'`)
  this.ndutDb.schemas = allSchemas
}
