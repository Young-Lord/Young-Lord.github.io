---
tags: [Linux, iPad]
title: 将 iPad 与 Apple Pencil 作为数位屏使用
slug: ipad-pencil-drawing-tablet
last_modified_at: 2025-10-14
---

## 正文

[Sunshine](https://github.com/LizardByte/Sunshine) + [Moonlight](https://apps.apple.com/us/app/moonlight-game-streaming/id1000551566) 即可。如果你想获得更多功能 <del>并参与开发者间激烈的斗争</del>，可以用[Apollo](https://github.com/ClassicOldSong/Apollo)换掉Sunshine。为了关闭三指手势，可以使用（付费的）VoidLink换掉Moonlight。

为了改善使用体验（即降低延迟），建议把Moonlight中：`Bitrate`设为最低，`Touch Mode`设为`Touchpad`，`Frame Pacing Preference`设为`Low Latency`。

Wayland桌面环境下，使用Obsidian等软件时，手写笔可能不工作，在`~/.config/obsidian/user-flags.conf`中添加`--ozone-platform=x11`可暂时解决问题。

可能需要手动调一下压感曲线，在KDE System Settings的`Drawing Tablet`里，或绘画软件（如Krita）的设置里，均可调节。

多显示器下，手写笔位置错误，可通过禁用其它显示器暂时解决。

## 使用体验

延迟极低，压感正常，倾斜角度正常，光标预览正常，防误触基本正常（在Moonlight下有概率激活三指手势），轻捏、侧旋、轻点两下 均不可用。

## 结语

自由软件万岁。老实说，我认为我应当为这个功能支付费用。（App Store里也有同样功能的商业软件，不过只支持两大操作系统（显然我说的不是Deepin和FreeBSD））
