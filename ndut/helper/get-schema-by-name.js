module.exports = async function (name) {
  const { _ } = this.ndut.helper
  const { schemas } = this.ndutDb
  const schema = _.find(schemas, { name })
  if (!schema) throw new Error(`invalid/unknown model '${name}'`)
  return schema
}
