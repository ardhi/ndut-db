module.exports = async function () {
  const model = this.ndutDb.model
  const { _, aneka, fastGlob, importFrom, iterateNduts } = this.ndut.helper
  const { pascalCase } = aneka
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
    for (const r of records) {
      await model.DbLookup.create(r)
    }
  }

  await iterateNduts(async function (cfg) {
    const files = await fastGlob(`${cfg.dir}/ndutDb/lookup/*.{json,jsonl}`)
    const models = _.keys(model)
    for (const m of models) {
      for (const f of files) {
        const modelName = pascalCase(`${cfg.alias === 'app' ? '' : cfg.alias} ${path.parse(f).name}`)
        if (m === modelName) {
          await importFrom(f, handler, { handler: { model: modelName } })
        }
      }
    }
  })
}
