const path = require('path')

module.exports = function (fastify, model, schema) {
  const { _, fs, getNdutConfig } = fastify.ndut.helper
  let fileOrg = `${getNdutConfig(fastify, 'ndut-db').dataDir}/hook/${schema.name}.js`
  let file = fileOrg
  if (schema.ndut) {
    file = `${getNdutConfig(fastify, schema.ndut).dir}/ndutDb/hook/${path.parse(schema.file).name}.js`
  }
  if (fs.existsSync(file)) {
    _.forOwn(require(file), (v, k) => {
      model.observe(k, v.bind(fastify))
    })
  }
  if (!schema.ndut && fs.existsSync(fileOrg)) {
    _.forOwn(require(fileOrg), (v, k) => {
      model.observe(k, v.bind(fastify))
    })
  }
}
