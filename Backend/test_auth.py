import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from contextlib import closing
import sqlite3
import server


class AuthFlow(unittest.TestCase):
    def test_full_flow(self):
        with tempfile.TemporaryDirectory() as folder:
            server.DATABASE = Path(folder) / 'test.sqlite3'
            server.initialize()
            self.assertTrue(server.auth('create', 'student@example.test', 'original-password'))
            self.assertFalse(server.auth('create', 'student@example.test', 'original-password'))
            self.assertFalse(server.auth('verify', "' OR 1=1--", 'original-password'))
            service = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
            thread = threading.Thread(target=service.serve_forever, daemon=True)
            thread.start()
            connection = http.client.HTTPConnection('127.0.0.1', service.server_port)
            def request(path, data=None, cookie=None, origin=None):
                headers = {}
                if cookie:
                    headers['Cookie'] = cookie
                if origin:
                    headers['Origin'] = origin
                if data is not None:
                    headers['Content-Type'] = 'application/json'
                connection.request('POST' if data is not None else 'GET', path, json.dumps(data) if data is not None else None, headers)
                response = connection.getresponse()
                payload = response.read()
                return response.status, response.getheader('Set-Cookie'), payload
            try:
                self.assertEqual(request('/dashboard.html')[0], 200)
                self.assertEqual(request('/api/auth/login', {'username': 'student@example.test', 'password': 'wrong'})[0], 401)
                status, cookie, _ = request('/api/auth/login', {'username': 'Student@Example.Test', 'password': 'original-password', 'remember': True})
                self.assertEqual(status, 200)
                self.assertIn('HttpOnly', cookie)
                self.assertIn('Max-Age=2592000', cookie)
                cookie = cookie.split(';')[0]
                self.assertEqual(request('/dashboard.html', cookie=cookie)[0], 200)
                self.assertEqual(request('/api/auth/me', cookie=cookie)[0], 200)
                self.assertEqual(request('/api/account/password', {'currentPassword': 'original-password', 'newPassword': 'replacement-password'}, cookie, 'http://evil.test')[0], 403)
                self.assertEqual(request('/api/account/password', {'currentPassword': 'wrong', 'newPassword': 'replacement-password'}, cookie)[0], 400)
                self.assertEqual(request('/api/account/password', {'currentPassword': 'original-password', 'newPassword': 'replacement-password'}, cookie)[0], 200)
                self.assertFalse(server.auth('verify', 'student@example.test', 'original-password'))
                self.assertTrue(server.auth('verify', 'student@example.test', 'replacement-password'))
                self.assertEqual(request('/api/auth/logout', {}, cookie)[0], 200)
                self.assertEqual(request('/api/auth/me', cookie=cookie)[0], 401)
                self.assertEqual(request('/profile.html', cookie=cookie)[0], 200)
                with closing(sqlite3.connect(server.DATABASE)) as db:
                    stored = db.execute('SELECT password_hash FROM users').fetchone()[0]
                    self.assertEqual(len(stored), 32)
                    self.assertNotIn(b'replacement-password', stored)
            finally:
                connection.close()
                service.shutdown()
                service.server_close()
                thread.join()


if __name__ == '__main__':
    unittest.main()
