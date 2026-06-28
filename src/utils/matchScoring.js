// default weights
const DEFAULT_WEIGHTS = {
  skill: 0.5,
  behavior: 0.5,
  preference: 0,
};

// FR4
function normalizeWeights(weights = {}, defaults = DEFAULT_WEIGHTS) {
  return {};
}

// FR1
function skillSimilarity(a, b, maxSkill = 100) {
  return 0;
}

// FR2
function behaviorSimilarity(metricsA = {}, metricsB = {}) {
  return 0;
}

// FR3
function preferenceCompatibility(preferencesA = {}, preferencesB = {}) {
  return 0;
}

// FR6
function passesFilters(targetProfile, candidateProfile, filters = {}) {
  return false;
}

// FR5
function scoreProfiles(profileA, profileB, weights = DEFAULT_WEIGHTS) {
  return {
    totalScore: 0,
    breakdown: {
      skillSimilarity: 0,
      behaviorSimilarity: 0,
      preferenceCompatibility: 0,
    },
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  normalizeWeights,
  preferenceCompatibility,
  passesFilters,
  scoreProfiles,
  skillSimilarity,
  behaviorSimilarity,
};
