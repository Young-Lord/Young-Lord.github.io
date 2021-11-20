---
categories: [Python]
date: 2021-11-20 15:00
---

## 缘起

想必任何一个开着代理用pip的windows用户都见过以下画面：

![image-20211120151401427](https://i.loli.net/2021/11/20/5BMCkKNAuhYvE43.png)

![搜索结果](https://i.loli.net/2021/11/20/CUHBjOkQPqTdXo6.png)

不幸的是，全世界都遇到了这个问题，但（除了降级）唯一的解决方案是：

**关 闭 代 理**

不是，你TM不会每次用pip就关代理关完再开吧？？？真有人这么傻？

好在python是解释性语言，改了代码就能跑，所以——

## 开干

**警告：以下内容涉及到更改python基础库的操作，可能导致包括但不限于设备爆炸在内的问题，如不想继续请自行退出**

上一步里，我们看到`raise ValueError`，那就定位到`C:\users\%USERNAME%\appdata\local\programs\python\python38\lib\ssl.py`的`997行`：

![代码截图](https://i.loli.net/2021/11/20/hEYJlZM9KFfaAoR.png)

很明显，`check_hostname`导致了这个问题，那么就把这个if改成：

（**注意：各位先不用更改此处，具体原因看后文**）

```python
        if context.check_hostname and not server_hostname:
            # raise ValueError("check_hostname requires server_hostname")
            context.check_hostname = False
            # Fixed by LY on 2021-11-20
```

正当觉得完成了时，你又被浇了一盆冷水：

![报错](https://i.loli.net/2021/11/20/MlhRBILQ7mpqyrn.png)

这一次，是`ProxyError`。去网上一查，你就发现，只有http类型的代理才能正常运行。也就是说，你要把你的代理设置改成这样：

![在代理地址前添加http](https://i.loli.net/2021/11/20/21KSixgUTeJyWLv.png)

但是，这是自动配置的啊？！

继续改代码，我们找到了`urllib3/poolmanager.py`的第`477`行，看起来这里是加载代理地址的

既然这个只支持`http`，那就改呗：

![image-20211120160908365](https://i.loli.net/2021/11/20/PE39FLv8W6Zszeo.png)

也就是，在`proxy = parse_url(proxy_url)`前添加这段代码：

```python
proxy_url = proxy_url.replace("https://", "http://")
```

## 尾声

![成功](https://i.loli.net/2021/11/20/hov3ViZl2AMCPWm.png)

至此，你终于享受到了一个开着代理也能使用pip的体验。

这就是标题中的，“一劳永逸”。

希望CSDN，简书等垃圾平台少一些抄袭，多一些真材实料，不要只会说“关了代理就’解决‘了”，这才不是科技圈应有的样子。

## 彩蛋

正当我为了写这篇blog而去重现bug的时候，我发现了，就算把`ssl.py`中的修改移除也不会出现问题，所以只用执行`poolmanager.py`中的修改，就能解决问题了。

因此，这看起来单纯是因为https或没有指定协议的代理带来的锅，希望urllib那边早日修好吧。
