---
tags: [Linux, Deepin, PulseAudio, 音频]
title: Linux 中基于 PulseAudio 使用音频均衡器
slug: linux-pulseaudio-equalizer
redirect_from: 
  - /posts/Linux中基于PulseAudio使用音频均衡器
---

## 起因

相比 Android 上的[椒盐音乐](https://www.coolapk.com/apk/284064)、[Wavelet](https://play.google.com/store/apps/details?id=com.pittvandewitt.wavelet)、[Viper4Android](https://forum.xda-developers.com/showthread.php?t=2191223) 和 Windows 上的 [EqualizerAPO](https://sourceforge.net/projects/equalizerapo/) 等高度自动化软件，Linux 的音频使用均衡器比较麻烦，故对折腾过程作简单记录。

由于 [Deepin 目前不能简单使用 PipeWire](https://bbs.deepin.org/post/235926)，本记录完全基于使用 PulseAudio 的环境。

## 过程

1. 安装 [Flatpak](https://www.flatpak.org)：`sudo apt install flatpak gnome-software-plugin-flatpak`
2. 换源：`flatpak remote-add --if-not-exists flatpak https://mirror.sjtu.edu.cn/flathub/flathub.flatpakrepo`
3. 安装 [PulseEffects](https://github.com/wwmm/pulseeffects)（较新 (>=6.0.0) 的名字是 EasyEffects，不支持 PulseAudio）：`flatpak install flathub com.github.wwmm.pulseeffects`
4. 配置 Rust 环境：`sudo apt remove rustc ; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
5. 手动编译安装 [set_eq](https://github.com/minijackson/set_eq)：`git clone https://github.com/minijackson/set_eq --depth 1 && cd set_eq && cargo install`（这一步很可能缺依赖，一个一个补就行）
6. 在 [AutoEq](https://github.com/jaakkopasanen/AutoEq/tree/master/results) 项目中找到你的耳机的均衡器配置（以`GraphicEQ.txt`结尾），下载，通过以下命令转换：`set_eq pa-effects export-preset 输入文件名 > MyPreset.json`
7. 打开 PulseEffecs，进入右上角的预设菜单，导入刚才生成的 MyPreset.json 文件，如图：![PulseEffects 内导入预设的具体操作](https://s2.loli.net/2022/08/14/dg7YFCzTrhjOkL5.png)
8. 将 PulseEffects 添加到开始菜单：`sudo cp /var/lib/flatpak/exports/share/applications/com.github.wwmm.pulseeffects.desktop /usr/share/applications/`
9. 在 PulseEffects 的设置中选中 `Start Service at Login`，使其能开机自启

## 备注

静默运行 PulseEffects 的命令（最后的`--gapplication-service`用于以服务模式运行，若不加此参数，可以显示图形化界面）：`/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=pulseeffects com.github.wwmm.pulseeffects --gapplication-service`
