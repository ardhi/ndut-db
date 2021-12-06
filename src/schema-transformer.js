const { _, aneka } = require('ndut-helper')
const { pascalCase } = aneka
const path = require('path')

module.exports = function (file, schema, options = {}) {
  if (options.ndut) {
    schema.name = pascalCase(options.ndut.prefix + ' ' + path.parse(file).name)
    schema.alias = _.kebabCase(schema.name)
    schema.connection = 'default'
  } else {
    schema.name = pascalCase(path.parse(file).name)
    schema.alias = schema.alias || _.kebabCase(schema.name)
    schema.connection = schema.connection || 'default'
  }
  const db = _.find(options.connections, { name: schema.connection })
  if (!db) throw new Error(`Invalid connection '${schema.connection}' in schema '${schema.name}'`)
  // TODO: validate columns
  return schema
}
