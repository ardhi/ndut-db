module.exports = {
  schema: {
    description: 'Get lookup\'s records',
    tags: ['DB']
  },
  handler: async function (request, reply) {
    const { parseQsForList } = this.ndutRest.helper
    const model = 'DbLookup'
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
