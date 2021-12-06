const { _ } = require('ndut-helper')

module.exports = {
  handler: async function (request, reply) {
    const model = this.ndutDb.helper.getModelByAlias(this, request.params.model)
    const existing = await model.findById(request.params.id)
    if (!existing) throw new this.Boom.Boom('Record not found', { statusCode: 404 })
    await model.remove({ id: request.params.id })
    return this.ndutDb.helper.formatRest(this, {
      success: true,
      data: existing,
      message: 'Record successfully removed'
    })
  }
}
