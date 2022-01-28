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
  const { aneka, _, importDataFile, fastGlob, getNdutConfig, getConfig, outmatch, ask, fs } = this.ndut.helper
  const { fatal, isSet, parseBool, print, humanJoin } = aneka
  const { schemas } = this.ndutDb
  const config = getConfig()
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
    let extendBuiltinFixture = _.get(schema, 'extend.builtinFixture')
    if (!isSet(extendBuiltinFixture)) extendBuiltinFixture = true
    migration[schema.dataSource].push({
      name: m,
      alias: schema.alias,
      ndut: schema.ndut,
      extendBuiltinFixture
    })
  })
  for (const id of Object.keys(migration)) {
    this.log.debug(`* Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(_.map(migration[id], 'name'))
    // do we have ndut's fixture?
    for (const m of migration[id]) {
      const nc = getNdutConfig(m.ndut)
      const base = m.alias.slice(nc.alias.length + 1)
      // builtin
      let files = await fastGlob(`${nc.dir}/ndutDb/fixture/${base}.{json,jsonl}`)
      for (let f of files) {
        const overrides = await fastGlob(`${config.dir.base}/ndutDb/fixture/override/${m.name}.{json,jsonl}`)
        if (overrides.length > 0) f = overrides[0]
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`* Builtin fixture '${path.basename(f)}' loaded successfully`)
      }
      // additional
      files = await fastGlob(`${config.dir.base}/ndutDb/fixture/extend/${m.name}.{json,jsonl}`)
      for (const f of files) {
        await importDataFile(f, handler, { handler: { model: model[m.name], fatal } })
        this.log.debug(`* Fixture '${path.basename(f)}' loaded successfully`)
      }
    }
  }
  this.log.info('Build process completed')
  process.exit()
}
