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
    const { getSchemaByAlias } = this.ndutDb.helper
    const schema = getSchemaByAlias(request.params.model)
    if (!schema.expose.update) throw this.Boom.notFound('Resource not found')
    const { _ } = this.ndut.helper
    const id = request.params.id
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const existing = await this.ndutDb.findById(model, request, id)
    if (!existing) throw this.Boom.notFound('Record not found')
    await this.ndutDb.update(model, request, { id }, _.omit(request.body, 'id'))
    const data = await this.ndutDb.findById(model, request, id)
    return {
      data,
      message: 'Record successfully updated'
    }
  }
}
