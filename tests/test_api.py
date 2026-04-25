import json
import requests


BASE_URL = "http://localhost:8000"

ENDPOINTS = [
    ("GET", "/health"),
    ("GET", "/household-search/10"),
    ("GET", "/top-spenders"),
    ("GET", "/popular-products"),
    ("GET", "/seasonal-trends"),
    ("GET", "/churn-risk"),
    ("GET", "/brand-preference-split"),
    ("GET", "/engagement-by-income"),
    ("GET", "/loyalty-trends"),
    ("GET", "/frequent-pairs"),
    ("GET", "/association-rules"),
    ("GET", "/get-prediction-features"),
]


def preview_json(data, max_items=2):
    """Print short preview instead of huge full API response."""
    if isinstance(data, list):
        return {
            "type": "list",
            "count": len(data),
            "preview": data[:max_items],
        }

    if isinstance(data, dict):
        preview = {}
        for key, value in data.items():
            if isinstance(value, list):
                preview[key] = {
                    "type": "list",
                    "count": len(value),
                    "preview": value[:max_items],
                }
            else:
                preview[key] = value
        return preview

    return data


def test_endpoint(method, path):
    url = f"{BASE_URL}{path}"

    try:
        if method == "GET":
            response = requests.get(url, timeout=120)
        elif method == "POST":
            response = requests.post(url, timeout=120)
        else:
            raise ValueError(f"Unsupported method: {method}")

        status = response.status_code

        try:
            data = response.json()
        except Exception:
            data = response.text

        ok = 200 <= status < 300

        print("=" * 80)
        print(f"{'✅ PASS' if ok else '❌ FAIL'} {method} {path}")
        print(f"Status: {status}")
        print(json.dumps(preview_json(data), indent=2, default=str)[:3000])

        return ok

    except Exception as e:
        print("=" * 80)
        print(f"❌ ERROR {method} {path}")
        print(str(e))
        return False


def main():
    print(f"Testing API at: {BASE_URL}")

    passed = 0
    failed = 0

    # Trigger dashboard refresh first
    print("=" * 80)
    print("Refreshing dashboard cache...")
    try:
        refresh = requests.post(f"{BASE_URL}/refresh-dashboard", timeout=180)
        print(f"Refresh status: {refresh.status_code}")
        print(refresh.text[:1000])
    except Exception as e:
        print(f"Refresh failed: {e}")

    for method, path in ENDPOINTS:
        ok = test_endpoint(method, path)
        if ok:
            passed += 1
        else:
            failed += 1

    print("=" * 80)
    print("TEST SUMMARY")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed == 0:
        print("✅ All endpoints passed.")
    else:
        print("❌ Some endpoints failed. Check logs above.")


if __name__ == "__main__":
    main()