---
tags: [iPad, 盗版]
title: 永久白嫖 Notability Classic
slug: notability-classic
last_modified_at: 2026-09-19
---

可以通过 10.5 -> 12.0.3 -> 14.10.6 获取永久可用的 Notability Classic。需要在 Windows 上使用 iTunes 与“iOS旧版应用下载”，下载仅可用于本人账号的`.ipa`安装包，然后用爱思助手或 pymobiledevice3 安装。

原理上，直接从新版本降级到旧版本是可行的，不需要卸载已安装的 Notability。

（未验证，可能需要注意：）安装 10.5 并打开后，将设备断网，再升级到 12.0.3，打开后再升级到 14.10.6，随后才能在联网状态下使用。

至于更高版本，经过对`.ipa`的逆向分析，发现 14.10.11 和 15.0.0 都有定时的联网验证机制。据网友称，14.10.7 也会出现授权失败问题。
