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
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    const data = await model.create(request.body)
    return this.ndutDb.helper.formatRest(this, {
      data,
      message: 'Record successfully created'
    })
  }
}
