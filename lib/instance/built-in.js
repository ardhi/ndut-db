module.exports = async function (model, options) {
  const { _, aneka, fastGlob, importDataFile } = this.ndut.helper
  const { pascalCase } = aneka
  const { config } = this
  const path = require('path')

  const fixture = _.map(options.schemas, s => ({ name: s.alias }))
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
    const files = await fastGlob(`${n.dir}/ndutDb/lookup/*.{json,jsonl}`)
    const models = []
    _.forOwn(model, (v, k) => {
      if (k.startsWith(_.upperFirst(n.prefix))) models.push(k)
    })
    for (const f of files) {
      const modelName = pascalCase(`${n.prefix} ${path.parse(f).name}`)
      if (!models.includes(modelName)) continue
      await importDataFile(f, handler, { handler: { model: modelName } })
    }
  }
  const files = await fastGlob(`${config.dir.base}/ndutDb/lookup/*.{json,jsonl}`)
  const models = _.keys(model)
  for (const f of files) {
    const modelName = pascalCase(path.parse(f).name)
    if (!models.includes(modelName)) continue
    await importDataFile(f, handler, { handler: { model: modelName } })
  }
}
