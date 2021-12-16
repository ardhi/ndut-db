module.exports = {
  schema: {
    description: 'Get records. Use query string to filter, sort and pagination',
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
    const { getSchemaByAlias } = this.ndutDb.helper
    const schema = getSchemaByAlias(request.params.model)
    if (!schema.expose.list) throw this.Boom.notFound('Resource not found')
    const { parseQsForList } = this.ndutRest.helper
    const model = this.ndutDb.helper.getModelByAlias(request.params.model)
    const { limit, page, skip, order, where } = parseQsForList(request, model)
    const total = await this.ndutDb.count(model, request, where)
    const data = await this.ndutDb.find(model, request, { limit, order, skip, where })
    return {
      data,
      total,
      totalPage: Math.floor((total + limit - 1) / limit),
      pageSize: limit,
      page
    }
  }
}
