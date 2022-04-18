module.exports = async function (name, noThrow) {
  const { _ } = this.ndut.helper
  const { schemas } = this.ndutDb
  const schema = _.find(schemas, { name })
  if (!schema && !noThrow) throw this.Boom.notFound(`invalid/unknown model '${name}'`)
  return schema
}
