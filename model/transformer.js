const path = require('path')

module.exports = function (file, schema, options = {}) {
  const { _, aneka } = this.ndut.helper
  const { pascalCase } = aneka
  const { dataSources } = this.ndutDb
  if (options.ndut) {
    const prefix = options.ndut.alias === 'app' ? '' : options.ndut.alias
    schema.name = pascalCase(prefix + ' ' + path.parse(file).name)
    schema.alias = _.kebabCase(schema.name)
    schema.ndut = options.ndut.name
  } else {
    schema.name = pascalCase(path.parse(file).name)
    schema.alias = schema.alias || _.kebabCase(schema.name)
  }
  _.forOwn(schema.properties, (v, k) => {
    if (_.isString(v)) v = { type: v }
    if (_.isString(v.type) && v.type.toLowerCase() === 'integer') {
      v.type = Number
      v.scale = 0
    }
    if (_.isString(v.type) && v.type.toLowerCase() === 'double') {
      v.type = Number
      if (v.scale === 0) delete v.scale
    }
    schema.properties[k] = v
    if (v.id) return
    if (options.nullOnBuild) delete schema.properties[k].required
  })
  schema.dataSource = schema.dataSource || 'default'
  schema.file = file
  schema.feature = schema.feature || {}
  if (_.isArray(schema.feature)) {
    const feats = {}
    _.each(schema.feature, f => {
      if (_.isString(f)) feats[f] = true
      else if (_.isPlainObject(f) && f.name) feats[f.name] = f.options || true
    })
    schema.feature = feats
  }
  schema.properties = schema.properties || {}
  if (!schema.properties.id && !schema.feature.stringId) schema.feature.stringId = true
  if (options.extend) schema.fileExtend = file
  schema.expose = schema.expose || { list: true, get: true, create: true, update: true, remove: true }
  const db = _.find(dataSources, { name: schema.dataSource })
  if (!db) throw new Error(`Invalid data source '${schema.dataSource}' in schema '${schema.name}'`)
  // TODO: validate columns
  return schema
}
