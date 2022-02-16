const path = require('path')

module.exports = async function (model, schema) {
  const { _, fs, getNdutConfig } = this.ndut.helper
  const appCfg = getNdutConfig('app')
  const cfg = getNdutConfig(schema.ndut)
  let file = `${cfg.dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
  if (fs.existsSync(file)) {
    const override = `${appCfg.dir}/ndutDb/hook/override/${schema.name}.js`
    if (fs.existsSync(override)) file = override
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(this))
    })
  }
  file = `${appCfg.dir}/ndutDb/hook/extend/${schema.name}.js`
  if (fs.existsSync(file)) {
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(this))
    })
  }
}
