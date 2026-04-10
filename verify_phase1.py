import requests
import json

BASE_URL = "http://localhost:8080/api/v1"
TEST_ACCOUNT = {
    "name": "QA Test Student 3",
    "email": "qa_student3@example.com",
    "password": "Password123!"
}

def report(test_id, success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"| {test_id} | {status} | {message} |")

print("| ID | Status | Details |")
print("|----|--------|---------|")

# AUTH-02: Student Registration
try:
    res = requests.post(f"{BASE_URL}/auth/register", json=TEST_ACCOUNT)
    report("AUTH-02", res.status_code == 200, f"Registration initialized: {res.text}")
except Exception as e:
    report("AUTH-02", False, str(e))

# OTP: Verify-OTP (Should not be 403)
try:
    res = requests.post(f"{BASE_URL}/auth/verify-otp?email={TEST_ACCOUNT['email']}&otp=000000")
    # We expect 400 (Invalid OTP) or 200, but NOT 403/401
    report("OTP-VERIFY", res.status_code != 403 and res.status_code != 401, f"Status: {res.status_code} (Rejection is fine, blocking is FAIL)")
except Exception as e:
    report("OTP-VERIFY", False, str(e))

# OTP: Resend-OTP (Should not be 403)
try:
    res = requests.post(f"{BASE_URL}/auth/resend-otp?email={TEST_ACCOUNT['email']}")
    report("OTP-RESEND", res.status_code != 403 and res.status_code != 401, f"Status: {res.status_code} (Success or controlled error)")
except Exception as e:
    report("OTP-RESEND", False, str(e))

# AUTH-19: Unauthorized Access (Should be 403)
try:
    res = requests.get(f"{BASE_URL}/admin/stats")
    report("AUTH-19", res.status_code == 403, "Protected endpoint rejected unauthenticated request")
except Exception as e:
    report("AUTH-19", False, str(e))
