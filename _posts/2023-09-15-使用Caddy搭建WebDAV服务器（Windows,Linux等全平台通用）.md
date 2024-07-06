---
tags: [Caddy, WebDAV]
title: 使用 Caddy 搭建 WebDAV 服务器（Windows, Linux 等全平台通用）
slug: caddy-webdav
last_modified_at: 2024-7-6
---

## 前言

IIS的WebDAV太烂，于是有了本博文。以下步骤使用的环境为Windows Server 2012 R2。

## 安装

### 下载

先[在官方页面下载](https://caddyserver.com/download)Caddy可执行文件，记得下载前选中`mholt/caddy-webdav`这一插件。
把这个文件重命名为`caddy.exe`后丢到这里：`C:\Program Files\Caddy\caddy.exe`

### 自启动

> 这一步使用[NSSM](https://nssm.cc/)也可以，而且更简单，更强大。

根据[官方教程](https://caddyserver.com/docs/running#windows-service)，安装为服务：

CMD写法：

```bat
sc.exe create caddy start= auto binPath= "\"C:\Program Files\Caddy\caddy.exe\" run"
```

Powershell写法：

```powershell
New-Service -Name "caddy" -StartupType Automatic -BinaryPathName '"C:\Program Files\Caddy\caddy.exe" run'
```

> 路径不加引号的话会有个[漏洞](https://cloud.tencent.com/developer/article/2120444)，好孩子不要学。

### Caddyfile

把以下文件丢到和`caddy.exe`同一目录下即可

```plain
{
	order webdav last
}
:53091 {
	# handle_path /files/* {
	# 	file_server browse
	# }
	# redir /files /files/

	handle /webdav/* {
		webdav {
			root E:/ftp
			prefix /webdav
		}
	}
	redir /webdav /webdav/

	basicauth /webdav/* {
		ftp $2a$14$2YDpvmb4hf8Q0GLx8TJw8eQoa4qvkpaKbYHa0RLv5J4IHzdeVTVkG
	}
}
```

具体来说：

- `:53091`：绑定到`0.0.0.0:53091`
- `handle_path /files/*`：在`/files`路径下显示一个Web页面，用于浏览器访问。与WebDAV功能无关，但可以用于快速确认防火墙配置是否正确、Caddy是否正常运行等。
- `handle /webdav/*`：在`/webdav`路径下处理`WebDAV`服务，根目录为`E:/ftp`（如果用中文文件名，记得要用`UTF-8`编码保存文件）（此处注意路径分隔符必须用`/`而非`\`）
- `basicauth /webdav/*`：只允许用户名为`ftp`、密码为`pwd123`的用户访问。这里的密码已经hash过，可以使用`caddy hash-password`生成。

### ACL（更高级的分用户权限控制）

不好意思没有，需要的可以使用[Caddy 1的类似插件](https://github.com/hacdias/caddy-v1-webdav)。（[相关issue](https://github.com/mholt/caddy-webdav/issues/15)）

## 使用

### Windows

##### 使用`rclone`（建议）

> 参考链接：[^2]

下载安装[WinFsp](https://github.com/winfsp/winfsp/releases/latest)，下载[rclone](https://github.com/rclone/rclone/releases/latest)，进入`rclone.exe`所在目录，随后按参考链接完成配置。

<del>[FUSE](https://zhuanlan.zhihu.com/p/106719192): 遥遥领先！</del>

开机自启动可以用Windows服务（略），也可以直接用上一部分那个开机自启动脚本：

把`.bat`文件里的内容进行如下更改（[关于参数的详细解释](https://blog.xiaoz.org/archives/15519)）：

```bat
chcp 65001
pushd "C:\Program Files\rclone"
rclone mount myftp:/ Z: --vfs-cache-mode full
```

（这里的 myftp 是 rclone 配置文件中的名称，Z: 是挂载的盘符，--vfs-cache-mode full 是启用缓存）

然后应该就好了。Linux/macOS也可以用类似的方法，在此略去。

##### 使用Windows内置工具（不建议）

首先解除一些限制[^1]：

```bat
reg add HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters /v BasicAuthLevel /t REG_DWORD /d 2 /f
reg add HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters /v FileSizeLimitInBytes /t REG_DWORD /d 0xffffffff /f
net stop webclient
net start webclient
```

建议：编辑`C:\Windows\System32\drivers\etc\hosts`，加入一行`ftp.local 192.168.66.66`（根据实际情况更改）以更好同时挂载到同一个IP地址下的不同网络驱动器。如果这样做，下面的`192.168.66.66`也要对应改为`ftp.local`

###### 内置工具 - “映射网络驱动器”（不建议）

右键“此电脑”，选择“映射网络驱动器”，文件夹写`http://192.168.66.66:53091/webdav`，勾选“使用其他凭据连接”。在弹出的登录提示中用户名输入“ftp”，密码输入“pwd123”。

为什么不建议？这样做无法实现开机自动连接，而且每次都要弹出一次密码输入框（即使你已经选择了“记住凭据”）。

###### 内置工具 - 远古的`net use`命令（不建议）

```bat
chcp 65001
:TRY
net use Z: http://192.168.66.66:53091/webdav /Persistent:Yes /USER:ftp pwd123 /Y 2>&1|find "找不到网络名">nul
if %errorlevel%==0 (
   timeout 10
    goto :TRY
) else (
    echo fin.
)
```

把这货丢进一个`bat`文件里，比如`C:\Program Files\LoginAtStartup\connect-with-net.bat`

```vb
DIM objShell 
set objShell = wscript.createObject("wscript.shell") 
iReturn = objShell.Run("cmd /c "&chr(34)&"C:\Program Files\LoginAtStartup\connect-with-net.bat"&chr(34)&"", 0, FALSE)
```

把这货丢进一个`vbs`文件里，再把它的快捷方式丢进`shell:startup`（也就是`C:\Users\%USERNAME%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`）下，就可以开机自动连接了。再次感叹一句Windows之屎。

为什么不建议？这货打开文件时传参是`http://`开头的链接，没几个软件能用。

#### 使用RaiDrive

[RaiDrive](https://www.raidrive.com/)专为挂载WebDAV等远程连接设计，提供了简单易用的图形化界面。缺点是资源占用较高，且若不付费，功能严重受限。

### macOS

系统自带的“访达”就可以，详见[官方教程](https://support.apple.com/zh-cn/guide/mac-help/mchlp1546/mac)。

### Android

使用[MT管理器](https://mt2.cn/download/)（需要付费）、[FolderSync](https://foldersync.io/)（免费，有广告）均可，此处不展开。

### iOS

参考：[用好 WebDAV，我是如何在 Windows 和手机之间传输文件的](https://sspai.com/post/53942)

[^1]:[win10原生webdav设置的问题](https://juejin.cn/post/6992463338160521230)

[^2]:[使用rclone搭建webdav客户端](https://www.bilibili.com/read/cv21803909/)
