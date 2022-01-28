const path = require('path')

module.exports = async function (model, schema) {
  const { _, fs, getNdutConfig, getConfig } = this.ndut.helper
  const config = getConfig()
  const cfg = getNdutConfig(schema.ndut)
  let file = `${cfg.dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
  if (fs.existsSync(file)) {
    const override = `${config.dir.base}/ndutDb/hook/override/${schema.name}.js`
    if (fs.existsSync(override)) file = override
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(this))
    })
  }
  file = `${config.dir.base}/ndutDb/hook/extend/${schema.name}.js`
  if (fs.existsSync(file)) {
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(this))
    })
  }
}
