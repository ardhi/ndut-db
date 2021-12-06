const { _ } = require('ndut-helper')

module.exports = function (fastify, alias = '') {
  const { config, ndutDb, Boom } = fastify
  const ndutConfig = _.find(config.nduts, { name: 'ndut-db' })
  if (!ndutConfig) throw new Boom.Boom(`"ndut-db" is disabled ?`)
  // find by alias
  const schema = _.find(ndutConfig.schemas, { alias })
  if (!schema) throw new Boom.Boom(`invalid/unknown rest model alias "${alias}"`)
  return ndutDb.model[schema.name]
}
