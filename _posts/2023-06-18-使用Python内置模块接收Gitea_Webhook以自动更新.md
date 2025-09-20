---
tags: [Gitea]
title: 使用 Python 内置模块接收 Gitea Webhook 以自动更新
slug: python-gitea-webhook
last_modified_at: 2023-7-1
---

## 动机

由于完全没找到个像样的Webhook轮子和自动更新轮子，所以自己乱写了一个。单线程，但是it just works™

## Gitea

以下假设你的生产服务器地址为`192.168.33.44`。

### 配置文件

> [Webhook 配置文件文档](https://docs.gitea.com/administration/config-cheat-sheet#%EF%B8%8F%E6%97%B6%E6%95%88%E6%80%A7%E8%AD%A6%E5%91%8A%EF%B8%8F:~:text=for%20shooting%20webhooks.-,ALLOWED_HOST_LIST,-%3A%20external%3A%20Webhook)，包括对`loopback`等特殊取值的说明

跑Gitea的服务端要改一下`custom/conf/app.ini`，最后加上以下这一段内容，然后重启Gitea

（`loopback`指的是跑Gitea的服务器自己，一般不建议添加）

```ini
[webhook]
ALLOWED_HOST_LIST = 192.168.33.44,loopback
```

### Webhook 设置

> [Webhook 配置文档](https://docs.gitea.com/zh-cn/usage/webhooks)

`设置`->`Web 钩子`->`添加 Web 钩子`->`Gitea`，`HTTP 方法`选`POST`，目标 URL 写`http://192.168.33.44:53100/gitea-update`，密钥文本写`TESTPASSWORD123`

## 服务端

Git要配置好，可以直接从Gitea拉仓库那种

首先你需要装一个[NSSM](https://nssm.cc/download)，这里用稳定版（`nssm 2.24 (2014-08-31)`）就行。记得要用你配置好了`Git`的系统账户（而非`SYSTEM`）运行服务！

`nssm install service_name`把你的程序加一个服务，`nssm install "service_name updater"`把你的更新器加一个服务，记得设置好工作目录

`updater.py`直接丢代码，不解释了，自己看吧。代码可以任意使用。

```python
"""
监听 Gitea webhook 以自动更新
"""
import hmac
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

# from traceback import format_exc
import os
from threading import Thread, Lock

IP: str = "192.168.33.44"
PORT: int = 53100
SECRET_KEY: bytes = b'TESTPASSWORD123'
# MIN_UPDATE_INTERVAL: float = 10.0  # 最小更新间隔，防止频繁更新
TARGET_BRANCH: str = "master"  # 需要监听的分支
UPDATEING_LOCK: Lock = Lock()  # 更新锁，防止同时更新


def do_update() -> list:
    """
    执行更新
    """
    with UPDATEING_LOCK:
        ret: list = []
        ret.append(os.system("nssm stop gh-bgs"))
        ret.append(
            os.system("git pull")
        )  # git fetch --all # git reset --hard origin/master
        ret.append(os.system("nssm start gh-bgs"))
    return ret


class Handler(BaseHTTPRequestHandler):
    """
    处理 HTTP 请求
    """

    def log_message(self, *args, **kwargs):
        pass

    def do_POST(self):
        """
        处理 POST 请求
        """
        if not self.path.startswith("/gitea-update"):
            self.send_response(404)
            self.end_headers()
            return
        header_signature = self.headers.get("X-Gitea-Signature", "")
        if not header_signature:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Header signature missing")
            return
        if not self.headers.get("Content-Length", False):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Content-Length missing")
            return
        payload = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        payload_signature = hmac.new(
            key=SECRET_KEY, msg=payload, digestmod="sha256"
        ).hexdigest()
        if header_signature != payload_signature:
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Payload signature verify failed")
            print(payload_signature, header_signature)
            return
        payload_dict = json.loads(payload.decode("utf-8"))
        if payload_dict["ref"] != f"refs/heads/{TARGET_BRANCH}":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(
                b"Not target branch " + TARGET_BRANCH.encode("utf-8") + ", ignored."
            )
            return
        update_thread = Thread(target=do_update)
        update_thread.start()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Success")


with HTTPServer((IP, PORT), Handler) as httpd:
    httpd.serve_forever()

```
