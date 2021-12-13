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
    const { _ } = this.ndut.helper
    const id = request.params.id
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const existing = await this.ndutDb.findById(model, request, id)
    if (!existing) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    await this.ndutDb.update(model, request, { id }, _.omit(request.body, 'id'))
    const data = await this.ndutDb.findById(model, request, id)
    return {
      data,
      message: 'Record successfully updated'
    }
  }
}
