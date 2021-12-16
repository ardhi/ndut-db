module.exports = function (alias) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = getNdutConfig('ndut-db')
  const schema = _.find(config.schemas, { alias })
  if (!schema) throw new Error(`invalid/unknown model alias '${alias}'`)
  return schema
}
