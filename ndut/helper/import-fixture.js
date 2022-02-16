const path = require('path')

const handler = async (records = [], { model, fatal }) => {
  // TODO: transaction, maybe?
  try {
    await model.create(records)
  } catch (err) {
    fatal(err)
  }
}

module.exports = async function (model, silent) {
  const { _, fastGlob, getNdutConfig, aneka, importFrom } = this.ndut.helper
  const { fatal } = aneka
  const { getSchemaByName } = this.ndutDb.helper
  const schema = await getSchemaByName(model)
  const appCfg = getNdutConfig('app')
  const cfg = getNdutConfig(schema.ndut)
  const models = this.ndutDb.model
  let base = schema.alias
  if (cfg.alias !== 'app') base = schema.alias.slice(cfg.alias.length + 1)
  // builtin
  let files = await fastGlob(`${cfg.dir}/ndutDb/fixture/${base}.{json,jsonl}`)
  let overridden = false
  for (let f of files) {
    const overrides = await fastGlob(`${appCfg.dir}/ndutDb/fixture/override/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
    if (overrides.length > 0) {
      f = overrides[0]
      overridden = true
    }
    await importFrom(f, handler, { handler: { model: models[model], fatal } })
    if (!silent) this.log.debug(`* Builtin fixture '${path.basename(f)}' loaded successfully`)
  }
  if (overridden) return
  // additional
  files = await fastGlob(`${appCfg.dir}/ndutDb/fixture/extend/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
  for (const f of files) {
    await importFrom(f, handler, { handler: { model: models[model], fatal } })
    if (!silent) this.log.debug(`* Fixture '${path.basename(f)}' loaded successfully`)
  }
}
