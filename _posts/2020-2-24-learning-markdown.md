---
title: Markdown语法基础
categories: [Markdown]
date: 2020-2-24 22:46:00
---
**本文使用Typora写成，许多语法有差别，可能显示错误**
---
# 1. 标题

# #一级标题

## ##二级标题

### ###三级标题

#### ####四级标题

##### #####五级标题

###### ######六级标题

# 2. 基本语法

## 高亮

==高亮内容== 

\==高亮内容\==（需要特殊支持）

## 加粗

**加粗内容**

\*\*加粗内容\*\*

## 斜体

*Harry Potter*

\*Harry Potter\*

## 删除线

~~awms~~awsl

\~\~awms\~\~awsl

## Emoji表情

:horse:

:emoji_name:

## 上标/下标

H~2~O

H\~2\~O（这种写法也只有Typora支持）

H<sub>2</sub>O

E=mc<sup>2</sup>（HTML写法）
```HTML
H<sub>2</sub>O
E=mc<sup>2</sup>
```
## 引用

> As the saying goes;
>
> > awsl
>
> We know that.

## 代码块

```c++
#include<iostream>
using namespace std;
int main(){
    int n = 10;
    cout << n << endl;
    return 0;
}
```

\`\`\`编程语言名字+回车实现代码高亮

## 分割线

---

\---

***

\*\*\*

## HTML代码

Markdown原生支持HTML代码，可以直接插入。

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=230 height=210 src="//music.163.com/outchain/player?type=0&id=932740311&auto=0&height=430"></iframe>

```html
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=230 height=210 src="//music.163.com/outchain/player?type=0&id=932740311&auto=0&height=430"></iframe>
```

~~当我没说~~



# 3.字符表示

## 空格键

在输入连续的空格后，Typora 会在编辑器视图里为你保留这些空格，但当你打印或导出时，这些空格会被省略成一个。 
你可以在源代码模式下，为每个空格前加一个 `\` 转义符，或者直接使用 HTML 风格的 `&nbps;` 来保持连续的空格。

普通空格：a          b

\空格：a\ \ \ \ \ \ \ \ \ \ b

HTML空格：a&nbps;&nbps;&nbps;&nbps;&nbps;&nbps;b

## 换行

- **软换行：**需要说明的是，在 Markdown 语法中，换行（line break）与换段是不同的。且换行分为软换行和硬换行。在 Typora 中，你可以通过 `Shift + Enter` 完成一次软换行。软换行只在编辑界面可见，当文档被导出时换行会被省略。

  例：软
  换行

- **硬换行：**你可以通过 `空格 + 空格 + Shift + Enter` 完成一次硬换行，而这也是许多 Markdown 编辑器所原生支持的。硬换行在文档被导出时将被保留，且没有换段的段后距。

  例：硬  
  换行

- **换段：**你可以通过 `Enter` 完成一次换段。Typora 会自动帮你完成两次 `Shift + Enter` 的软换行，从而完成一次换段。这也意味着在 Markdown 语法下，换段是通过在段与段之间加入空行来实现的。

  例：

  - 直接`Enter`：换

  段

  - 两次`Shift+Enter`：换

    段

- **Windows 风格（CR+LF）与 Unix 风格（CR）的换行符：**CR 表示回车 `\r` ，即回到一行的开头，而 LF 表示换行 `\n` ，即另起一行。 
  所以 Windows 风格的换行符本质是「回车 + 换行」，而 Unix 风格的换行符是「换行」。这也是为什么 Unix / Mac 系统下的文件，如果在 Windows 系统直接打开会全部在同一行内。 你可以在 `文件 - 偏好设置 - 编辑器 - 默认换行符` 中对此进行切换。

# 4. 图片

![random](https://dss1.bdstatic.com/6OF1bjeh1BF3odCf/it/u=1790717076,3010069922&fm=173&s=B29E7185E64376E60E2591DC030080B0&w=218&h=146&img.JPEG)

!\[图片内容介绍](地址（URL/相对路径/绝对路径）)

# 5. 超链接

[Hyperlink](https://sspai.com/post/54912)

\[显示名字]\(地址)

# 6. 列表

## 无序：

- a.com

- b.com

- c.com

  \- 第一个

  \-第二个

## 有序：

1. 第一个
2. 第二个
3. 第三个

1\. 就行

## 待办列表

可以直接插入

- [x] 已完成
- [ ] 未完成
- [x] 已完成2

\- \[ \] 未完成
\- \[x\] 已完成



# 7. 表格

直接插入/

| 姓名 | 语文 | 数学     | 默认左对齐|
| :--- | ---: | :--------: | ---- |
| 张大石 | 134  | 1333 | left! |
| 张看无二 | 13   | 1331     | more left |
| 张三  | *12* | **4211** | another left! |

| a | b |c |
| :--- | --- |---|
| asd | asd | asd |

# 8. 脚注

在需要插入脚注标号的位置写 `[^ number ]` ，再在下方通过 `[^ number ]:` 在文档中插入脚注。

Mi__craft[^1]

On__hot[^2]

奇怪，在Typora里你需要写成\[^ 1 ]而不是\[^1]。

[^1]:ne
[^2]:eS

