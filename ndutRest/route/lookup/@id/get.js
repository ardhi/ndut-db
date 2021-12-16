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
    const model = 'DbLookup'
    const data = await this.ndutDb.findById(model, request, request.params.id)
    if (!data) throw this.Boom.notFound('Record not found')
    return {
      data
    }
  }
}
