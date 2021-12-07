const { aneka, _, importFixture, fastGlob, getNdutConfig } = require('ndut-helper')
const { fatal } = aneka
const path = require('path')

const handler = async (records = [], { model }) => {
  // TODO: transaction, maybe?
  try {
    await model.create(records)
  } catch (err) {
    fatal(err)
  }
}

module.exports = async function (fastify, ds, model) {
  const { config } = fastify
  if (_.isEmpty(config.args)) fatal('You need to provide model(s) as argument(s) first')
  fastify.log.info('Build process started')
  const migration = {}
  const modelNames = Object.keys(model)
  const models = config.args.includes('*') ? modelNames : config.args
  const dbConfig = getNdutConfig(fastify, 'ndut-db')
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
    fastify.log.debug(`+ Rebuild database '${id}' on ${migration[id].length} model(s)`)
    await ds[id].automigrate(_.map(migration[id], 'name'))
    // do we have ndut's fixture?
    for (const m of migration[id]) {
      if (!m.ndut) continue
      const nc = getNdutConfig(fastify, m.ndut)
      const base = m.alias.slice(nc.prefix.length + 1)
      files = await fastGlob(`${nc.dir}/ndutDb/fixture/${base}.{json,jsonl}`)
      for (const f of files) {
        await importFixture(f, handler, { handler: { model: model[m.name] } })
        fastify.log.debug(`+ Builtin fixture '${path.basename(f)}' loaded successfully`)
      }
    }
    for (const m of migration[id]) {
      const files = await fastGlob(`${dbConfig.dataDir}/fixture/${m.name}.{json,jsonl}`)
      for (const f of files) {
        if (m.overrideBuiltinFixture) await model[m.name].remove()
        await importFixture(f, handler, { handler: { model: model[m.name] } })
        fastify.log.debug(`+ Fixture '${m.name}${path.extname(f)}' loaded successfully`)
      }
    }
  }
  fastify.log.info('Build process completed')
  process.exit()
}
