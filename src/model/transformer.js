const { _, aneka } = require('ndut-helper')
const { pascalCase } = aneka
const path = require('path')

module.exports = function (file, schema, options = {}) {
  if (options.ndut) {
    schema.name = pascalCase(options.ndut.prefix + ' ' + path.parse(file).name)
    schema.alias = _.kebabCase(schema.name)
    schema.dataSource = 'default'
  } else {
    schema.name = pascalCase(path.parse(file).name)
    schema.alias = schema.alias || _.kebabCase(schema.name)
    schema.dataSource = schema.dataSource || 'default'
  }
  const db = _.find(options.dataSources, { name: schema.dataSource })
  if (!db) throw new Error(`Invalid data source '${schema.dataSource}' in schema '${schema.name}'`)
  // TODO: validate columns
  return schema
}
