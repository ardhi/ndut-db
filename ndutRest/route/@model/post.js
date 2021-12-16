module.exports = {
  schema: {
    description: 'Create and persist data',
    tags: ['DB'],
    params: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Model ID'
        }
      }
    },
    body: {
      type: 'object'
    }
  },
  handler: async function (request, reply) {
    const { getSchemaByAlias } = this.ndutDb.helper
    const schema = getSchemaByAlias(request.params.model)
    if (!schema.expose.create) throw this.Boom.notFound('Resource not found')
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const data = await this.ndutDb.create(model, request, request.body)
    return {
      data,
      message: 'Record successfully created'
    }
  }
}
