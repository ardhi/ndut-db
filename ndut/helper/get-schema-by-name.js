module.exports = function (name) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = getNdutConfig('ndut-db')
  const schema = _.find(config.schemas, { name })
  if (!schema) throw new Error(`invalid/unknown model '${name}'`)
  return schema
}
