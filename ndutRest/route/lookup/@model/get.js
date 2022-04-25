module.exports = {
  schema: {
    description: 'Get lookup\'s records',
    tags: ['DB']
  },
  handler: async function (request, reply) {
    const { _ } = this.ndut.helper
    const { getSchemaByAlias, getModelByAlias } = this.ndutDb.helper
    const { prepList } = this.ndutApi.helper
    const { translateFilter, getColumns } = this.ndutRest.helper
    const schema = await getSchemaByAlias(request.params.model)
    if (!schema.expose.list) throw this.Boom.notFound('resourceNotFound')
    const model = await getModelByAlias(request.params.model)
    const base = 'DbLookup'

    const filter = translateFilter(request.query)
    const params = await prepList(model, filter)
    params.where.model = model
    const columns = getColumns(request.query.columns)
    const options = { columns }
    params.noCount = request.query.nocount
    if (!params.noCount) params.total = await this.ndutApi.helper.count({ model: base, params })
    return await this.ndutApi.helper.find({ model: base, params, options })
  }
}
