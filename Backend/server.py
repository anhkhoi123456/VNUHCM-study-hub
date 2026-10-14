"""Loopback development server; C++ handles account password operations."""
import argparse
import getpass
import hashlib
import json
import os
from pathlib import Path
import secrets
import sqlite3
import subprocess
import time
from collections import defaultdict, deque
from contextlib import closing
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from threading import Lock

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
DATABASE = ROOT / 'data' / 'accounts.sqlite3'
HELPER = ROOT / 'auth-helper.exe'
ATTEMPTS = defaultdict(deque)
LOCK = Lock()


def normalize(username):
    return username.strip().casefold()


def auth(operation, *values):
    if any(not isinstance(value, str) or len(value.encode('utf-8')) > 1024 or any(c in value for c in '\r\n\0') for value in values):
        return False
    result = subprocess.run([str(HELPER), operation, str(DATABASE)], input='\n'.join(values) + '\n', text=True, encoding='utf-8', capture_output=True, timeout=15)
    if result.returncode not in (0, 1):
        raise RuntimeError('Authentication helper failed')
    return result.returncode == 0


def initialize():
    DATABASE.parent.mkdir(exist_ok=True)
    if not HELPER.exists():
        raise RuntimeError('Build auth-helper.exe first; see Backend/README.md')
    auth('init')
    with closing(sqlite3.connect(DATABASE, isolation_level=None)) as db:
        db.execute('CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, username TEXT NOT NULL, expires REAL NOT NULL)')


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if urlsplit(self.path).path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT / 'Frontend'), **kwargs)

    def log_message(self, format, *args):
        pass  # Do not log credentials or URLs with user data.

    def session(self):
        try:
            cookies = SimpleCookie(self.headers.get('Cookie', ''))
            token = cookies['studyhub_session'].value
            digest = hashlib.sha256(token.encode()).hexdigest()
            with closing(sqlite3.connect(DATABASE, isolation_level=None)) as db:
                row = db.execute('SELECT username FROM sessions WHERE token_hash=? AND expires>?', (digest, time.time())).fetchone()
            return (row[0], digest) if row else None
        except (KeyError, ValueError):
            return None

    def reply(self, status, data, cookie=None):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/api/auth/me':
            session = self.session()
            self.reply(200 if session else 401, {'username': session[0]} if session else {'error': 'unauthorized'})
            return
        if path.startswith('/api/'):
            self.reply(404, {'error': 'not_found'})
            return
        if path.startswith('/resources/'):
            # Resources live next to Frontend; constrain every requested path.
            resource = (PROJECT / path.lstrip('/')).resolve()
            if not resource.is_relative_to(PROJECT / 'resources') or not resource.is_file():
                self.send_error(404); return
            data = resource.read_bytes()
            self.send_response(200); self.send_header('Content-Type', self.guess_type(str(resource))); self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data); return
        if path == '/':
            self.path = '/index.html'
        if path.endswith('/'):
            self.send_error(404); return
        super().do_GET()

    def do_POST(self):
        # JSON + strict origin checks prevent cross-site form requests.
        origin = self.headers.get('Origin')
        if origin and origin != f'http://{self.headers.get("Host")}':
            self.reply(403, {'error': 'origin'}); return
        if self.headers.get('Sec-Fetch-Site') == 'cross-site' or self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            self.reply(403, {'error': 'request_type'}); return
        try:
            length = int(self.headers.get('Content-Length', 0))
            if not 0 < length <= 8192:
                raise ValueError()
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError()
            path = urlsplit(self.path).path
            if path == '/api/auth/login':
                now = time.time()
                with LOCK:
                    attempts = ATTEMPTS[self.client_address[0]]
                    while attempts and attempts[0] < now - 60:
                        attempts.popleft()
                    if len(attempts) >= 10:
                        self.reply(429, {'error': 'rate_limit'}); return
                    attempts.append(now)
                username = data.get('username', '')
                if not isinstance(username, str):
                    raise ValueError()
                username = normalize(username)
                if not auth('verify', username, data.get('password', '')):
                    self.reply(401, {'error': 'invalid_credentials'}); return
                remember = data.get('remember') is True
                lifetime = 30 * 86400 if remember else 8 * 3600
                token = secrets.token_urlsafe(32)
                with closing(sqlite3.connect(DATABASE, isolation_level=None)) as db:
                    db.execute('DELETE FROM sessions WHERE expires<?', (now,))
                    old = self.session()
                    if old:
                        db.execute('DELETE FROM sessions WHERE token_hash=?', (old[1],))
                    db.execute('INSERT INTO sessions VALUES(?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), username, now + lifetime))
                cookie = f'studyhub_session={token}; Path=/; HttpOnly; SameSite=Strict' + (f'; Max-Age={lifetime}' if remember else '')
                self.reply(200, {'username': username}, cookie); return
            session = self.session()
            if not session:
                self.reply(401, {'error': 'unauthorized'}); return
            if path == '/api/auth/logout':
                with closing(sqlite3.connect(DATABASE, isolation_level=None)) as db:
                    db.execute('DELETE FROM sessions WHERE token_hash=?', (session[1],))
                self.reply(200, {'ok': True}, 'studyhub_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'); return
            if path == '/api/account/password':
                if not auth('change', session[0], data.get('currentPassword', ''), data.get('newPassword', '')):
                    self.reply(400, {'error': 'invalid_password'}); return
                with closing(sqlite3.connect(DATABASE, isolation_level=None)) as db:
                    db.execute('DELETE FROM sessions WHERE username=? AND token_hash<>?', (session[0], session[1]))
                self.reply(200, {'ok': True}); return
            self.reply(404, {'error': 'not_found'})
        except (ValueError, TypeError):
            self.reply(400, {'error': 'invalid_request'})
        except (RuntimeError, subprocess.TimeoutExpired, sqlite3.Error):
            self.reply(503, {'error': 'service_unavailable'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['serve', 'create-user'], nargs='?', default='serve')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    initialize()
    if args.command == 'create-user':
        username = normalize(input('Email / student ID: '))
        password = getpass.getpass('Password (at least 8 characters): ')
        if password != getpass.getpass('Confirm password: '):
            raise SystemExit('Passwords do not match')
        if not auth('create', username, password):
            raise SystemExit('Account exists or credentials are invalid')
        print('Account created.')
    else:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
        print(f'StudyHub: http://127.0.0.1:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            server.server_close()
