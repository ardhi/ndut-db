module.exports = async function () {
  const model = this.ndutDb.model
  const { _, aneka, fastGlob, importFrom, getConfig, getNdutConfig } = this.ndut.helper
  const { pascalCase } = aneka
  const config = getConfig()
  const path = require('path')
  const { schemas } = this.ndutDb

  const fixture = _.map(schemas, s => ({ name: s.alias }))
  await model.DbModel.create(fixture)

  const handler = async (records, opts) => {
    records = _.map(records, r => {
      if (!r.name) r.name = _.startCase(r.value.toLowerCase())
      r.model = opts.model
      return r
    })
    await model.DbLookup.create(records)
  }

  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const files = await fastGlob(`${cfg.dir}/ndutDb/lookup/*.{json,jsonl}`)
    const models = []
    _.forOwn(model, (v, k) => {
      if (k.startsWith(_.upperFirst(cfg.alias))) models.push(k)
    })
    for (const f of files) {
      const modelName = pascalCase(`${cfg.alias} ${path.parse(f).name}`)
      if (!models.includes(modelName)) continue
      await importFrom(f, handler, { handler: { model: modelName } })
    }
  }
}
