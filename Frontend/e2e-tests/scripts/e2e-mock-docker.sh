#!/usr/bin/env bash
#
# Runs the mock e2e suite inside the same container image CI uses.
#
# This is the only supported way to record screenshot baselines: browser build and fonts of the
# host would otherwise produce baselines that never match CI.
#
# Usage (from Frontend/):
#   ./e2e-tests/scripts/e2e-mock-docker.sh                     # run the suite
#   ./e2e-tests/scripts/e2e-mock-docker.sh --update-snapshots  # (re)record baselines
#
# Requires a previous `npm run prebuild && npm run build:mock`.

set -euo pipefail

IMAGE="mcr.microsoft.com/playwright:v1.57.0-noble"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ ! -d "${FRONTEND_DIR}/dist-mock" ]]; then
    echo "dist-mock/ is missing - run 'npm run prebuild && npm run build:mock' first." >&2
    exit 1
fi

docker run --rm \
    --ipc=host \
    -v "${FRONTEND_DIR}:/work" \
    -w /work \
    -e CI \
    -e E2E_MOCK_REQUIRE_BASELINES \
    "${IMAGE}" \
    npm run e2e:mock -- "$@"
