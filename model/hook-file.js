const path = require('path')

module.exports = function (model, schema) {
  const { config } = this
  const { _, fs, getNdutConfig } = this.ndut.helper
  if (schema.ndut) {
    const file = `${getNdutConfig(schema.ndut).dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
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
