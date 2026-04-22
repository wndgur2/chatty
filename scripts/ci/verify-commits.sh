#!/usr/bin/env bash
set -euo pipefail

base_ref="${1:-}"
head_ref="${2:-HEAD}"

if [[ -z "$base_ref" ]]; then
  echo "Usage: scripts/ci/verify-commits.sh <base-ref> [head-ref]"
  exit 1
fi

pattern='^(feat|fix|refactor|test|docs|chore|ci|build|perf|revert)(\([a-z0-9-]+\))?!?: .+'
failed=0

while IFS= read -r subject; do
  if [[ -z "$subject" ]]; then
    continue
  fi

  if [[ ! "$subject" =~ $pattern ]]; then
    echo "Invalid commit subject: $subject"
    failed=1
  fi
done < <(git log --format=%s "${base_ref}..${head_ref}")

if [[ "$failed" -ne 0 ]]; then
  echo "Commit convention check failed."
  exit 1
fi

echo "Commit convention check passed."
