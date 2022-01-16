module.exports = {
  schema: {
    description: 'Get record by its ID',
    tags: ['DB'],
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Record ID'
        }
      }
    }
  },
  handler: async function (request, reply) {
    const { _ } = this.ndut.helper
    const { getSchemaByAlias, getModelByAlias } = this.ndutDb.helper
    const schema = await getSchemaByAlias(request.params.model)
    if (!schema.expose.get) throw this.Boom.notFound('Resource not found')
    const model = await getModelByAlias(request.params.model)
    const base = 'DbLookup'
    const data = await this.ndutDb.find(base, request, { where: { model, id: request.params.id } })
    if (data.length === 0) throw this.Boom.notFound('Record not found')
    return {
      data: _.omit(data[0].toObject(), ['model'])
    }
  }
}
