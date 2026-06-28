jest.mock('../../src/repositories/profileRepository', () => ({
  findByUserId: jest.fn(),
  listAll: jest.fn(),
}));

jest.mock('../../src/repositories/userRepository', () => ({
  findById: jest.fn(),
  listAll: jest.fn(),
}));

const matchmakingService = require('../../src/services/matchmakingService');
const profileRepository = require('../../src/repositories/profileRepository');
const userRepository = require('../../src/repositories/userRepository');

function profile(userId, skillScore, overrides = {}) {
  return {
    userId,
    skillScore,
    behaviorMetrics: { teamwork: 50 },
    preferences: {},
    ...overrides,
  };
}

function user(id, username) {
  return { _id: id, username };
}

const TARGET_ID = 'u1';

describe('matchmakingService.getMatches (FR7 ranking & FR8 edge cases)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default the target user exists and has a profile.
    userRepository.findById.mockResolvedValue(user(TARGET_ID, 'p1'));
    profileRepository.findByUserId.mockResolvedValue(profile(TARGET_ID, 80));
    userRepository.listAll.mockResolvedValue([]);
  });

  test('AC7.1 - excludes the target player from its own results', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u2', 78),
    ]);

    const results = await matchmakingService.getMatches({ userId: TARGET_ID });

    expect(results.map((r) => r.userId)).not.toContain(TARGET_ID);
    expect(results.map((r) => r.userId)).toEqual(['u2']);
  });

  test('AC7.2 - excludes candidates rejected by the hard filters', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u2', 78), // within gap
      profile('u3', 50), // skill gap 30 > maxSkillGap
    ]);

    const results = await matchmakingService.getMatches({
      userId: TARGET_ID,
      filters: { maxSkillGap: 10 },
    });

    expect(results.map((r) => r.userId)).toEqual(['u2']);
  });

  test('AC7.3 - sorts the remaining candidates by totalScore descending', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u_far', 40),
      profile('u_close', 79),
      profile('u_mid', 65),
    ]);

    const results = await matchmakingService.getMatches({ userId: TARGET_ID });

    expect(results.map((r) => r.userId)).toEqual(['u_close', 'u_mid', 'u_far']);
    const scores = results.map((r) => r.totalScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  test('AC7.4 - returns at most `limit` results', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u2', 79),
      profile('u3', 78),
      profile('u4', 77),
      profile('u5', 76),
    ]);

    const results = await matchmakingService.getMatches({
      userId: TARGET_ID,
      limit: 2,
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.userId)).toEqual(['u2', 'u3']);
  });

  test('AC7.5 - each result includes userId, totalScore, and breakdown', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u2', 78),
    ]);

    const [match] = await matchmakingService.getMatches({ userId: TARGET_ID });

    expect(match).toHaveProperty('userId', 'u2');
    expect(typeof match.totalScore).toBe('number');
    expect(match.breakdown).toEqual({
      skillSimilarity: expect.any(Number),
      behaviorSimilarity: expect.any(Number),
      preferenceCompatibility: expect.any(Number),
    });
  });

  test('AC8.1 - an empty candidate pool returns an empty list (no error)', async () => {
    profileRepository.listAll.mockResolvedValue([]);

    await expect(
      matchmakingService.getMatches({ userId: TARGET_ID })
    ).resolves.toEqual([]);
  });

  test('AC8.2 - a limit larger than the pool returns all available matches', async () => {
    profileRepository.listAll.mockResolvedValue([
      profile(TARGET_ID, 80),
      profile('u2', 78),
      profile('u3', 70),
    ]);

    const results = await matchmakingService.getMatches({
      userId: TARGET_ID,
      limit: 100,
    });

    expect(results.map((r) => r.userId)).toEqual(['u2', 'u3']);
  });

  test('AC8.3 - looking up an unknown target user raises a 404 not-found error', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      matchmakingService.getMatches({ userId: 'does-not-exist' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(profileRepository.listAll).not.toHaveBeenCalled();
  });

  test('AC8.3 - a target user without a profile raises a 404 not-found error', async () => {
    profileRepository.findByUserId.mockResolvedValue(null);

    await expect(
      matchmakingService.getMatches({ userId: TARGET_ID })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(profileRepository.listAll).not.toHaveBeenCalled();
  });
});
