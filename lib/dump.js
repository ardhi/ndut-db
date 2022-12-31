module.exports = async function (options) {
  const ds = this.ndutDb.dataSourceInstance
  const model = this.ndutDb.model
  const { aneka, _, getConfig, outmatch, ask, fs, exportTo, dumpError } = this.ndut.helper
  const { fatal, print, humanJoin } = aneka
  const { schemas } = this.ndutDb
  const config = getConfig()
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  this.log.info('Dumping process started')
  const migration = {}
  const modelNames = Object.keys(model)
  // const models = config.args.includes('*') ? modelNames : config.args
  const isMatch = outmatch(config.args)
  let models = modelNames.filter(isMatch)
  if (models.length === 0) print('No model matched', true)
  let text = 'The following model(s) will be dumped'
  this.log.info(`${text}: ${humanJoin(models)}${models.length < 4 ? '' : (' (' + models.length + ' models)')}`)
  let answer = ''
  while (!['y', 'n', 'yes', 'no'].includes(answer)) {
    answer = await ask('Are you sure to continue? This process can\'t be canceled: y/n ? ')
    answer = answer.toLowerCase()
  }
  if (['n', 'no'].includes(answer)) {
    if (options.continueAfterBuild) return
    print('Model(s) dumping canceled', true)
  }
  const skipped = []
  _.each(models, m => {
    const schema = _.find(schemas, { name: m })
    if (!schema) fatal(`Invalid/unknown model '${m}'`)
    if (schema.dataSource === 'memory') {
      skipped.push(m)
      return
    }
    if (!migration[schema.dataSource]) migration[schema.dataSource] = []
    migration[schema.dataSource].push(m)
  })
  if (skipped.length > 0) this.log.info(`Skipped memory dataSource: ${humanJoin(skipped)}`)
  models = _.without(models, ...skipped)
  for (const id of Object.keys(migration)) {
    for (const m of migration[id]) {
      try {
        const data = await this.ndutApi.helper.dbCall({ model: m, method: 'find' })
        const dir = `${config.dir.data}/dump`
        fs.ensureDirSync(dir)
        const ext = options.jsonl ? 'jsonl' : 'json'
        const file = `${dir}/${_.kebabCase(m)}.${ext}`
        await exportTo(file, data)
        this.log.info(`* Dumping => ${m} (total: ${data.length})`)
      } catch (err) {
        if (config.argv.verbose) dumpError(err)
        else this.log.error(err.message)
        let answer = ''
        while (!['y', 'n', 'yes', 'no'].includes(answer)) {
          answer = await ask('Do you want to continue? y/n ')
          answer = answer.toLowerCase()
        }
        if (['n', 'no'].includes(answer)) print('Model(s) dumping canceled', true)
      }
    }
  }
  if (options.continueAfterBuild) return
  this.log.info('Dumping process completed')
  process.exit()
}
