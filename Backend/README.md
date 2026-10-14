# Local login server

The HTTP server uses Python's standard library. Account verification runs in the C++ helper with SQLite and OpenSSL. Passwords use a random 16-byte salt and PBKDF2-HMAC-SHA256 with 600,000 iterations. Sessions use random tokens in HttpOnly, SameSite=Strict cookies; only token hashes are stored in SQLite.

From the repository root, using the installed MSYS2 UCRT64 tools:

```powershell
& C:/msys64/ucrt64/bin/g++.exe Backend/login.cpp -o Backend/auth-helper.exe -std=c++17 -O2 -Wall -Wextra -lsqlite3 -lcrypto
python Backend/server.py create-user
python Backend/server.py serve
```

Enter your email or student ID and password at the interactive prompts. No default account is supplied. Open **http://127.0.0.1:8000/index.html** and sign in with that account. Opening HTML files directly or using a different static server will not connect login.

Accounts and sessions are stored in ignored `Backend/data/accounts.sqlite3`. Use the same command to create additional users. Email/student IDs are case-insensitive. Passwords must contain at least 8 characters; credentials are passed to the C++ helper through stdin, not command arguments. Keep the MSYS2 UCRT64 runtime DLLs available in PATH when using another Python installation.

Protected HTML pages redirect to login without a valid session. Logout revokes the session on the server. Remember me persists the cookie for 30 days; otherwise the cookie ends when the browser closes and the server session expires after 8 hours. Password changes verify the current password and revoke other sessions for the account. Profile photo/name/bio remain local browser data.

This server binds only to localhost and is intended for development. For deployment, use HTTPS and a production HTTP server; the cookie must then use Secure. Google/Microsoft sign-in, registration and password recovery are not implemented. Demo bypass is removed.

Run checks:

```powershell
python Backend/test_auth.py
```
