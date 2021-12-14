const path = require('path')

module.exports = function (fastify, model, schema) {
  const { config } = fastify
  const { _, fs, getNdutConfig } = fastify.ndut.helper
  if (schema.ndut) {
    const file = `${getNdutConfig(fastify, schema.ndut).dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
    if (fs.existsSync(file)) {
      _.forOwn(require(file), (v, k) => {
        model.observe(k, v.bind(fastify))
      })
    }
  }
  const file = `${config.dir.base}/ndutDb/hook/${schema.name}.js`
  if (fs.existsSync(file)) {
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(fastify))
    })
  }
}
