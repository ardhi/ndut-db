module.exports = async function (alias, strick) {
  const { _ } = this.ndut.helper
  const { schemas } = this.ndutDb
  const { getSchemaByName } = this.ndutDb.helper
  let schema = _.find(schemas, { alias })
  if (!schema && !strick) schema = await getSchemaByName(alias, true)
  if (!schema) throw this.Boom.notFound(`invalid/unknown model alias '${alias}'`)
  return schema
}
