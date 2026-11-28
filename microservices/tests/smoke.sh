#!/bin/sh
set -eu
gateway="${GATEWAY_URL:-http://127.0.0.1:8088}"
suffix="$(date +%s)"
email="smoke-${suffix}@example.test"
register="$(curl -fsS -H 'content-type: application/json' -d "{\"name\":\"Smoke Test\",\"email\":\"$email\",\"password\":\"temporary-test-password\",\"role\":\"jobseeker\"}" "$gateway/api/auth/register")"
token="$(printf '%s' "$register" | node -e 'let s="";process.stdin.on("data",x=>s+=x).on("end",()=>process.stdout.write(JSON.parse(s).data.token))')"
curl -fsS -H "authorization: Bearer $token" "$gateway/api/auth/me" >/dev/null
curl -fsS "$gateway/api/jobs?limit=5" >/dev/null
curl -fsS -H "authorization: Bearer $token" "$gateway/api/resumes" >/dev/null
curl -fsS -H "authorization: Bearer $token" "$gateway/api/notifications/unread-count" >/dev/null
echo "smoke=PASS"
