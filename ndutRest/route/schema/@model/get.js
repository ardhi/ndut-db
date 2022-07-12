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
    const { getSchemaByAlias, formatSchema } = this.ndutDb.helper
    const schema = getSchemaByAlias(request.params.model)
    if (!(schema.expose.find || schema.expose.get)) throw this.Boom.notFound('resourceNotFound')
    const columns = formatSchema(schema)
    return {
      data: {
        name: schema.alias,
        columns
      }
    }
  }
}
