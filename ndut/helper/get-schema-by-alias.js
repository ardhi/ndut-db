module.exports = async function (alias) {
  const { _ } = this.ndut.helper
  const { schemas } = this.ndutDb
  const schema = _.find(schemas, { alias })
  if (!schema) throw new Error(`invalid/unknown model alias '${alias}'`)
  return schema
}
