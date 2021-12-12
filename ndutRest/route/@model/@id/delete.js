const { _ } = require('ndut-helper')

module.exports = {
  schema: {
    description: 'Remove record by its ID',
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
    const existing = await this.ndutDb.findById(model, request, request.params.id)
    if (!existing) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    await this.ndutDb.remove(model, request, { id: request.params.id })
    return {
      data: existing,
      message: 'Record successfully removed'
    }
  }
}
