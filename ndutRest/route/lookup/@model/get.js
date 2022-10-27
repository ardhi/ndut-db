module.exports = {
  schema: {
    description: 'Get lookup\'s records',
    tags: ['DB']
  },
  handler: async function (request, reply) {
    const { getSchemaByAlias, getModelByAlias } = this.ndutDb.helper
    const schema = await getSchemaByAlias(request.params.model)
    if (!schema.expose.find) throw this.Boom.notFound('resourceNotFound')
    const model = await getModelByAlias(request.params.model)
    const base = 'DbLookup'

    const filter = this.ndutRest.helper.translateFilter(request.query)
    const params = this.ndutApi.helper.prepList(filter, model)
    params.where.model = model
    const columns = this.ndutRest.helper.getColumns(request.query.columns)
    const options = { columns }
    params.noCount = request.query.nocount
    if (!params.noCount) params.total = await this.ndutApi.helper.count({ model: base, params })
    return await this.ndutApi.helper.find({ model: base, params, options })
  }
}
