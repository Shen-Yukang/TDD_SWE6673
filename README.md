# Sprint 1 - TDD Matching Engine

This is Group 6 submission. The goal of this sprint is to write the unit
tests first and leave simple skeleton code in `src/` so the tests can run.

Right now, most tests are expected fail because the real logic has not been
implemented yet. 

## What This Project Is About

The project is for a simple player matching engine. After it is implemented, it
should take one target player and a list of candidate players, then return the
best matches in order.

The match score is based on:

- skill similarity
- behavior similarity
- preference compatibility

Before scoring, the engine can also filter out candidates who do not meet basic
rules, such as skill gap, region, game mode, or play style.

Sprint 1 only focuses on pure functions and unit tests. There is no UI and no
database in this sprint.

## How To Run

Requirements: Node.js >= 18 .

```bash
npm install
# pnpm install
npm test
# pnpm test
```

Because this sprint only includes skeleton code, the test suite should run but
fail. The failing tests show what needs to be implemented in the next step.

To run one test file:

```bash
npx jest tests/unit/matchScoring.test.js
```

## Project Structure

```text
sprint1-tdd-matching-engine/
├── package.json
├── src/
│   ├── utils/matchScoring.js
│   ├── services/matchmakingService.js
│   └── repositories/
│       ├── profileRepository.js
│       └── userRepository.js
└── tests/
    └── unit/
        ├── matchScoring.test.js
        └── matchmakingService.test.js
```

The files in `src/` are mostly stubs for now. The real behavior is described by
the tests in `tests/unit/`.

## Test Coverage

The tests cover these Sprint 1 requirements:

| Requirement | Main idea |
|---|---|
| FR1 | calculate skill similarity |
| FR2 | calculate behavior similarity |
| FR3 | compare player preferences |
| FR4 | normalize score weights |
| FR5 | calculate the final match score |
| FR6 | filter invalid candidates |
| FR7 | rank candidates and return top matches |
| FR8 | handle edge cases and missing data |

## TDD Process

1. Red: write tests first and run them against skeleton code.
2. Green: implement the functions until tests pass.
3. Refactor: clean up the code while keeping tests passing.
