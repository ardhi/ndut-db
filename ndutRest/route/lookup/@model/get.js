module.exports = {
  schema: {
    description: 'Get lookup\'s records',
    tags: ['DB']
  },
  handler: async function (request, reply) {
    const { _ } = this.ndut.helper
    const { getSchemaByAlias, getModelByAlias } = this.ndutDb.helper
    const { prepList } = this.ndutApi.helper
    const schema = await getSchemaByAlias(request.params.model)
    if (!schema.expose.list) throw this.Boom.notFound('Resource not found')
    const model = await getModelByAlias(request.params.model)
    const base = 'DbLookup'
    const { limit, page, skip, order, where } = await prepList(base, request.query)
    where.model = model
    const total = await this.ndutApi.helper.count(base, where)
    return await this.ndutApi.find(base,{ limit, order, skip, where, total })
  }
}
