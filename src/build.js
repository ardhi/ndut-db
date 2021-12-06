const { aneka, _, importFixture, fastGlob } = require('ndut-helper')
const { fatal } = aneka

const handler = async (records = [], { model }) => {
  /*
  const tx = await model.beginTransaction()
  await model.create(records, { transaction: tx })
  await tx.commit()
  */
  await model.create(records)
}

module.exports = async function (fastify, ds, model) {
  const { config } = fastify
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  fastify.log.info('Build process started')
  const migration = {}
  const modelNames = Object.keys(model)
  const models = config.args.includes('*') ? modelNames : config.args
  const ndutConfig = config.nduts[_.findIndex(config.nduts, { name: 'ndut-db' })] || {}
  _.each(models, m => {
    const schema = _.find(ndutConfig.schemas, { name: m })
    if (!schema) fatal(`Invalid/unknown model '${m}'`)
    if (!migration[schema.connection]) migration[schema.connection] = []
    migration[schema.connection].push(m)
  })
  try {
    for (const m of Object.keys(migration)) {
      fastify.log.debug(`+ Rebuild database '${m}' on ${migration[m].length} model(s)`)
      await ds[m].automigrate(migration[m])
      for (const name of migration[m]) {
        const files = await fastGlob(ndutConfig.dataDir + `/fixture/${name}.{json,jsonl}`)
        if (files.length === 0) {
          fastify.log.debug(`- No fixture found for '${name}' - skipped!`)
        } else if (files.length > 1) {
          fastify.log.debug(`- Fixture '${name}.{json,jsonl}' must be unique - skipped!`)
        } else {
          await importFixture(files[0], handler, { handler: { model: model[name] } })
          fastify.log.debug(`+ Fixture '${name}' loaded successfully`)
        }
      }
    }
  } catch (err) {
    fatal(err)
  }
  fastify.log.info('Build process completed')
  process.exit()
}
