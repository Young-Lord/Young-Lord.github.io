---
tags: [上海交通大学]
title: 提取上交 jAccount 动态口令（TOTP）
slug: sjtu-totp
last_modified_at: 2025-08-06
---

## 背景

既然你能来到这里，应该也不需要什么介绍了吧。

本文使用的环境：一台安卓手机，交我办 3.4.9。

下文“分析”与“教程”是混在一起写的，你应当有能分辨必需步骤的能力。你应当知道你的用户名，下文以`faputa`或者`你的用户名`代替。

警告：TOTP密钥为隐私内容，不应在任何不信任的网站上输入。本文中出现的密钥仅用于演示用途，已在本文编写完成后全部撤销。

## 正文

### 获取密钥

多种方法选择任一即可。

#### 读数据库方法

本方法需要用到安卓系统自带的备份功能，门槛较低。

先在“交我办”生成动态口令。

去翻翻应用私密文件，发现了个`TOTP.db`，打开看看发现没有`SQLite format 3`文件头，而且乱码看着很无规律，盲猜是`SQLCipher`。分析`classes*.dex`，在`edu.sjtu.infoplus.taskcenter.db.totp.TOTPDatabase$Companion`中发现`SQLCipher`相关内容（也就是`net.sqlcipher.database.SQLiteDatabase`等等类名）。结合[sqlcipher-android文档](https://github.com/sqlcipher/sqlcipher-android?tab=readme-ov-file#sqlcipher-for-android-room-integration)，得到密钥`account#totp@db`。

备份“交我办”后，解压备份文件，在`databases`或对应目录下找到`TOTP.db`及`TOTP.db-wal`文件。（谢谢你，`android:allowBackup="true"`）（如果你的手机root了，直接访问`/data/user/0/edu.sjtu.infoplus.taskcenter/databases/`即可获得）

为什么要有个`TOTP.db-wal`文件？简单来说，由于某些bug，TOTP密钥一直没有被真正写入`TOTP.db`中，而是在`TOTP.db-wal`中暂存。<del>这垃圾bug调了我十分钟。</del>

安装SQLCipher（Windows版本可以在[这里](https://github.com/QQBackup/sqlcipher-github-actions/releases/tag/latest)下载），执行`sqlcipher TOTP.db`，依次输入：

```sql
PRAGMA KEY='account#totp@db';
PRAGMA cipher_migrate;
.tables
select * from TOTPKey;
```

输出形如：`faputa|2C10EA6E652029139EABE8896E10C3705CB0F757CA2F2D5AEBF147F027E072697760BB50C8FC1CF1EB2914C5514AF57A0D3C768F4FED0357830B0E4567A1767F|2`，中间的一串即为TOTP密钥。

#### 抓包方法

本方法需要用到ProxyPin等抓包软件。为了使目标软件信任自签名HTTPS证书，要求手机已经root，门槛较高。

既然服务器端需要验证TOTP，必定会有一个服务器与客户端交换密钥的过程，因此尝试抓包。

开启抓包软件，随后在“交我办”生成动态口令，得到URL为`https://jaccount.sjtu.edu.cn/jaccount/issueTotp`的`POST`请求。响应体中的`key`字段即为TOTP密钥，形如`2C10EA6E652029139EABE8896E10C3705CB0F757CA2F2D5AEBF147F027E072697760BB50C8FC1CF1EB2914C5514AF57A0D3C768F4FED0357830B0E4567A1767F`。

完整的响应体形如：

```json
{
  "errno": 0,
  "error": "动态口令开通成功",
  "total": 0,
  "entities": [
    {
      "key": "2C10EA6E652029139EABE8896E10C3705CB0F757CA2F2D5AEBF147F027E072697760BB50C8FC1CF1EB2914C5514AF57A0D3C768F4FED0357830B0E4567A1767F",
      "version": 3
    }
  ]
}
```

##### 不用手机的抓包方法

将浏览器的User Agent设置为`TaskCenterApp/3.4.9`，然后在浏览器中访问`https://jaccount.sjtu.edu.cn/jaccount/issueTotp?account=你的用户名`，即可访问开通TOTP的页面。对页面源码进行一些修改后，即可正常开通TOTP。其他操作与[“抓包方法”一节](#抓包方法)相同。

### 将密钥导入密码管理器

得到的密钥为128位长，仅由`[0-9A-F]`组成的字符串，可直接猜测其为使用`SHA-512`的TOTP中，以hex格式表示的密钥。该猜测可被`edu.sjtu.infoplus.taskcenter.widget.TaskCenterWebView$5`的`TOTP.generateTOTP512`代码验证。

一般密码管理器中，需要的TOTP密钥均为Base32格式（移除结尾的`=`），因此需要转码。

[“鸣谢”一节](#鸣谢)中列出的网站可以帮你完成这一过程，但强烈建议在本地转换。比如，Linux系统中可以使用以下命令：

`cat | xxd -r -p | base32 -w0  | tr -d '='`

执行该命令，粘贴hex格式的密钥，按下回车，按下`Ctrl + D`，输出即为所需的Base32格式密钥。

以上文中得到的密钥为例，转码后得到的Base32格式密钥为`FQIOU3TFEAURHHVL5CEW4EGDOBOLB52XZIXS2WXL6FD7AJ7AOJUXOYF3KDEPYHHR5MURJRKRJL2XUDJ4O2HU73IDK6BQWDSFM6QXM7Y`

配置好参数（即使用`SHA-512`，而非更常见的`SHA-1`算法）后，即可导入你的密码管理器或验证器。

如果你需要生成二维码，或者直接编辑密码管理器的`otp`字段，你需要的Key Uri形如：`otpauth://totp/jAccount:faputa?issuer=jAccount&secret=FQIOU3TFEAURHHVL5CEW4EGDOBOLB52XZIXS2WXL6FD7AJ7AOJUXOYF3KDEPYHHR5MURJRKRJL2XUDJ4O2HU73IDK6BQWDSFM6QXM7Y&algorithm=SHA512&digits=6&period=30`

导入完成后，如果密钥来自“交我办”应用，可以验证生成的验证码是否与“交我办”中一致。

## 鸣谢

警告：TOTP密钥为隐私内容，不应在任何不信任的网站上输入。以下网站可能将你的密钥传输到服务端，并且可能存在第三方追踪器，因此不应当被信任。

- [在线OTP密码生成器 - lddgo.net](https://www.lddgo.net/encrypt/otp-code-generate)
- [Time-based one-time password (TOTP) Generator - 2fasolution.com](https://2fasolution.com/totp.html)
- [Key Uri Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)

## 另外

不要信上交招生老师一个字，虽然写给你看也没啥用。

如果是交大校友，可以跟我认识一下，联系方式在网站右上角的`关于`里。
