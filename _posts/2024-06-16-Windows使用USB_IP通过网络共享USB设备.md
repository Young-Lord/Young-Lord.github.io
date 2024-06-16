---
tags: [Windows]
title: Windows 使用 USB/IP 通过网络共享 USB 设备
slug: windows-usbip
last_modified_at: 2024-6-16
---

以下内容中，`1-4`改为需要共享的`Bus ID`，`192.168.66.66`改为服务端的IP地址。

## 服务端

这台设备上应当插有你要共享的 USB 设备。

下载安装[usbipd-win](https://github.com/dorssel/usbipd-win)。

重启电脑，或直接使用`sc start usbipd`启动服务端。

- 列出所有设备：`usbipd list`
- 绑定设备，以供外部使用：`usbipd bind -b 1-4`
- 取消绑定设备：`usbipd unbind -b 1-4`

## 客户端

首先，下载[usbip-win](https://github.com/cezanne/usbip-win)（本项目已不维护）。

接着按照[说明](https://github.com/cezanne/usbip-win/?tab=readme-ov-file#windows-usbip-client)安装证书、启用测试签名（注意，此步有**极大安全风险**！）：

```powershell
Import-PfxCertificate -FilePath .\usbip_test.pfx -CertStoreLocation Cert:\LocalMachine\AuthRoot -Password (ConvertTo-SecureString "usbip" -AsPlainText -Force)
Import-PfxCertificate -FilePath .\usbip_test.pfx -CertStoreLocation Cert:\LocalMachine\TrustedPublisher -Password (ConvertTo-SecureString "usbip" -AsPlainText -Force)
bcdedit /set testsigning on
```

接着安装驱动。这里我只能用`vhci(wdm)`的，也就是`usbip.exe install -w`。你也可以尝试`vhci(ude)`，即使用`usbip.exe install -u`。

重启。

此时桌面会显示水印，以警告**不安全**的测试模式。可以使用[Universal Watermark Disabler](https://winaero.com/download-universal-watermark-disabler/)移除。

- 连接设备：`usbip attach -r 192.168.66.66 -b 1-4`
- 查看已连接设备：`usbip port`
- 断开已连接设备：`usbip detach -p 0`（此处的`0`改为设备端口号；端口号在连接时会显示，也可以使用`usbip port`查看）
