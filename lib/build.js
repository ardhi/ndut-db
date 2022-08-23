const path = require('path')

const handler = async (records = [], { model, fatal }) => {
  // TODO: transaction, maybe?
  try {
    await model.create(records)
  } catch (err) {
    fatal(err)
  }
}

module.exports = async function (options) {
  const ds = this.ndutDb.dataSourceInstance
  const model = this.ndutDb.model
  const { aneka, _, getConfig, iterateNduts, outmatch, ask, fs, dumpError } = this.ndut.helper
  const { fatal, print, humanJoin } = aneka
  const { schemas } = this.ndutDb
  const { importFixture, importSample } = this.ndutDb.helper
  const config = getConfig()
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  this.log.info('Build process started')
  const migration = {}
  const modelNames = Object.keys(model)
  // const models = config.args.includes('*') ? modelNames : config.args
  const isMatch = outmatch(config.args)
  const models = modelNames.filter(isMatch)
  if (models.length === 0) print('No model matched', true)
  let text = 'The following model will be rebuild'
  if (options.nullOnBuild) text += ' with "nullOnBuild"'
  if (options.noFixture) text += ' with "noFixture"'
  if (options.withSample) text += ' with "withSample"'
  this.log.info(`${text}: ${humanJoin(models)}${models.length < 4 ? '' : (' (' + models.length + ' models)')}`)
  let answer = ''
  while (!['y', 'n', 'yes', 'no'].includes(answer)) {
    answer = await ask('Are you sure to continue? This process can\'t be canceled: y/n ? ')
    answer = answer.toLowerCase()
  }
  if (['n', 'no'].includes(answer)) {
    if (options.continueAfterBuild) return
    print('Model building canceled', true)
  }
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
  await iterateNduts(async function (cfg) {
    const handlerFile = cfg.dir + '/ndutDb/builder/before-migration.js'
    if (fs.existsSync(handlerFile)) await require(handlerFile).call(this, migration, cfg)
  })
  for (const id of Object.keys(migration)) {
    this.log.debug(`* Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(migration[id])
  }
  await iterateNduts(async function (cfg) {
    const handlerFile = cfg.dir + '/ndutDb/builder/after-migration.js'
    if (fs.existsSync(handlerFile)) await require(handlerFile).call(this, migration, cfg)
  })
  for (const id of Object.keys(migration)) {
    for (const m of migration[id]) {
      try {
        if (!options.noFixture) await importFixture(m)
        if (options.withSample) await importSample(m)
      } catch (err) {
        if (config.argv.verbose) dumpError(err)
        else this.log.error(err.message)
        let answer = ''
        while (!['y', 'n', 'yes', 'no'].includes(answer)) {
          answer = await ask('Do you want to continue? y/n ')
          answer = answer.toLowerCase()
        }
        if (['n', 'no'].includes(answer)) print('Model building canceled', true)
      }
    }
  }
  if (options.continueAfterBuild) return
  this.log.info('Build process completed')
  process.exit()
}
