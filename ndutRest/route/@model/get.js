const { _, getNdutConfig } = require('ndut-helper')

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
    const restConfig = getNdutConfig(this, 'ndut-rest')
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    let limit = parseInt(request.query[restConfig.queryKey.pageSize]) || restConfig.maxPageSize
    if (limit > restConfig.maxPageSize) limit = restConfig.maxPageSize
    if (limit < 1) limit = 1
    let page = parseInt(request.query[restConfig.queryKey.page]) || 1
    if (page < 1) page = 1
    let skip = (page - 1) * limit
    if (request.query[restConfig.queryKey.offset]) {
      skip = parseInt(request.query[restConfig.queryKey.offset]) || skip
      page = undefined
    }
    if (skip < 0) skip = 0
    let where = {}
    if (request.query[restConfig.queryKey.query]) {
      try {
        where = JSON.parse(request.query[restConfig.queryKey.query])
      } catch (err) {
        throw new Error(`Can't parse datasource query`)
      }
    }
    let order = request.query[restConfig.queryKey.sort]
    if (!order) {
      const schema = _.find(getNdutConfig(this, 'ndut-db').schemas, { name: model.name }) || {}
      const keys = _.map(schema.columnns, 'name')
      const found = _.intersection(keys, ['updated_at', 'updatedAt', 'created_at', 'createdAt'])
      if (found[0]) order = `${found[0]} DESC`
    }
    const total = await model.count({ where })
    const data = await model.find({ limit, order, skip, where })
    return this.ndutDb.helper.formatRest(this, {
      success: true,
      data,
      total,
      totalPage: Math.floor((total + limit - 1) / limit),
      pageSize: limit,
      page
    })
  }
}
