const path = require('path')

const handler = async (records = [], { model, models, scope }) => {
  // TODO: transaction, maybe?
  for (const r of records) {
    if (scope.ndutApi) await scope.ndutApi.helper.create({ model, body: r })
    else await models[model].create(r)
  }
}

module.exports = async function (model, silent, dir = 'fixture') {
  const { _, fastGlob, getNdutConfig, aneka, importFrom } = this.ndut.helper
  const { getSchemaByName } = this.ndutDb.helper
  const schema = await getSchemaByName(model)
  const appCfg = getNdutConfig('app')
  const cfg = getNdutConfig(schema.ndut)
  const models = this.ndutDb.model
  let base = schema.alias
  if (cfg.alias !== 'app') base = schema.alias.slice(cfg.alias.length + 1)
  // builtin
  let files = await fastGlob(`${cfg.dir}/ndutDb/${dir}/${base}.{json,jsonl}`)
  let overridden = false
  for (let f of files) {
    const overrides = await fastGlob(`${appCfg.dir}/ndutDb/${dir}/override/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
    if (overrides.length > 0) {
      f = overrides[0]
      overridden = true
    }
    await importFrom(f, handler, { handler: { model, models, scope: this } })
    if (!silent) this.log.debug(`* Builtin ${dir} '${path.basename(f)}' loaded successfully`)
  }
  if (overridden) return
  // additional
  files = await fastGlob(`${appCfg.dir}/ndutDb/${dir}/extend/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
  for (const f of files) {
    await importFrom(f, handler, { handler: { model, models, scope: this } })
    if (!silent) this.log.debug(`* ${_.upperFirst(dir)} '${path.basename(f)}' loaded successfully`)
  }
}
