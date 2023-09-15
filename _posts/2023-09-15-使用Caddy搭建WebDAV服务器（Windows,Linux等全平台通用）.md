---
tags: [Caddy, WebDAV]
title: 使用 Caddy 搭建 WebDAV 服务器（Windows, Linux 等全平台通用）
slug: caddy-webdav
last_modified_at: 2023-9-15
---

## 前言

IIS的WebDAV太烂，于是有了本博文。以下步骤使用的环境为Windows Server 2012 R2。

## 安装

### 下载

先[在官方页面下载](https://caddyserver.com/download)Caddy可执行文件，记得下载前选中`mholt/caddy-webdav`这一插件。
把这个文件重命名为`caddy.exe`后丢到这里：`C:\Program Files\Caddy\caddy.exe`

### 自启动

根据[官方教程](https://caddyserver.com/docs/running#windows-service)，安装为服务：

```shell
sc.exe create caddy start= auto binPath= "C:\Program Files\Caddy\caddy.exe run"
```

> 这样做会有个[漏洞](https://cloud.tencent.com/developer/article/2120444)，好孩子不要学。

### Caddyfile

把以下文件丢到和`caddy.exe`同一目录下即可

```plain
{
	order webdav last
}
:53091 {
	handle_path /files/* {
		file_server browse
	}
	redir /files /files/

	handle /webdav/* {
		webdav {
			root E:/ftp
			prefix /webdav
		}
	}
	redir /webdav /webdav/

	basicauth /webdav/* {
		ftp $2a$14$8kAfyt3R70WGiKl.gxdrKeMxGGQpqRjy2bAvsrkkfIyW5Y15rDkPi
	}
}
```

具体来说：

- `:53091`：绑定到`0.0.0.0:53091`
- `handle_path /files/*`：在`/files`路径下显示一个Web页面用于浏览器访问
- `handle /webdav/*`：在`/webdav`路径下处理`WebDAV`服务，根目录为`E:/ftp`
- `basicauth /webdav/*`：只允许用户名为`ftp`、密码为`a`的用户访问。这里的密码已经hash过，可以使用`caddy hash-password`生成。

## 使用

### Windows

首先解除一些限制[^1]：

```shell
reg add HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters /v BasicAuthLevel /t REG_DWORD /d 2 /f
reg add HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters /v FileSizeLimitInBytes /t REG_DWORD /d 0xffffffff /f
net stop webclient
net start webclient
```

右键“此电脑”，选择“映射网络驱动器”，文件夹写`http://192.168.66.66:53091/webdav`，勾选“使用其他凭据连接”。在弹出的登录提示中用户名输入“ftp”，密码输入“a”。

[^1]:[win10原生webdav设置的问题](https://juejin.cn/post/6992463338160521230)
