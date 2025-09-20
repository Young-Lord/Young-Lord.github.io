---
tags: [Linux]
title: 机械革命无界 15X Pro 暴风雪使用 Arch Linux
slug: mechrevo-linux-2025
last_modified_at: 2025-08-06
---

## 参考资料

感谢各位前辈的探索！

- [机械革命无界 15X Linux 优化指南](https://rikka.im/post/mechrevo-wujie15x-linux/)
- [在机械革命无界 15XPro 暴风雪上运行 Linux](https://zeeko.dev/2025/06/running-linux-on-mechanical-revolution-15xpro-blizzard)

## 正文

### 映射Copilot键到Ctrl键

阅读本部分前，请先默念：“傻逼微软！”

#### 新版

在使用“机械革命控制台”更新BIOS后，Copilot键在按下与松开时均会产生行为，这使得映射更加方便。具体如何实现我仍在调试。~~这kmonad文档就不是给人看的~~

#### 旧版

该部分内容已不适用于更新过BIOS到当前版本的情况，仅作备份。

该部分内容适用于Copilot键对应“按下时执行一次`leftmeta + leftshift + f23`，长按无作用，松开无作用”的机型。本部分将其映射为一个500ms内单次有效的rightctrl键。

缺点：需要三个按键的快捷键（比如`Ctrl + Shift + P`很难激活，执行时表现为`rightctrl ; rightshift + p`）

原始的`sudo keyd monitor -t`输出如下：

```console
$ sudo keyd monitor -t
device added: 0001:0001:70533846 AT Translated Set 2 keyboard (/dev/input/event3)
+229 ms AT Translated Set 2 keyboard    0001:0001:70533846    leftmeta down
+3 ms   AT Translated Set 2 keyboard    0001:0001:70533846    leftshift down
+10 ms  AT Translated Set 2 keyboard    0001:0001:70533846    f23 down
+5 ms   AT Translated Set 2 keyboard    0001:0001:70533846    f23 up
+5 ms   AT Translated Set 2 keyboard    0001:0001:70533846    leftshift up
+12 ms  AT Translated Set 2 keyboard    0001:0001:70533846    leftmeta up
```

首先装上`kmonad`：`sudo pacman -S kmonad`

然后把这份配置文件存在一个合适的地方，比如`/etc/kmonad/kmonad.kbd`：

```clojure
(defcfg
  ;; https://young-lord.github.io/posts/mechrevo-linux-2025    ver.20250727

  ;; For Linux
  input  (device-file "/dev/input/by-path/platform-i8042-serio-0-event-kbd")
  output (uinput-sink "Niko's KMonad profile: 机械革命 15X Pro 暴风雪" "/usr/bin/sleep 1 && /usr/bin/setxkbmap -option compose:ralt")

  ;;    cmp-seq rctl    ;; Set the compose key to `RightCtrl'
  ;;    cmp-seq-delay 5 ;; 5ms delay between each compose-key sequence press

  ;; Comment this if you want unhandled events not to be emitted
  fallthrough true

  ;; Set this to false to disable any command-execution in KMonad
  allow-cmd true
  )



;; niko: TODO: wait for XX to be released, replace Fn and Copilot key with XX
(defsrc
  esc  f1   f2   f3   f4   f5   f6   f7   f8   f9   f10  f11  f12  prnt  del  home pgup pgdn end      f23
  grv  1    2    3    4    5    6    7    8    9    0    -    =    bspc       nlck kp/  kp*  kp-
  tab  q    w    e    r    t    y    u    i    o    p    [    ]    \          kp7  kp8  kp9  kp+
  caps a    s    d    f    g    h    j    k    l    ;    '         ret        kp4  kp5  kp6
  lsft z    x    c    v    b    n    m    ,    .    /              rsft       kp1  kp2  kp3  kprt
  lctl      lmet lalt           spc            ralt                up         kp0       kp.
                                                              left down  rght
)



(defalias cpt (tap-hold 30 (layer-delay 15 remap-copilot) lmet))

(deflayer default
  _    _    _    _    _    _    _    _    _    _    _    _    _    _     _    _    _    _    _        _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  lctl _    _    _    _    _    _    _    _    _    _    _         _          _    _    _
  _    _    _    _    _    _    _    _    _    _    _              _          _    _    _    _
  lctl      @cpt _         _                   _                   _          _         _
                                                              _    _     _
)

(deflayer remap-copilot
  _    _    _    _    _    _    _    _    _    _    _    _    _    _     _    _    _    _    _        _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _         _          _    _    _
  (layer-delay 15 remap-copilot-2)    _    _    _    _    _    _    _    _    _    _              _          _    _    _    _
  _         _    _         _                   _                   _          _         _
                                                              _    _     _
)


(deflayer remap-copilot-2
  _    _    _    _    _    _    _    _    _    _    _    _    _    _     _    _    _    _    _        (sticky-key 500 rctl)
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _    _    _          _    _    _    _
  _    _    _    _    _    _    _    _    _    _    _    _         _          _    _    _
  _    _    _    _    _    _    _    _    _    _    _              _          _    _    _    _
  _         _    _         _                   _                   _          _         _
                                                              _    _     _
)
```

然后装个Systemd服务：

```shell
cat << EOF | sudo tee /etc/systemd/system/kmonad.service && sudo systemctl enable kmonad
[Unit]
Description=laptop keyboard kmonad
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/kmonad /etc/kmonad/kmonad.kbd
Restart=always
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF
```

重启电脑，或运行`kmonad`服务即可。顺带一提这份配置会把`CapsLock`映射为`leftctrl`，还原此更改的方法显而易见。

### 无法休眠(Hibernate)

表现为：休眠后电源灯仍然点亮，只可长按电源键强制关机，开机后无法还原休眠前状态。

请先阅读[ArchWiki 对应章节](https://wiki.archlinux.org/title/Power_management/Suspend_and_hibernate#Troubleshooting)，以及其中引用的[best practices to debug suspend issues 一文](https://web.archive.org/web/20230502010825/https://01.org/blogs/rzhang/2015/best-practice-debug-linux-suspend/hibernate-issues)。

对于我，应用[System does not power off when hibernating 一节](https://wiki.archlinux.org/title/Power_management/Suspend_and_hibernate#System_does_not_power_off_when_hibernating)中的内容即可解决。

## 其他

这机子毛病一堆，如果有钱还是考虑别的牌子吧。
