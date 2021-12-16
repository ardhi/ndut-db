module.exports = {
  schema: {
    description: 'Get model\'s schema',
    tags: ['DB'],
    params: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Model ID'
        }
      }
    }
  },
  handler: async function (request, reply) {
    const { _, aneka } = this.ndut.helper
    const { isSet } = aneka
    const { getSchemaByAlias } = this.ndutDb.helper
    const schema = getSchemaByAlias(request.params.model)
    if (!(schema.expose.list || schema.expose.get)) throw this.Boom.notFound('Resource not found')
    const model = this.ndutDb.model[schema.name]
    const columns = []
    _.forOwn(model.definition.properties, (v, k) => {
      if ((schema.hiddenProperties || []).includes(k) || ['deletedAt'].includes(k)) return
      const item = { name: k }
      item.type = (_.isString(v.type) ? v.type : v.type.name).toLowerCase()
      item.length = v.length || null
      item.precision = isSet(v.precision) ? v.precision : null
      item.scale = isSet(v.scale) ? v.scale : null
      item.required = !!v.required
      item.id = !!v.id
      columns.push(item)
    })

    return {
      data: {
        name: schema.alias,
        columns
      }
    }
  }
}
