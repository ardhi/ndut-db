const { _ } = require('ndut-helper')

module.exports = {
  schema: {
    description: 'Update record by its ID',
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
    const existing = await model.findById(request.params.id)
    if (!existing) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    await model.update({ id: request.params.id }, _.omit(request.body, 'id'))
    const data = await model.findById(request.params.id)
    return {
      data,
      message: 'Record successfully updated'
    }
  }
}
