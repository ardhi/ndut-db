module.exports = {
  handler: async function (request, reply) {
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    const data = await model.findById(request.params.id)
    if (!data) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    return this.ndutDb.helper.formatRest(this, {
      success: true,
      data
    })
  }
}
