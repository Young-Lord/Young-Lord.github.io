---
tags: [Arch Linux, Ventoy]
title: Ventoy Arch Linux To Go 十分钟速通
slug: arch-to-go
last_modified_at: 2023-11-30
---

## 前言

最近不是[Canokey](https://item.taobao.com/item.htm?id=664914723920)有货了嘛，想买一个来玩玩gpg。gpg公钥显然需要离线生成，刚好几个月前参加科苗的时候认识了一个用Ventoy跑Fedora的人，于是就想到了用Ventoy做一个Arch Linux To Go。

中途出了一大堆问题，于是水了这篇博文以防后人踩坑。

## 准备

- 16GB起步的U盘或移动硬盘，安装[Ventoy](https://www.ventoy.net/)
- [VirtualBox](https://www.virtualbox.org/) <del>甲骨文什么时候\*啊</del>
- [Arch Linux镜像](https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/latest/archlinux-x86_64.iso)

## 安装

### Arch安装

启动VirtualBox，新建个虚拟机，配置时有两点需要注意的：

- 勾选“启用 EFI”
- 创建虚拟硬盘时选择“预先分配全部空间”，如果只是给Canokey用的话8GB就够了（这个以后可以扩容，）

开机，启动`archinstall`，我的配置如下（默认值省略）：

- Mirrors: Region: China
- Disk configuration: Use a best-effort default partition layout -> 选中那个比较大的盘（`ATA VBOX HARDDISK`;`/dev/sda`;`scsi`） -> btrfs -> yes -> yes（一路Enter就行）
- Bootloader: Systemd-boot（默认值）（这里要是默认值是`Grub`且没有`Systemd-boot`就可以重开了，你没开`EFI`）
- Swap: no（真有人拿U盘当swap？要是是移动硬盘之类的可以视情况调整）
- Hostname: livearch（自行输入）
- Root password: 自行输入
- User account: 自行输入，我这里用户名为`user`，并且给予了`sudo`权限
- Profile: Type -> Desktop -> Xfce4
- Audio: Pipewire（可选，不用声音的话不装也行）
- Network configuration: NetworkManager（要是你用别的方法能装包，也可以不装）
- Timezone: Asia/Shanghai

配置完后直接Install。

安装完成后用`poweroff`关闭虚拟机，移除虚拟光驱，重启。

### 配置

安装VirtualBox Guest Additions，参考[官方教程](https://wiki.archlinux.org/title/VirtualBox/Install_Arch_Linux_as_a_guest#Install_the_Guest_Additions)即可。（`sudo pacman -Syyu virtualbox-guest-utils && sudo systemctl enable vboxservice && sudo systemctl start vboxservice`），重启。

用任何方法（[比如这个](https://github.com/CHH3213/clash-for-windows-backup/releases)）丢一份<del>已经死去的</del>`Clash For Windows`进去，配置好代理。可以使用proxyman（`yay -S proxyman-git`）

装上`yay`，参考[官方教程](https://github.com/Jguer/yay#installation)即可。

此时可以从AUR装个`clash-for-windows-bin`来替代之前自己丢进去的版本（注意安装过程必须使用代理）。

安装一系列基础包：`yay -S --needed curl wget nano vim p7zip which lvm2 git noto-fonts-cjk`

（可能需要）`yay -S mkinitcpio-firmware`

（可能需要）修改`/etc/mkinitcpio.conf`，把`autodetect`删掉

### 配置mkinitcpio

这一步主要是把`/boot/loader/entries`中的PARTUUID改为UUID，否则在UEFI模式下会无法启动。

```shell
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

### Canokey相关

```shell
yay -S --needed openssl gnupg ungoogled-chromium-bin python-pipx yubico-piv-tool swig opensc kleopatra canokey-usbip-git
pipx ensurepath
pipx install yubikey-manager
pipx install canokey-manager
pipx install twisted
pipx install ipython
sudo modprobe vhci-hcd  # 手动加载usbip内核模块
echo vhci-hcd | sudo tee /etc/modules-load.d/vhci-hcd.conf  # 开机自动加载usbip内核模块
# canokey-usbip 相关，用于模拟 Canokey
# canokey-usbip /tmp/canokey-file 3240 true &
# sudo usbip attach -r localhost -b 1-1.1

# 允许非 root 用户访问 USB 设备
# /etc/udev/rules.d/69-canokeys.rules
# 按照Canokey官方教程 https://docs.canokeys.org/userguide/setup/#udev 配置，最后一行取消注释
# 完成后运行 sudo udevadm control --reload-rules && sudo udevadm trigger
# 重启后生效

# yay -S --needed remmina remmina-plugin-rdesktop 用于测试RDP共享Canokey
```

关于Web Console，[新版](https://console.canokeys.org/)可以直接作为Chrome应用安装，[旧版](https://console-legacy.canokeys.org/)可以使用我打包过(TODO)的离线运行。

关于`gpg-agent`，不用的时候记得kill掉以防止占用USB设备。

记得使用`shred -u -v`和`ramfs`保证文件私密性。

## 丢进Ventoy

把那个vdi文件加个后缀`.vtoy`，丢进Ventoy。重启，选择此文件，就可以进入Arch了。

这里建议测试一下是否在`UEFI`（主要与`mkinitcpio`有关）及`Legacy BIOS`（主要与`grub`有关）启动模式下均能正常工作，方法不再赘述。

UEFI启动时会有奇怪的start job failed，不过不影响使用。

## 参考资料

[Linux vDisk 文件启动插件 - 官方文档](https://www.ventoy.net/cn/plugin_vtoyboot.html)

[Arch Linux To Go by Ventoy](https://www.bilibili.com/read/cv19777065/) - 最详尽的一个教程，感谢！
