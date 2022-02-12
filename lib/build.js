const path = require('path')

const handler = async (records = [], { model, fatal }) => {
  // TODO: transaction, maybe?
  try {
    await model.create(records)
  } catch (err) {
    fatal(err)
  }
}

module.exports = async function () {
  const ds = this.ndutDb.dataSourceInstance
  const model = this.ndutDb.model
  const { aneka, _, importDataFile, fastGlob, getNdutConfig, getConfig, outmatch, ask, fs } = this.ndut.helper
  const { fatal, isSet, parseBool, print, humanJoin } = aneka
  const { schemas } = this.ndutDb
  const { importFixture } = this.ndutDb.helper
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
  const skipped = []
  _.each(models, m => {
    const schema = _.find(schemas, { name: m })
    if (!schema) fatal(`Invalid/unknown model '${m}'`)
    if (schema.dataSource === 'memory') {
      skipped.push(m)
      return
    }
    /*
    TODO: move this to schema builder
    let extendBuiltinFixture = _.get(schema, 'extend.builtinFixture')
    if (!isSet(extendBuiltinFixture)) extendBuiltinFixture = true
    */
    if (!migration[schema.dataSource]) migration[schema.dataSource] = []
    migration[schema.dataSource].push(m)
  })
  if (skipped.length > 0) this.log.info(`Skipped memory dataSource: ${humanJoin(skipped)}`)
  for (const id of Object.keys(migration)) {
    this.log.debug(`* Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(migration[id])
    for (const m of migration[id]) {
      await importFixture(m)
    }
  }
  this.log.info('Build process completed')
  process.exit()
}
