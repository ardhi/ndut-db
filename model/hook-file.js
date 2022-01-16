const path = require('path')

module.exports = async function (model, schema) {
  const { _, fs, getNdutConfig, getConfig } = this.ndut.helper
  const config = await getConfig()
  if (schema.ndut) {
    const cfg = await getNdutConfig(schema.ndut)
    const file = `${cfg.dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
    if (fs.existsSync(file)) {
      _.forOwn(require(file), (v, k) => {
        model.observe(k, v.bind(this))
      })
    }
  }
  const file = `${config.dir.base}/ndutDb/hook/${schema.name}.js`
  if (fs.existsSync(file)) {
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(this))
    })
  }
}
