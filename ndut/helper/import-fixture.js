const path = require('path')

const handler = async (records = [], { model, models, transformer, scope }) => {
  const { _ } = scope.ndut.helper
  // TODO: transaction, maybe?
  let transAll
  let transRec
  if (transformer) {
    if (_.isFunction(transformer)) transAll = transformer
    else if (_.isPlainObject(transformer)) {
      transAll = _.get(transformer, 'all')
      transRec = _.get(transformer, 'record')
    }
  }
  if (transAll) records = await transAll.call(scope, { model, models, data: records })
  for (let r of records) {
    try {
      if (transRec) r = await transRec.call(scope, { model, models, data: records, record: r })
      if (scope.ndutApi) await scope.ndutApi.helper.create({ model, body: r })
      else await models[model].create(r)
    } catch (err) {
      console.log(r)
      throw err
    }
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
  let transformer
  try {
    transformer = require(`${cfg.dir}/ndutDb/transformer/${base}.js`)
  } catch (err) {}
  for (let f of files) {
    const overrides = await fastGlob(`${appCfg.dir}/ndutDb/${dir}/override/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
    if (overrides.length > 0) {
      f = overrides[0]
      overridden = true
    }
    await importFrom(f, handler, { handler: { model, models, transformer, scope: this } })
    if (!silent) this.log.debug(`* Builtin ${dir} '${path.basename(f)}' loaded successfully`)
  }
  if (overridden) return
  // additional
  files = await fastGlob(`${appCfg.dir}/ndutDb/${dir}/extend/{${model},${_.kebabCase(model)}}.{json,jsonl}`)
  for (const f of files) {
    await importFrom(f, handler, { handler: { model, models, transformer, scope: this } })
    if (!silent) this.log.debug(`* ${_.upperFirst(dir)} '${path.basename(f)}' loaded successfully`)
  }
}
