from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
paths = ['/api/cues?enabled_only=false', '/api/users', '/api/admin/stats']
for p in paths:
    res = client.get(p)
    print('PATH', p)
    print(res.status_code)
    print(res.text)
    print('---')
