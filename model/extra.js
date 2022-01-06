module.exports = function (builder, model, schema) {
  const { _ } = this.ndut.helper
  // TODO: can only be updated by Admins
  if (_.get(schema, 'feature.siteId')) builder.defineProperty(schema.name, 'siteId', {
    type: Number,
    required: false,
    index: true,
    default: 0
  })
  // TODO: can only be updated by Admins
  if (_.get(schema, 'feature.status')) builder.defineProperty(schema.name, 'status', {
    type: String,
    length: 10,
    required: false,
    index: true
  })
}
