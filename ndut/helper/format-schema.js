module.exports = function (schema, openApi, omittedColumns = []) {
  const { _, aneka } = this.ndut.helper
  const { isSet } = aneka
  const model = this.ndutDb.model[schema.name]
  const columns = []
  const kvOpenApi = {}
  const excludeColumns = _.without(_.concat(['siteId'], omittedColumns), null, undefined, '')
  _.forOwn(model.definition.properties, (v, k) => {
    if (excludeColumns.includes(k)) return
    if ((schema.hiddenProperties || []).includes(k) || ['deletedAt'].includes(k)) return
    const item = { name: k }
    item.type = (_.isString(v.type) ? v.type : v.type.name).toLowerCase()
    item.length = parseInt(v.length) || null
    item.precision = isSet(v.precision) ? v.precision : null
    item.scale = isSet(v.scale) ? v.scale : null
    item.required = !!v.required
    item.id = !!v.id
    columns.push(item)
    kvOpenApi[k] = {
      type: item.type
    }
    if (item.type === 'date') {
      kvOpenApi[k] = {
        type: 'string',
        format: 'date-time'
      }
    } else if (item.type === 'geopoint') {
      kvOpenApi[k] = { type: 'array' }
    } else if (item.type === 'json') {
      kvOpenApi[k] = { type: 'object' }
    } else if (item.type === 'string') {
      if (item.length) kvOpenApi[k].maxLength = item.length
      if (['email'].includes(k)) kvOpenApi[k].format = 'email'
    }
  })
  return openApi ? kvOpenApi : columns
}
