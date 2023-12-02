---
tags: [Python, bugfix]
title: 一劳永逸解决 check_hostname requires server_hostname
last_modified_at: 2023-8-29
slug: pip-proxy-issue
redirect_from: 
  - /posts/一劳永逸解决check_hostname-requires-server_hostname
---

## 注意

对于`urllib3`等包，`pip`内自己存了一份，所以以下两个文件可能均需更改：

```plain
C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\Lib\site-packages\pip\_vendor\urllib3\poolmanager.py
C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python310\Lib\site-packages\urllib3\poolmanager.py
```

## TLDR

找到`urllib3/poolmanager.py`的第`477`行，如下更改。

![修改代码的截图](https://i.loli.net/2021/11/20/PE39FLv8W6Zszeo.png)

也就是，在`proxy = parse_url(proxy_url)`前添加这段代码：

```python
proxy_url = proxy_url.replace("https://", "http://")
```

## 缘起

想必任何一个开着代理用 pip 的 Windows 用户都见过以下画面：

![下载包时出现异常](https://i.loli.net/2021/11/20/5BMCkKNAuhYvE43.png)

![搜索结果，大部分为重复内容](https://i.loli.net/2021/11/20/CUHBjOkQPqTdXo6.png)

不幸的是，全世界都遇到了这个问题，但（除了降级）唯一的解决方案是：

**关 闭 代 理**

不是，你 TM 不会每次用 pip 就关代理关完再开吧？？？真有人这么傻？

好在 Python 是解释性语言，改了代码就能跑，所以——

## 开干

**警告：以下内容涉及到更改 Python 基础库的操作，可能导致包括但不限于设备爆炸在内的问题，如不想继续请自行退出**

上一步里，我们看到`raise ValueError`，那就定位到`C:\Users\%USERNAME%\appdata\local\programs\python\python38\lib\ssl.py`的`997行`：

![代码截图](https://i.loli.net/2021/11/20/hEYJlZM9KFfaAoR.png)

很明显，`check_hostname`导致了这个问题，那么就把这个 if 改成：

（**注意：各位先不用更改此处，具体原因看后文**）

```python
        if context.check_hostname and not server_hostname:
            # raise ValueError("check_hostname requires server_hostname")
            context.check_hostname = False
            # Fixed by LY on 2021-11-20
```

正当觉得完成了时，你又被浇了一盆冷水：

![报错](https://i.loli.net/2021/11/20/MlhRBILQ7mpqyrn.png)

这一次，是`ProxyError`。去网上一查，你就发现，只有 http 类型的代理才能正常运行。也就是说，你要把你的代理设置改成这样：

![在Windows设置中的代理地址前添加http](https://i.loli.net/2021/11/20/21KSixgUTeJyWLv.png)

但是，这是自动配置的啊？！

继续改代码，我们找到了`urllib3/poolmanager.py`的第`477`行，看起来这里是加载代理地址的

既然这个只支持`http`，那就改呗：

![修改代码的截图](https://i.loli.net/2021/11/20/PE39FLv8W6Zszeo.png)

也就是，在`proxy = parse_url(proxy_url)`前添加这段代码：

```python
proxy_url = proxy_url.replace("https://", "http://")
```

## 尾声

![pip成功在开启代理的情况下装包](https://i.loli.net/2021/11/20/hov3ViZl2AMCPWm.png)

至此，你终于享受到了一个开着代理也能使用 pip 的体验。

这就是标题中的，“一劳永逸”。

希望 CSDN，简书等垃圾平台少一些抄袭，多一些真材实料，不要只会说“关了代理就’解决‘了”，这才不是科技圈应有的样子。

## 关于patch

为了写这篇 blog 去复现 bug 的时候，我发现不更改`ssl.py`也不会出现问题，所以只用修改`poolmanager.py`就可以了。

## 参考资料

[Python 遭遇 ProxyError 问题记录](https://www.cnblogs.com/davyyy/p/14388623.html)
