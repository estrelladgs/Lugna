"""Quick smoke test for the Lugna API."""

import json
import uuid
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise Exception(f"HTTP {e.code} on {method} {path}: {body}")


def main():
    email = f"test-{uuid.uuid4().hex[:6]}@lugna.com"
    password = "test1234"

    print("=== REGISTER ===")
    reg = req("POST", "/auth/register", {"name": "Estrella Test", "email": email, "password": password})
    print(f"  User: {reg['user']['name']} <{reg['user']['email']}>")
    token = reg["tokens"]["accessToken"]
    print(f"  Access token: {token[:30]}...")
    print("  ✓ OK")

    print("\n=== LOGIN ===")
    login = req("POST", "/auth/login", {"email": email, "password": password})
    print(f"  Login as: {login['user']['name']}")
    token = login["tokens"]["accessToken"]
    print("  ✓ OK")

    print("\n=== REFRESH TOKEN ===")
    refresh = req("POST", "/auth/refresh", {"refreshToken": login["tokens"]["refreshToken"]})
    print(f"  New access token: {refresh['accessToken'][:30]}...")
    print("  ✓ OK")

    print("\n=== GET POSTURES ===")
    postures = req("GET", "/postures", token=token)
    print(f"  Count: {len(postures)}")
    for p in postures:
        print(f"    - {p['id']}: {p['name']} ({p['difficulty']})")
    print("  ✓ OK")

    print("\n=== GET SINGLE POSTURE ===")
    p = req("GET", "/postures/plank", token=token)
    print(f"  {p['name']} | muscles: {p['muscleGroups']}")
    print("  ✓ OK")

    print("\n=== ANALYZE POSTURE (mock) ===")
    feedback = req("POST", "/posture/analyze", {"postureId": "plank", "frame": "aGVsbG8="}, token=token)
    print(f"  Score: {feedback['score']}")
    print(f"  isCorrect: {feedback['isCorrect']}")
    print(f"  Corrections: {feedback['corrections']}")
    print("  ✓ OK")

    print("\n=== SAVE SESSION ===")
    session_id = str(uuid.uuid4())
    saved = req("POST", "/posture/sessions", {
        "id": session_id,
        "postureId": "plank",
        "startedAt": "2025-06-01T10:00:00",
        "endedAt": "2025-06-01T10:05:00",
        "durationSeconds": 300,
        "averageScore": 82.5,
        "feedbackHistory": [
            {"isCorrect": True, "score": 82.5, "corrections": [], "landmarks": None}
        ],
    }, token=token)
    print(f"  Session {saved['id'][:8]}... | posture: {saved['postureId']} | score: {saved['averageScore']}")
    print("  ✓ OK")

    print("\n=== GET SESSIONS ===")
    sessions = req("GET", "/posture/sessions", token=token)
    print(f"  Sessions count: {len(sessions)}")
    print("  ✓ OK")

    print("\n=== GET ROUTINES ===")
    routines = req("GET", "/routines", token=token)
    print(f"  Count: {len(routines)}")
    for r in routines:
        print(f"    - {r['name']} ({r['durationMinutes']} min, {r['difficulty']})")
    print("  ✓ OK")

    print("\n=== ALL TESTS PASSED ✓ ===")


if __name__ == "__main__":
    main()
