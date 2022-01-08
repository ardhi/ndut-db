module.exports = async function () {
  const { handler } = await this.ndutRest.helper.modelAsUpdateRoute()
  return {
    handler,
    schema: {
      description: 'Update record by its ID',
      tags: ['DB'],
      params: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            description: 'Model ID'
          },
          id: {
            type: 'string',
            description: 'Record ID'
          }
        }
      }
    },
    body: {
      type: 'object'
    }
  }
}
