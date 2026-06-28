const {
  DEFAULT_WEIGHTS,
  normalizeWeights,
  preferenceCompatibility,
  passesFilters,
  skillSimilarity,
  behaviorSimilarity,
  scoreProfiles,
} = require('../../src/utils/matchScoring');

describe('matchScoring utility', () => {
  // FR4 - Weight Normalization
  test('normalizeWeights returns normalized custom weights', () => {
    expect(normalizeWeights({ skill: 3, behavior: 1, preference: 2 })).toEqual({
      skill: 0.5,
      behavior: 1 / 6,
      preference: 1 / 3,
    });
  });

  test('normalizeWeights falls back to defaults for invalid values', () => {
    expect(normalizeWeights({ skill: -1, behavior: 'bad', preference: 1 })).toEqual({
      skill: 0.25,
      behavior: 0.25,
      preference: 0.5,
    });
  });

  test('normalizeWeights falls back to normalized defaults when total is zero', () => {
    expect(normalizeWeights({ skill: 0, behavior: 0, preference: 0 })).toEqual(
      normalizeWeights(DEFAULT_WEIGHTS)
    );
  });

  // FR1 - Skill Similarity
  test('skillSimilarity returns 1 for identical scores', () => {
    expect(skillSimilarity(80, 80)).toBe(1);
  });

  test('skillSimilarity decreases with score gap', () => {
    expect(skillSimilarity(80, 60)).toBeCloseTo(0.8, 5);
  });

  test('skillSimilarity clamps to 0', () => {
    expect(skillSimilarity(0, 1000)).toBe(0);
  });

  test('skillSimilarity treats a missing score as 0 (AC1.4)', () => {
    expect(skillSimilarity(undefined, 80)).toBeCloseTo(0.2, 5);
    expect(skillSimilarity(undefined, 100)).toBe(0);
  });

  // FR2 - Behavior Similarity
  test('behaviorSimilarity returns 0 if no shared metrics', () => {
    expect(behaviorSimilarity({ a: 10 }, { b: 10 })).toBe(0);
  });

  test('behaviorSimilarity returns 1 for identical metrics', () => {
    expect(behaviorSimilarity({ teamwork: 90 }, { teamwork: 90 })).toBe(1);
  });

  test('behaviorSimilarity averages across metrics', () => {
    const value = behaviorSimilarity(
      { teamwork: 100, comms: 50 },
      { teamwork: 90, comms: 30 }
    );
    expect(value).toBeCloseTo((0.9 + 0.8) / 2, 5);
  });

  test('behaviorSimilarity treats missing metric values as zero', () => {
    const value = behaviorSimilarity(
      { teamwork: 100, comms: undefined },
      { teamwork: 100, comms: 20 }
    );

    expect(value).toBeCloseTo((1 + 0.8) / 2, 5);
  });

  // FR3 - Preference Compatibility
  test('preferenceCompatibility returns 0 when no tracked fields overlap', () => {
    expect(preferenceCompatibility({ mode: 'ranked' }, { mode: 'ranked' })).toBe(0);
  });

  test('preferenceCompatibility averages matches across tracked preference fields', () => {
    const value = preferenceCompatibility(
      { region: 'NA', gameMode: 'Ranked', playStyle: 'Aggressive' },
      { region: 'na', gameMode: 'casual', playStyle: 'Aggressive' }
    );

    expect(value).toBeCloseTo(2 / 3, 5);
  });

  test('preferenceCompatibility trims whitespace and ignores case (AC3.2)', () => {
    expect(
      preferenceCompatibility({ region: ' NA ' }, { region: 'na' })
    ).toBe(1);
    expect(
      preferenceCompatibility({ region: ' NA ' }, { region: ' eu ' })
    ).toBe(0);
  });

  // FR6 - Candidate Filtering
  test('passesFilters rejects candidate outside max skill gap', () => {
    const target = { skillScore: 80, preferences: {} };
    const candidate = { skillScore: 55, preferences: { region: 'NA' } };

    expect(passesFilters(target, candidate, { maxSkillGap: 20 })).toBe(false);
  });

  test('passesFilters matches configured preference filters case-insensitively', () => {
    const target = { skillScore: 80, preferences: { region: 'NA' } };
    const candidate = {
      skillScore: 75,
      preferences: { region: 'eu', gameMode: 'Ranked', playStyle: 'Support' },
    };

    expect(
      passesFilters(target, candidate, {
        maxSkillGap: 10,
        gameMode: 'ranked',
        playStyle: 'support',
      })
    ).toBe(true);
    expect(passesFilters(target, candidate, { region: 'na' })).toBe(false);
  });

  test('passesFilters ignores empty filter values', () => {
    const target = { skillScore: 80, preferences: { region: 'NA' } };
    const candidate = {
      skillScore: 75,
      preferences: { region: 'EU', gameMode: 'Ranked', playStyle: 'Support' },
    };

    expect(
      passesFilters(target, candidate, {
        region: '   ',
        gameMode: '',
        playStyle: undefined,
      })
    ).toBe(true);
  });

  // FR5 - Composite Match Score
  test('scoreProfiles returns total with breakdown', () => {
    const result = scoreProfiles(
      {
        skillScore: 80,
        behaviorMetrics: { teamwork: 90 },
        preferences: { region: 'NA', gameMode: 'Ranked', playStyle: 'Aggressive' },
      },
      {
        skillScore: 70,
        behaviorMetrics: { teamwork: 80 },
        preferences: { region: 'NA', gameMode: 'Ranked', playStyle: 'Defensive' },
      },
      { skill: 0.6, behavior: 0.3, preference: 0.1 }
    );

    expect(result).toHaveProperty('totalScore');
    expect(result.breakdown).toEqual({
      skillSimilarity: 0.9,
      behaviorSimilarity: 0.9,
      preferenceCompatibility: 2 / 3,
    });
    expect(result.totalScore).toBeCloseTo(0.8766666667, 5);
  });

  test('scoreProfiles uses normalized default weights when input is invalid', () => {
    const result = scoreProfiles(
      {
        skillScore: 90,
        behaviorMetrics: { teamwork: 90 },
        preferences: { region: 'NA' },
      },
      {
        skillScore: 70,
        behaviorMetrics: { teamwork: 70 },
        preferences: { region: 'EU' },
      },
      { skill: -1, behavior: Number.NaN, preference: 0 }
    );

    expect(result.totalScore).toBeCloseTo(0.8, 5);
  });
});
