# 1) Register user (sends OTP email - check console for Ethereal Preview URL)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d @examples/user_register.json

# 2) (Once you get OTP from email) Verify email:
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d @examples/user_verify.json

# 3) Login (user)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d @examples/user_login.json

# 4) Get profile (replace <TOKEN> with token from login)
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer <TOKEN>"

# 5) Admin initial setup (only allowed if no admin exists)
curl -X POST http://localhost:5000/api/auth/admin/setup \
  -H "Content-Type: application/json" \
  -d @examples/admin_setup.json

# 6) Admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d @examples/admin_login.json

# 7) Admin-only route (replace <ADMIN_TOKEN>)
curl http://localhost:5000/api/auth/admin/secret -H "Authorization: Bearer <ADMIN_TOKEN>"
