---
tags: [Gitea, Webhook, Python]
title: 使用 Python 内置模块接收 Gitea Webhook 以自动更新
slug: python-gitea-webhook
---

## 动机

由于完全没找到个像样的Webhook轮子和自动更新轮子，所以自己乱写了一个。单线程，但是it just works™

## Gitea

以下假设你的生产服务器地址为`192.168.33.44`。

跑Gitea的服务端要改一下`custom/conf/app.ini`，最后加上以下这一段内容，然后重启Gitea

（loopback指的是跑Gitea的服务器自己）

```ini
[webhook]
ALLOWED_HOST_LIST = 192.168.33.44,loopback
```

`设置`->`Web 钩子`->`添加 Web 钩子`->`Gitea`，`HTTP 方法`选`POST`，目标 URL 写`http://192.168.33.44:53100/gitea-update`，密钥文本写`TESTPASSWORD123`

## 服务端

Git要配置好，可以直接从Gitea拉仓库那种

首先你需要装一个[NSSM](https://nssm.cc/download)，这里用稳定版（`nssm 2.24 (2014-08-31)`）就行

`nssm install service_name`把你的程序加一个服务，`nssm install "service_name updater"`把你的更新器加一个服务，记得设置好工作目录

`updater.py`直接丢代码，不解释了，自己看吧。

```python
import hmac
from http.server import HTTPServer, BaseHTTPRequestHandler
from traceback import format_exc
import os

IP = '192.168.33.44'
PORT = 53100
SECRET_KEY = b'TESTPASSWORD123'

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args, **kwargs):
        pass
    def do_POST(self):
        if not self.path.startswith("/gitea-update"):
            self.send_response(404)
            self.end_headers()
            return
        header_signature = self.headers.get('X-Gitea-Signature', '')
        if not header_signature:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"header signature missing")
            return
        if not self.headers.get('Content-Length', False):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"content length missing")
            return
        payload = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        payload_signature = hmac.new(key=SECRET_KEY, msg=payload, digestmod='sha256').hexdigest()
        if header_signature != payload_signature:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"payload signature verify failed")
            print(payload_signature, header_signature)
            return
        try:
            ret = os.system("nssm stop service_name")
            ret = os.system("git pull")
            assert not ret
            ret = os.system("nssm start service_name")
            assert not ret
        except AssertionError:
            self.send_response(502)
            self.end_headers()
            self.wfile.write(bytes(format_exc(), "utf8"))
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"success")

with HTTPServer((IP, PORT), Handler) as httpd:
    httpd.serve_forever()
```
