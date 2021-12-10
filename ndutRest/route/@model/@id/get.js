module.exports = {
  schema: {
    description: 'Get record by its ID',
    tags: ['DB'],
    params: {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          description: 'Model ID'
        },
        id: {
          type: 'string',
          description: 'Record ID'
        }
      }
    }
  },
  handler: async function (request, reply) {
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const data = await model.findById(request.params.id)
    if (!data) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    return {
      data
    }
  }
}
