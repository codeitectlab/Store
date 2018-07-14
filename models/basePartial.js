let basePartial = (type, model, isMobileOnly, hideOnMobile) => {
  let combinedModel = {
    classes: '',
    style: '',
    overlayPartial: '',
    isMobileOnly: isMobileOnly,
    hideOnMobile: hideOnMobile
  };
  combinedModel = Object.assign({}, combinedModel, model || {});
  return {
    type: type,
    model: combinedModel
  };
}

module.exports = basePartial;
