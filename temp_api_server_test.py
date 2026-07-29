import urllib.request
import urllib.error
for path in ['/api/cues?enabled_only=false', '/api/users', '/api/admin/stats']:
    url = 'http://127.0.0.1:8001' + path
    print('PATH', path)
    try:
        with urllib.request.urlopen(url) as res:
            print(res.status)
            print(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print('HTTP', e.code)
        try:
            print(e.read().decode('utf-8'))
        except Exception as read_err:
            print('READ ERR', read_err)
    except Exception as e:
        print('ERR', type(e).__name__, e)
    print('---')
