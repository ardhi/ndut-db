const { _ } = require('ndut-helper')

module.exports = function (fastify, alias = '') {
  const { config, ndutDb } = fastify
  const ndutConfig = _.find(config.nduts, { name: 'ndut-db' })
  if (!ndutConfig) throw new Error(`"ndut-db" is disabled ?`)
  // find by alias
  const schema = _.find(ndutConfig.schemas, { alias })
  if (!schema) throw new Error(`invalid/unknown rest model alias '${alias}'`)
  if (schema.disableAliasCall) throw new Error(`Call by alias '${alias}' is disabled`)
  return ndutDb.model[schema.name]
}
