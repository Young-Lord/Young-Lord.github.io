---
tags: [Linux, WiFi]
title: Linux 修改 WiFi 监管数据
slug: linux-wireless-regdb
last_modified_at: 2025-09-20
---

## 免责声明

编写本文时，作者全程处于越南，且已获得相应行为的授权，没有进行任何绕过当地监管的行为。本文所述内容仅供学习和研究使用，请遵守你所在地区的无线电管制相关法律法规，请勿进行任何违法活动。作者不对因使用本文内容而产生的任何后果负责。

## 背景

由于我所在的越南的学校中，校园WiFi设置了AP隔离，导致设备间不能使用KDE Connect或LocalSend等软件，因此我需要在电脑端开一个热点来使手机连接。（在Windows上挺方便的，Linux怎么就这么麻烦呢？）

根据[相关教程](https://eonun.com/%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/Linux/Linux%E5%BC%80%E5%90%AFwifi%E5%92%8C%E7%83%AD%E7%82%B9%E5%8F%8C%E7%94%A8/)，对于我当前的设备而言，若要在连接WiFi的同时开启热点，开启的热点必须所连WiFi使用同一信道。

使用以下命令尝试开启热点：

```console
# /usr/bin/iw dev wlp98s0 interface add wlan0_ap type managed addr 11:19:26:08:17:11
# sudo create_ap wlan0_ap wlp98s0 "LY Hotspot" "Young-Lord Blog" --freq-band 5 -c `iw wlp98s0 info | grep channel | head -n1 | cut -f2 -d" "` --ieee80211ax
```

（关于此处的获取信道，理论上也可使用`iwgetid -c -r`，但在我的实际测试中，后者有概率返回空值）

失败。

根据[Arch Wiki](https://wiki.archlinux.org/title/Network_configuration/Wireless#Respecting_the_regulatory_domain)，配置好监管域：

```console
$ sudo pacman -S wireless-regdb
$ sudo iw reg set VN
$ iw reg get
global
country VN: DFS-FCC
        (2402 - 2482 @ 40), (N/A, 20), (N/A)
        (5170 - 5250 @ 80), (N/A, 17), (N/A)
        (5250 - 5330 @ 80), (N/A, 24), (0 ms), DFS
        (5490 - 5730 @ 80), (N/A, 24), (0 ms), DFS
        (5735 - 5835 @ 80), (N/A, 30), (N/A)
```

此时，对于大部分频段，可以正常工作，但对于`52`等依赖于[DFS](https://en.wikipedia.org/wiki/Dynamic_frequency_selection)的信道，仍然无法工作:

```plaintext
hostapd command-line interface: hostapd_cli -p /tmp/create_ap.wlan0_ap.conf.r8rNb0ye/hostapd_ctrl
Frequency 5260 (primary) not allowed for AP mode, flags: 0x979 RADAR
Primary frequency not allowed
ap0: IEEE 802.11 Configured channel (52) or frequency (5260) (secondary_channel=0) not found from the channel list of the current mode (2) IEEE 802.11a
ap0: IEEE 802.11 Hardware does not support configured channel
Could not select hw_mode and channel. (-3)
ap0: interface state UNINITIALIZED->DISABLED
ap0: AP-DISABLED 
ap0: Unable to setup interface.
ap0: interface state DISABLED->DISABLED
ap0: AP-DISABLED 
ap0: CTRL-EVENT-TERMINATING 
hostapd_free_hapd_data: Interface ap0 wasn't started
nl80211: deinit ifname=ap0 disabled_11b_rates=0
```

本文旨在解除这一限制，使得在合法合规的前提下，能够在硬件不支持的设备（如我的笔记本电脑）上使用DFS信道。

## 正文

较早（<4.15）版本的Linux内核中需要使用[CRDA (Central Regulatory Domain Agent)](https://wireless.docs.kernel.org/en/latest/en/developers/regulatory/crda.html#status)对监管数据进行管理，而在较新版本的内核中，CRDA已不再需要，监管数据直接由[cfg80211](https://www.kernel.org/doc/html/v6.16/driver-api/80211/cfg80211.html)处理。

目前，Arch Linux中与`cfg80211`相关的内核配置为：

```console
$ zcat /proc/config.gz | grep CFG80211
CONFIG_CFG80211=m
# CONFIG_CFG80211_DEVELOPER_WARNINGS is not set
CONFIG_CFG80211_REQUIRE_SIGNED_REGDB=y
CONFIG_CFG80211_USE_KERNEL_REGDB_KEYS=y
CONFIG_CFG80211_DEFAULT_PS=y
CONFIG_CFG80211_DEBUGFS=y
CONFIG_CFG80211_CRDA_SUPPORT=y
CONFIG_CFG80211_WEXT=y
```

可以看到，`cfg80211`已作为模块被启用，并且监管数据库需要签名。

### 禁用监管数据库签名验证

这部分内容挺乱来的，不过它工作™。更新Linux内核后需要重新操作，目前我没有什么好的解决方案。

两个小节的方案二选一即可。

#### 修改源代码

首先获取一份当前内核源码：`git clone https://github.com/archlinux/linux.git -b v$(uname -r | cut -d- -f1-2) --depth 1 && cd linux`

如果本地已经有一份内核源码：`git reset --hard HEAD && git fetch origin v$(uname -r | cut -d- -f1-2) --depth 1 && git checkout v$(uname -r | cut -d- -f1-2)`

进入`net/wireless`目录：`cd net/wireless`

修改`reg.c`，将其中的`#ifdef CONFIG_CFG80211_REQUIRE_SIGNED_REGDB`改为`#ifdef CONFIG_CFG80211_REQUIRE_SIGNED_REGDB_DUCK`：`sed -i 's/CONFIG_CFG80211_REQUIRE_SIGNED_REGDB/CONFIG_CFG80211_REQUIRE_SIGNED_REGDB_DUCK/g' reg.c`

使用`make -C /lib/modules/$(uname -r)/build M=$(pwd) modules -j$(nproc)`编译，得到`cfg80211.ko`。

使用`sudo make -C /lib/modules/$(uname -r)/build M=$(pwd) INSTALL_MOD_STRIP=1 modules_install && sudo depmod`替换掉当前的`cfg80211`模块。

可以使用`modinfo -n cfg80211`验证当前正在使用的模块路径，其应当为`/lib/modules/$(uname -r)/updates/cfg80211.ko.zst`。

（如果不使用`make modules_install`，而是直接压缩`cfg80211.ko`并覆盖原先的`/lib/modules/$(uname -r)/kernel/net/wireless/cfg80211.ko.zst`，也可以达到预期效果）

#### 直接修改证书

直接把`/lib/modules/$(uname -r)/kernel/net/wireless/cfg80211.ko.zst`解压，patch其中硬编码的证书，然后重新压缩回去即可。实操难度有点大所以就不写具体过程了（如果你成功了建议给我发个PR）。顺带一提证书是`X.509 DER`格式的，可以在内核源码的`net/wireless/certs`目录下找到，可以用`openssl x509 -in cert.bin -text -noout`解析。

### 修改监管数据

下载一份[wireless-regdb](https://git.kernel.org/pub/scm/linux/kernel/git/wens/wireless-regdb.git)：`git clone https://git.kernel.org/pub/scm/linux/kernel/git/wens/wireless-regdb.git`

开个Python虚拟环境，安装`m2crypto`，或者要是你喜欢`aur/python-m2crypto`也行。

打开`db.txt`，找到对应国家的监管数据，修改。此处只需删去`, DFS`即可。删去前请确保你已经完全理解此操作后果并且承担一切法律责任。修改结果如下所示：

```plaintext
country VN: DFS-FCC
        (2402 - 2482 @ 40), (20)
        (5170 - 5250 @ 80), (17)
        (5250 - 5330 @ 80), (24)
        (5490 - 5730 @ 80), (24)
        (5735 - 5835 @ 80), (30)
```

完成后，构建并安装：`make maintainer-clean && make && sudo make install`

### 使用新的监管数据

重启，随后使用`iw reg`设置、查询监管域，结果如下：

```console
$ sudo iw reg set VN
$ iw reg get
global
country VN: DFS-FCC
        (2402 - 2482 @ 40), (N/A, 20), (N/A)
        (5170 - 5250 @ 80), (N/A, 17), (N/A)
        (5250 - 5330 @ 80), (N/A, 24), (0 ms)
        (5490 - 5730 @ 80), (N/A, 24), (0 ms)
        (5735 - 5835 @ 80), (N/A, 30), (N/A)
```

开启热点测试，成功。

### 善后

记得屏蔽`wireless-regdb`的自动更新，在`/etc/pacman.conf`的`IgnorePkg`里加一条就行，或者用`NoUpgrade`阻止监管数据被更新。不过如果没有一个自动化patch`cfg80211`的方案的话，这样做可能只会让你每次内核更新后都用回最严格的监管数据……
