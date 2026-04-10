import requests

BASE_URL = "http://localhost:8080/api/v1/auth"
TEST_USER = {
    "name": "QA Tester Final",
    "email": "qa_tester_final@example.com",
    "password": "Password123!"
}

def check(test_name, success, status, body):
    result = "✅ PASS" if success else "❌ FAIL"
    print(f"| {test_name} | {result} | {status} | {body} |")

print("| Test Case | Result | Status | Response |")
print("|-----------|--------|--------|----------|")

# 1. Register
try:
    res = requests.post(f"{BASE_URL}/register", json=TEST_USER)
    # Registration might fail if user already exists from previous turn, that's fine.
    check("Register", res.status_code in [200, 400], res.status_code, res.json())
except Exception as e:
    print(f"Error during register: {e}")

# 2. Resend OTP and Capture (Debug mode returns OTP)
try:
    res = requests.post(f"{BASE_URL}/resend-otp", json={"email": TEST_USER["email"]})
    check("Resend OTP", res.status_code == 200, res.status_code, res.json())
    otp = res.json().get("debug_otp")
except Exception as e:
    print(f"Error during resend: {e}")
    otp = None

# 3. Verify OTP - Wrong OTP
try:
    res = requests.post(f"{BASE_URL}/verify-otp", json={"email": TEST_USER["email"], "otp": "000000"})
    check("Verify Wrong OTP", res.status_code == 400, res.status_code, res.json())
except Exception as e:
    print(f"Error during wrong verify: {e}")

# 4. Verify OTP - Wrong Email
try:
    res = requests.post(f"{BASE_URL}/verify-otp", json={"email": "nonexistent@example.com", "otp": otp})
    check("Verify Wrong Email", res.status_code == 404, res.status_code, res.json())
except Exception as e:
    print(f"Error during wrong email verify: {e}")

# 5. Verify OTP - Success
if otp:
    try:
        res = requests.post(f"{BASE_URL}/verify-otp", json={"email": TEST_USER["email"], "otp": otp})
        check("Verify Success", res.status_code == 200, res.status_code, res.json())
    except Exception as e:
        print(f"Error during success verify: {e}")
else:
    print("Skipping success verify due to missing OTP")
