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
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    const existing = await model.findById(request.params.id)
    if (!existing) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    await model.remove({ id: request.params.id })
    return this.ndutDb.helper.formatRest(this, {
      data: existing,
      message: 'Record successfully removed'
    })
  }
}
