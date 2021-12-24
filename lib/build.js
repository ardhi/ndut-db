const path = require('path')

const handler = async (records = [], { model, fatal }) => {
  // TODO: transaction, maybe?
  try {
    await model.create(records)
  } catch (err) {
    fatal(err)
  }
}

module.exports = async function (ds, model) {
  const { aneka, _, importDataFile, fastGlob, getNdutConfig } = this.ndut.helper
  const { fatal } = aneka
  const { config } = this
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  this.log.info('Build process started')
  const migration = {}
  const modelNames = Object.keys(model)
  const models = config.args.includes('*') ? modelNames : config.args
  const dbConfig = getNdutConfig('ndut-db')
  _.each(models, m => {
    const schema = _.find(dbConfig.schemas, { name: m })
    if (!schema) fatal(`Invalid/unknown model '${m}'`)
    if (!migration[schema.dataSource]) migration[schema.dataSource] = []
    migration[schema.dataSource].push({
      name: m,
      alias: schema.alias,
      ndut: schema.ndut,
      overrideBuiltinFixture: _.get(schema, 'override.builtinFixture')
    })
  })
  for (const id of Object.keys(migration)) {
    this.log.debug(`+ Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(_.map(migration[id], 'name'))
    // do we have ndut's fixture?
    for (const m of migration[id]) {
      if (!m.ndut) continue
      const nc = getNdutConfig(m.ndut)
      const base = m.alias.slice(nc.prefix.length + 1)
      const files = await fastGlob(`${nc.dir}/ndutDb/fixture/${base}.{json,jsonl}`)
      for (const f of files) {
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`+ Builtin fixture '${path.basename(f)}' loaded successfully`)
      }
    }
    for (const m of migration[id]) {
      const files = await fastGlob(`${config.dir.base}/ndutDb/fixture/${m.name}.{json,jsonl}`)
      for (const f of files) {
        if (m.overrideBuiltinFixture) await model[m.name].remove()
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`+ Fixture '${m.name}${path.extname(f)}' loaded successfully`)
      }
    }
  }
  this.log.info('Build process completed')
  process.exit()
}
