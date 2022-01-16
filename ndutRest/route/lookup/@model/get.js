module.exports = {
  schema: {
    description: 'Get lookup\'s records',
    tags: ['DB']
  },
  handler: async function (request, reply) {
    const { _ } = this.ndut.helper
    const { getSchemaByAlias, getModelByAlias } = this.ndutDb.helper
    const { parseQsForList } = this.ndutRest.helper
    const schema = await getSchemaByAlias(request.params.model)
    if (!schema.expose.list) throw this.Boom.notFound('Resource not found')
    const model = await getModelByAlias(request.params.model)
    const base = 'DbLookup'
    const { limit, page, skip, order, where } = await parseQsForList(request, base)
    where.model = model
    const total = await this.ndutDb.count(base, request, where)
    const result = await this.ndutDb.find(base, request, { limit, order, skip, where })
    const data = _.map(result, d => _.omit(d.toObject(), ['model']))
    return {
      data,
      total,
      totalPage: Math.floor((total + limit - 1) / limit),
      pageSize: limit,
      page
    }
  }
}
