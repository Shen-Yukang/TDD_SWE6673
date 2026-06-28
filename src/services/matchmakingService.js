const { DEFAULT_WEIGHTS } = require('../utils/matchScoring');

async function getMatches({
  userId,
  limit = 5,
  weights = DEFAULT_WEIGHTS,
  filters = {},
} = {}) {
  return [];
}

module.exports = {
  getMatches,
};
