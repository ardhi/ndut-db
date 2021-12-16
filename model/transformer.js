const path = require('path')

module.exports = function (file, schema, options = {}) {
  const { _, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  if (options.ndut) {
    schema.name = pascalCase(options.ndut.prefix + ' ' + path.parse(file).name)
    schema.alias = _.kebabCase(schema.name)
    schema.ndut = options.ndut.name
  } else {
    schema.name = pascalCase(path.parse(file).name)
    schema.alias = schema.alias || _.kebabCase(schema.name)
  }
  schema.dataSource = schema.dataSource || 'default'
  schema.file = file
  schema.expose = schema.expose || { list: true, get: true, create: true, update: true, remove: true }
  const db = _.find(options.dataSources, { name: schema.dataSource })
  if (!db) throw new Error(`Invalid data source '${schema.dataSource}' in schema '${schema.name}'`)
  // TODO: validate columns
  return schema
}
