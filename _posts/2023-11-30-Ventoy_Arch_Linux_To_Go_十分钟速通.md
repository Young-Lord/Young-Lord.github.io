---
tags: [Arch Linux, Ventoy]
title: Ventoy Arch Linux To Go 十分钟速通
slug: arch-to-go
last_modified_at: 2023-12-2
---

## 前言

最近不是[CanoKey](https://item.taobao.com/item.htm?id=664914723920)有货了嘛，想买一个来玩玩gpg。gpg公钥显然需要离线生成，刚好几个月前参加科苗的时候认识了一个用Ventoy跑Fedora的人，于是就想到了用Ventoy做一个Arch Linux To Go。

中途出了一大堆问题，于是水了这篇博文以防后人踩坑。

## 准备

- 16GB起步的U盘或移动硬盘，安装[Ventoy](https://www.ventoy.net/)
- [VirtualBox](https://www.virtualbox.org/) <del>甲骨文什么时候\*啊</del>
- [Arch Linux镜像](https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/latest/archlinux-x86_64.iso)

## 安装

### Arch安装

启动VirtualBox，新建个虚拟机，配置时有两点需要注意的：

- 勾选“启用 EFI”
- 创建虚拟硬盘时选择“预先分配全部空间”，如果只是给CanoKey用的话8GB就够了（这个以后可以扩容，）

开机，启动`archinstall`，我的配置如下（默认值省略）：

- Mirrors: Region: China
- Disk configuration: Use a best-effort default partition layout -> 选中那个比较大的盘（`ATA VBOX HARDDISK`;`/dev/sda`;`scsi`） -> btrfs -> yes -> yes（一路Enter就行）
- Bootloader: Systemd-boot（默认值）（这里要是默认值是`Grub`且没有`Systemd-boot`就可以重开了，你没开`EFI`）
- Swap: no<del>（真有人拿U盘当swap？要是是移动硬盘之类的可以视情况调整）</del>（其实这个[貌似](https://github.com/archlinux/archinstall/blob/4955b64a8c596d3eafa1b96b74e915ad12b3fe63/archinstall/lib/installer.py#L710)是[zram](https://wiki.archlinux.org/title/Zram)而非swap分区或Swapfile，所以开应该也没关系…吧？）
- Hostname: livearch（自行输入）
- Root password: 自行输入
- User account: 自行输入，我这里用户名为`user`，并且给予了`sudo`权限
- Profile: Type -> Desktop -> Xfce4
- Audio: Pipewire（可选，不用声音的话不装也行）
- Network configuration: NetworkManager（要是你用别的方法能装包，也可以不装）
- Timezone: Asia/Shanghai
- NTP: True（时间同步，如果你的Timezone与宿主机（也就是你插U盘进去那台机）上的Timezone不一致的话建议不开，否则可能会搞乱宿主机的系统时间）

配置完后直接Install。

安装完成后用`poweroff`关闭虚拟机，移除虚拟光驱，重启。

### 配置

安装VirtualBox Guest Additions，参考[官方教程](https://wiki.archlinux.org/title/VirtualBox/Install_Arch_Linux_as_a_guest#Install_the_Guest_Additions)即可。（`sudo pacman -Syyu virtualbox-guest-utils && sudo systemctl enable vboxservice && sudo systemctl start vboxservice`），重启。

用任何方法（[比如这个](https://github.com/CHH3213/clash-for-windows-backup/releases)）丢一份<del>已经死去的</del>`Clash For Windows`进去，配置好代理。可以使用proxyman（`yay -S proxyman-git`）

装上`yay`，参考[官方教程](https://github.com/Jguer/yay#installation)即可。

此时可以从AUR装个`clash-for-windows-bin`来替代之前自己丢进去的版本（注意安装过程必须使用代理）。

安装一系列基础包：`yay -S --needed curl wget nano vim p7zip which lvm2 git noto-fonts-cjk ntfs3g`

关于网络连接，使用`network-manager-applet`即可，参考[官方教程](https://wiki.archlinux.org/title/NetworkManager#nm-applet)可以在任务栏管理网络连接；如果不装，也可以使用`nmcli`与`nmtui`管理网络连接。

（可能需要）`yay -S mkinitcpio-firmware`

（可能需要）修改`/etc/mkinitcpio.conf`，把`autodetect`删掉

### 配置mkinitcpio

这一步主要是把`/boot/loader/entries`中的PARTUUID改为UUID，否则在UEFI模式下会无法启动。

```console
[user@livearch entries]$ cat /boot/loader/entries/*.conf | grep --color=auto PARTUUID
options root=PARTUUID=77e06bbc-e680-44fa-a5eb-47f2a38967f9 zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs
options root=PARTUUID=77e06bbc-e680-44fa-a5eb-47f2a38967f9 zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs
# 77e06bbc-e680-44fa-a5eb-47f2a38967f9 是系统盘非 boot 分区的 PARTUUID，记住备用
[user@livearch entries]$ lsblk
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda      8:0    0    6G  0 disk 
├─sda1   8:1    0  512M  0 part /boot
└─sda2   8:2    0  5.5G  0 part /var/cache/pacman/pkg
                                /var/log
                                /home
                                /.snapshots
                                /
zram0  254:0    0  1.2G  0 disk [SWAP]
[user@livearch entries]$ blkid
/dev/sda2: UUID="3292b807-b6b5-4fd5-b50d-9dfdcf01088c" UUID_SUB="2906f50a-1e9b-4629-863b-c2f151e35d63" BLOCK_SIZE="4096" TYPE="btrfs" PARTUUID="77e06bbc-e680-44fa-a5eb-47f2a38967f9"
/dev/sda1: UUID="EA53-4B91" BLOCK_SIZE="512" TYPE="vfat" PARTUUID="503e184d-c5db-425f-84d7-572495267d53"
# 这里可以看到 sda2 的 UUID 是 3292b807-b6b5-4fd5-b50d-9dfdcf01088c，记住备用
[user@livearch entries]$ sudo sed -i.bak 's/PARTUUID=77e06bbc-e680-44fa-a5eb-47f2a38967f9/UUID=3292b807-b6b5-4fd5-b50d-9dfdcf01088c/' /boot/loader/entries/*.conf
# 这里把 PARTUUID 改成了 UUID，否则在 UEFI 模式下会无法启动
# https://github.com/ventoy/vtoyboot/issues/52
[user@archlinux entries]$ tail -n +1 /boot/loader/entries/*.conf
==> /boot/loader/entries/2023-11-30_13-31-20_linux.conf <==
# Created by: archinstall
# Created on: 2023-11-30_13-31-20
title   Arch Linux (linux)
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options root=UUID=3292b807-b6b5-4fd5-b50d-9dfdcf01088c zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs

==> /boot/loader/entries/2023-11-30_13-31-20_linux-fallback.conf <==
# Created by: archinstall
# Created on: 2023-11-30_13-31-20
title   Arch Linux (linux-fallback)
linux   /vmlinuz-linux
initrd  /initramfs-linux-fallback.img
options root=UUID=3292b807-b6b5-4fd5-b50d-9dfdcf01088c zswap.enabled=0 rootflags=subvol=@ rw rootfstype=btrfs

```

### 配置Grub

```shell
sudo pacman -S --needed grub lvm2
sudo grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub --removable
sudo grub-mkconfig -o /boot/grub/grub.cfg
sudo ./vtoyboot.sh
```

### Vtoyboot

下载[vtoyboot](https://github.com/ventoy/vtoyboot/releases/latest)并解压、安装：

```shell
7z x vtoyboot-*.iso
tar xvf vtoyboot-*.tar.gz
rm vtoyboot-*.iso vtoyboot-*.tar.gz
cd vtoyboot-*
sudo bash ./vtoyboot.sh
```

那几个`Possibly missing firmware for module:`一般没有影响，绝大部分固件是用不到的，不过如果你想隐藏警告的话可以自行从AUR安装`mkinitcpio-firmware`。

### CanoKey相关

```shell
yay -S --needed openssl gnupg ungoogled-chromium-bin python-pipx yubico-piv-tool swig opensc kleopatra canokey-usbip-git pcsclite pcsc-tools veracrypt
pipx ensurepath
pipx install yubikey-manager
pipx install canokey-manager
pipx install twisted
pipx install ipython
sudo modprobe vhci-hcd  # 手动加载usbip内核模块
echo vhci-hcd | sudo tee /etc/modules-load.d/vhci-hcd.conf  # 开机自动加载usbip内核模块

## 模拟 CanoKey 的 canokey-usbip 相关
# canokey-usbip /tmp/canokey-file 3240 true &
# sudo usbip attach -r localhost -b 1-1.1

## 允许非 root 用户访问 USB 设备
# /etc/udev/rules.d/69-canokeys.rules
# 按照CanoKey官方教程 https://docs.canokeys.org/userguide/setup/#udev 配置，最后一行取消注释
# 完成后运行 sudo udevadm control --reload-rules && sudo udevadm trigger
# 重启后生效

## 用于测试RDP共享CanoKey
# yay -S --needed remmina freerdp
# 在 Advanced -> USB device redirection 中填入 id:20a0:42d4 即可。

## pcsc 相关，用于ckman等软件连接CanoKey
sudo systemctl enable pcscd.socket
sudo systemctl enable pcscd
# 注意，这个会导致gnupg无法配置智能卡，解决方案以下两种任选一种即可。
#
# 第一种方案：使gnupg使用pcscd（我仅用了这个就可以了，完整内容可以参考下面的Arch Wiki链接）
# echo disable-ccid >> $HOME/.gnupg/scdaemon.conf
# gpg-connect-agent 'SCD KILLSCD' /bye
# 可能需要：使gnupg支持pcscd共享访问
# echo pcsc-shared >> $HOME/.gnupg/scdaemon.conf
# gpg-connect-agent 'SCD KILLSCD' /bye：
#
# 第二种方案：停止pcscd（不推荐）
# sudo systemctl stop pcscd.socket
# sudo systemctl stop pcscd
#
# 完成任意一种方案后，重新插入CanoKey。
# 参考资料：https://wiki.archlinux.org/title/GnuPG#GnuPG_with_pcscd_(PCSC_Lite)
# 参考资料： https://support.nitrokey.com/t/nk3-mini-gpg-selecting-card-failed-no-such-device-gpg-card-setup/5057/7

## 关于gpg操作智能卡
# gpg --card-status
# 最下面的`General key info`是key上的密钥与本机的`.gnupg`中的公钥的交集，如果为`[none]`，使用key前需要先在本机的gnupg导入对应key的公钥。

## 如果浏览器无法连接到CanoKey，可以尝试以下方法
# killall gpg gpg-agent ssh-agent pcscd
# sudo systemctl stop pcscd.socket
# sudo systemctl stop pcscd

## 关于密钥冷备份：
# 使用 `sudo mkdir /mnt/cold && sudo mount -t ntfs /dev/sdb3 /mnt/cold`挂载外接设备，这里可以直接挂载Ventoy安装时位于分区表尾部的保留空间。
# 建议使用 VeraCrypt 进行加密。
# 使用 gpg --home /mnt/veracrypt/.gnupg xxx 进行操作。注意`--home`必须是第一个参数。
# 这里可能需要适当进行`killall gpg-agent`等操作防止奇怪的bug。

## 关于gpg授权ssh
# 直接看Arch Wiki和另外一些资料即可。
# https://wiki.archlinux.org/title/GnuPG#SSH_agent
# https://zhuanlan.zhihu.com/p/397614510
# 生成密钥时记得开`--expert`，并且添加Authentication的Capability。
# 大体来说每次使用是这些命令，注意我这里是在`.gnupg`命令下执行的。
# sudo systemctl start sshd
# set SSH_AGENT_PID=""
# export SSH_AUTH_SOCK=$(gpgconf --home . --list-dirs agent-ssh-socket)
# gpgconf --home . --launch gpg-agent
# export GPG_TTY=$(tty)
# gpg-connect-agent --home . updatestartuptty /bye >/dev/null
# ssh localhost  # 这个时候会让你输入CanoKey的PIN，（前提是你本地没有存私钥，只存了公钥）
```

关于Web Console，[新版](https://console.canokeys.org/)（可能）可以直接作为Chrome PWA应用安装，[旧版](https://console-legacy.canokeys.org/)可以使用我打包过的离线运行（`yay -S canokey-console-legacy`）。

关于`gpg-agent`，不用的时候记得kill掉以防止占用USB设备。

记得使用`shred -u -v`保证文件私密性。

## 丢进Ventoy

把那个vdi文件加个后缀`.vtoy`，丢进Ventoy。重启，选择此文件，就可以进入Arch了。

这里建议测试一下是否在`UEFI`（主要与`mkinitcpio`有关）及`Legacy BIOS`（主要与`grub`有关）启动模式下均能正常工作，方法不再赘述。

## 问题

### 使用UEFI启动时的1min30s延迟

UEFI启动时会有奇怪的`[ *** ] A start job is running for xxx (xxx / 1min 30s)`，不过不影响使用。根据我的猜测，这个问题成因是`boot`分区指向`/dev/dm-1`，因此`Systemd-boot`拒绝使用已挂载的`/boot`作为ESP。

有一些workaround：

- 使用Grub完全替换掉Systemd-boot：太麻烦了，不推荐
- 修改Systemd的默认timeout（把`/etc/systemd/system.conf`里的`DefaultDeviceTimeoutSec`改成`10s`）：不推荐，可能会导致其他问题
- 修改对应unit的timeout：没有成功。
- 阻止此服务运行：我的方法，没有出现其他问题，具体见下：

```shell
sudo mkdir /usr/lib/systemd/system-generators-backup
sudo mv /usr/lib/systemd/system-generators/systemd-gpt-auto-generator /usr/lib/systemd/system-generators-backup/systemd-gpt-auto-generator.bak
```

具体log（`journalctl -b`）：

```plain
Dec 02 00:19:00 archlinux systemd[1]: Job dev-disk-by\x2ddiskseq-3\x2dpart1.device/start timed out.
Dec 02 00:19:00 archlinux systemd[1]: Timed out waiting for device /dev/disk/by-diskseq/3-part1.
Dec 02 00:19:00 archlinux systemd[1]: Dependency failed for EFI System Partition Automount.
Dec 02 00:19:00 archlinux systemd[1]: efi.mount: Job efi.mount/start failed with result 'dependency'.
Dec 02 00:19:00 archlinux systemd[1]: dev-disk-by\x2ddiskseq-3\x2dpart1.device: Job dev-disk-by\x2ddiskseq-3\x2dpart1.device/start failed with result 'timeout'.
```

```console
[user@archlinux dev]$ bootctl
Couldn't find EFI system partition. It is recommended to mount it to /boot or /efi.
Alternatively, use --esp-path= to specify path to mount point.
System:
      Firmware: UEFI 2.70 (American Megatrends 5.13)
 Firmware Arch: x64
   Secure Boot: disabled (unknown)
  TPM2 Support: yes
  Boot into FW: supported

Current Boot Loader:
      Product: systemd-boot 254.6-2-arch
     Features: ✓ Boot counting
               ✓ Menu timeout control
               ✓ One-shot menu timeout control
               ✓ Default entry control
               ✓ One-shot entry control
               ✓ Support for XBOOTLDR partition
               ✓ Support for passing random seed to OS
               ✓ Load drop-in drivers
               ✓ Support Type #1 sort-key field
               ✓ Support @saved pseudo-entry
               ✓ Support Type #1 devicetree field
               ✓ Enroll SecureBoot keys
               ✓ Retain SHIM protocols
               ✓ Boot loader sets ESP information
          ESP: /dev/disk/by-partuuid/503e184d-c5db-425f-84d7-572495267d53
         File: └─/EFI/BOOT/BOOTX64.EFI

Random Seed:
 System Token: not set

Boot Loaders Listed in EFI Variables:
        Title: deepin
           ID: 0x0002
       Status: active, boot-order
    Partition: /dev/disk/by-partuuid/a0cda2b8-607d-4a98-ab39-4a267c7dd522
         File: └─/EFI/DEEPIN/SHIMX64.EFI

        Title: Windows Boot Manager
           ID: 0x0001
       Status: active, boot-order
    Partition: /dev/disk/by-partuuid/a0cda2b8-607d-4a98-ab39-4a267c7dd522
         File: └─/EFI/MICROSOFT/BOOT/BOOTMGFW.EFI

[user@archlinux dev]$ bootctl --esp-path=/boot
dm-1: Failed to get device property: No such file or directory
System: <OMITTED>

Current Boot Loader: <OMITTED>

Random Seed:
 System Token: not set
       Exists: yes

Available Boot Loaders on ESP:
          ESP: /boot
         File: ├─/EFI/systemd/systemd-bootx64.efi (systemd-boot 254.6-2-
arch)
               └─/EFI/BOOT/BOOTX64.EFI (systemd-boot 254.6-2-arch)

Boot Loaders Listed in EFI Variables: <OMITTED>

Boot Loader Entries:
        $BOOT: /boot
        token: arch

Default Boot Loader Entry:
         type: Boot Loader Specification Type #1 (.conf)
        title: Arch Linux (linux)
           id: 2023-11-30_13-31-20_linux.conf
       source: /boot//loader/entries/2023-11-30_13-31-20_linux.conf
        linux: /boot//vmlinuz-linux
       initrd: /boot//initramfs-linux.img
      options: root=UUID=3292b807-b6b5-4fd5-b50d-9dfdcf01088c zswap.enabled=0 ro
otflags=subvol=@ rw rootfstype=btrfs


[user@archlinux dev]$ ls -al /dev/dm-1
brw-rw---- 1 root disk 254, 1 Dec  2  2023 /dev/dm-1

[user@archlinux dev]$ mount | grep boot
/dev/mapper/ventoy1 on /boot type vfat (rw,relatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro)

[user@archlinux dev]$ ls -al /dev/mapper/ventoy1
lrwxrwxrwx 1 root root 7 Dec  2  2023 /dev/mapper/ventoy1 -> ../dm-1

[user@archlinux dev]$ lsblk
NAME          MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda             8:0    0 465.8G  0 disk 
sdb             8:16   1 115.5G  0 disk 
├─sdb1          8:17   1 100.5G  0 part 
│ └─ventoy    254:0    0     6G  0 dm   
│   ├─ventoy1 254:1    0   512M  0 dm   /boot
│   └─ventoy2 254:2    0   5.5G  0 dm   /var/log
│                                       /home
│                                       /var/cache/pacman/pkg
│                                       /.snapshots
│                                       /
├─sdb2          8:18   1    32M  0 part 
```

本段的参考资料：

- [global mounting default timeout of 1min 30s / System Administration / Arch Linux Forums](https://bbs.archlinux.org/viewtopic.php?id=191744)
- [systemd#GPT_partition_automounting - ArchWiki](https://wiki.archlinux.org/title/systemd#GPT_partition_automounting)
- [Why should I mount both /boot and /efi / Laptop Issues / Arch Linux Forums](https://bbs.archlinux.org/viewtopic.php?id=289331)
- [\[SOLVED\] systemd boot mounts to /efi despite specifying ESP path / Newbie Corner / Arch Linux Forums](https://bbs.archlinux.org/viewtopic.php?pid=2006888#p2006888)
- [systemd-gpt-auto-generator(8) - Linux manual page](https://www.freedesktop.org/software/systemd/man/devel/systemd-gpt-auto-generator.html)
- [systemd.generator(7) - Linux manual page](https://www.freedesktop.org/software/systemd/man/latest/systemd.generator.html)
- [systemd.unit(5) - Linux manual page](https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html#Description)：写了一个override.conf来覆盖`efi.mount`的`TimeoutSec`，但是好像没用。
- [How to change systemd service timeout value? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/227017/how-to-change-systemd-service-timeout-value)

## 参考资料

[Linux vDisk 文件启动插件 - 官方文档](https://www.ventoy.net/cn/plugin_vtoyboot.html)

[Arch Linux To Go by Ventoy](https://www.bilibili.com/read/cv19777065/) - 最详尽的一个教程，感谢！
