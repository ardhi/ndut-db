module.exports = async function (instance) {
  const { _ } = this.ndut.helper
  const { isUserSupportedModel, getSchemaByName } = this.ndutDb.helper
  const model = typeof instance === 'string' ? this.ndutDb.model[instance] : instance
  const userSupported = await isUserSupportedModel(model.name)
  const schema = await getSchemaByName(model.name)
  return userSupported && _.get(schema, 'feature.private')
}
