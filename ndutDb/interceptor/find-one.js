module.exports = async function (model, request, ...args) {
  if (this.ndutDb.helper.isUserSupportedModel(model) && request.user)
    args[0] = { where: { userId: request.user.id } }
  return args
}
