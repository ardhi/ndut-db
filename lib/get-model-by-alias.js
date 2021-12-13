module.exports = function (alias = '', returnModel) {
  const { _ } = this.ndut.helper
  const { config, ndutDb } = this
  const ndutConfig = _.find(config.nduts, { name: 'ndut-db' })
  if (!ndutConfig) throw new Error(`"ndut-db" is disabled ?`)
  // find by alias
  const schema = _.find(ndutConfig.schemas, { alias })
  if (!schema) throw new Error(`invalid/unknown rest model alias '${alias}'`)
  if (schema.disableAliasCall) throw new Error(`Call by alias '${alias}' is disabled`)
  if (returnModel) return ndutDb.model[schema.name]
  return schema.name
}
