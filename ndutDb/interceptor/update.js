module.exports = async function (model, request, ...args) {
  if (this.ndutDb.helper.isUserSupportedModel(model) && request.user)
    args[0] = { userId: request.user.id }
  return args
}
