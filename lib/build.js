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
  const { aneka, _, importDataFile, fastGlob, getNdutConfig, getConfig, outmatch, ask } = this.ndut.helper
  const { fatal, isSet, parseBool, print, humanJoin } = aneka
  const { schemas } = this.ndutDb
  const config = await getConfig()
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  this.log.info('Build process started')
  const migration = {}
  const modelNames = Object.keys(model)
  // const models = config.args.includes('*') ? modelNames : config.args
  const isMatch = outmatch(config.args)
  const models = modelNames.filter(isMatch)
  if (models.length === 0) print('No model matched', true)
  const text = 'The following model will be rebuild: '
  if (models.length < 4) {
    this.log.info(text + humanJoin(models))
  } else {
    this.log.info(text)
    _.each(models, m => {
      this.log.info(`* ${m}`)
    })
  }
  let answer = ''
  while (!['y', 'n', 'yes', 'no'].includes(answer)) {
    answer = await ask('Are you sure to continue? This process can\'t be canceled: y/n ? ')
    answer = answer.toLowerCase()
  }
  if (['n', 'no'].includes(answer)) print('Model building canceled', true)
  _.each(models, m => {
    const schema = _.find(schemas, { name: m })
    if (!schema) fatal(`Invalid/unknown model '${m}'`)
    if (!migration[schema.dataSource]) migration[schema.dataSource] = []
    let overrideBuiltinFixture = _.get(schema, 'override.builtinFixture')
    if (!isSet(overrideBuiltinFixture)) overrideBuiltinFixture = true
    if (_.has(config.argv, 'override-fixture')) overrideBuiltinFixture = parseBool(config.argv['override-fixture'])
    migration[schema.dataSource].push({
      name: m,
      alias: schema.alias,
      ndut: schema.ndut,
      overrideBuiltinFixture
    })
  })
  for (const id of Object.keys(migration)) {
    this.log.debug(`* Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(_.map(migration[id], 'name'))
    // do we have ndut's fixture?
    for (const m of migration[id]) {
      if (!m.ndut) continue
      const nc = await getNdutConfig(m.ndut)
      const base = m.alias.slice(nc.alias.length + 1)
      const files = await fastGlob(`${nc.dir}/ndutDb/fixture/${base}.{json,jsonl}`)
      for (const f of files) {
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`* Builtin fixture '${path.basename(f)}' loaded successfully`)
      }
    }
    for (const m of migration[id]) {
      const files = await fastGlob(`${config.dir.base}/ndutDb/fixture/${m.name}.{json,jsonl}`)
      for (const f of files) {
        if (m.overrideBuiltinFixture) await model[m.name].remove()
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`* Fixture '${m.name}${path.extname(f)}' loaded successfully`)
      }
    }
  }
  this.log.info('Build process completed')
  process.exit()
}
