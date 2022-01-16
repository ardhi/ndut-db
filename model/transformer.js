const path = require('path')

module.exports = function (file, schema, options = {}) {
  const { _, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  const { dataSources } = this.ndutDb
  if (options.ndut) {
    schema.name = pascalCase(options.ndut.alias + ' ' + path.parse(file).name)
    schema.alias = _.kebabCase(schema.name)
    schema.ndut = options.ndut.name
  } else {
    schema.name = pascalCase(path.parse(file).name)
    schema.alias = schema.alias || _.kebabCase(schema.name)
  }
  schema.dataSource = schema.dataSource || 'default'
  schema.file = file
  schema.expose = schema.expose || { list: true, get: true, create: true, update: true, remove: true }
  const db = _.find(dataSources, { name: schema.dataSource })
  if (!db) throw new Error(`Invalid data source '${schema.dataSource}' in schema '${schema.name}'`)
  // TODO: validate columns
  return schema
}
