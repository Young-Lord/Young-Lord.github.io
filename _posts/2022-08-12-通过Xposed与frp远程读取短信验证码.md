---
tags: [Xposed, frp, Termux, Android]
title: 通过 Xposed 与 frp 远程读取短信验证码
last_modified_at: 2023-6-18
slug: xposed-frp-sms-code
redirect_from: 
  - /posts/通过Xposed与frp远程读取短信验证码
---

## 起因

本文写作原因是：用来接收验证码的手机时常接触不到，要在无人值守的情况下通过 ssh 访问验证码记录

免责声明：本博文仅供学习交流用途，请勿用于违法犯罪行为，否则一切后果自负。

## 使用

- 获得 root 权限并安装 Xposed / LSPosed / EdXposed
- 安装并激活我魔改的 [XposedSmsCode](https://github.com/Young-Lord/XposedSmsCodeTermux) 项目
- 使用以下命令允许代码执行：`value="true"; key="allow-external-apps"; file="/data/data/com.termux/files/home/.termux/termux.properties"; mkdir -p "$(dirname "$file")"; chmod 700 "$(dirname "$file")"; if ! grep -E '^'"$key"'=.*' $file &>/dev/null; then [[ -s "$file" && ! -z "$(tail -c 1 "$file")" ]] && newline=$'\n' || newline=""; echo "$newline$key=$value" >> "$file"; else sed -i'' -E 's/^'"$key"'=.*/'"$key=$value"'/' $file; fi`
- 编辑`~/.termux/onSmsActivate.sh`，写入开启 frp 与 sshd 并执行`termux-wake-lock`的命令（必须是阻塞的，可以在结尾加入一行无参数的`cat`）
- 使用 [Anywhere-](https://www.coolapk.com/apk/com.absinthe.anywhere_)，创建一个通过 `su -c am` [执行 Termux](https://github.com/termux/termux-app/wiki/RUN_COMMAND-Intent#top-command-with-am-startservice-command) 的卡片（`RUN_COMMAND_BACKGROUND`设为`true`），以某种方式修改 apk 里硬编码的 Anywhere- Uri
- 以特定方式发送一条短信，便可激活此脚本。
- 使用`cat /data/user/0/com.github.tianma8023.xposed.smscode/databases/sms-code.db`查看验证码。
