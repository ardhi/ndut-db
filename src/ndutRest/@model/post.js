module.exports = {
  handler: async function (request, reply) {
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    const data = await model.create(request.body)
    return this.ndutDb.helper.formatRest(this, {
      success: true,
      data,
      message: 'Record successfully created'
    })
  }
}
