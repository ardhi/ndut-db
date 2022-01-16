module.exports = async function (alias = '', returnModel) {
  const { getSchemaByAlias } = this.ndutDb.helper
  const schema = await getSchemaByAlias(alias)
  if (schema.disableAliasCall) throw new Error(`Call by alias '${alias}' is disabled`)
  if (returnModel) return this.ndutDb.model[schema.name]
  return schema.name
}
