module.exports = async function ({ builder, model, schema, options }) {
  const { _ } = this.ndut.helper
  if (!model.definition.properties.status) {
    let defOpts = {
      type: String,
      length: 20,
      required: false,
      index: true
    }
    if (_.isPlainObject(options)) defOpts = _.merge(defOpts, options)
    builder.defineProperty(schema.name, 'status', defOpts)
  }
}
