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
    }
  },
  handler: async function (request, reply) {
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const data = await this.ndutDb.create(model, request, request.body)
    return {
      data,
      message: 'Record successfully created'
    }
  }
}
