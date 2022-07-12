module.exports = async function () {
  const { handler } = await this.ndutRest.helper.modelAsFindRoute()
  return {
    handler,
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
    }
  }
}
