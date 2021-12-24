module.exports = async function (model, options) {
  const { _, aneka } = this.ndut.helper
  const { requireBase } = aneka
  const { config } = this

  const fixture = _.map(options.schemas, s => ({ name: s.alias }))
  await model.DbModel.create(fixture)

  for (const n of config.nduts) {
    try {
      let lookup = await requireBase(n.dir + '/ndutDb/lookup', this)
      lookup = _.map(lookup, l => {
        if (!l.name) l.name = _.startCase(l.value.toLowerCase())
        l.ndut = n.name
        return lookup
      })
      await model.DbLookup.create(lookup)
    } catch (err) {}
  }

  try {
    let lookup = await requireBase(`${config.dir.base}/ndutDb/lookup`, this)
    lookup = _.map(lookup, l => {
      if (!l.name) l.name = _.startCase(l.value.toLowerCase())
      return lookup
    })
    await model.DbLookup.create(lookup)
  } catch (err) {}
}
