---
tags: [SQL Server, Python, bugfix]
title: "pymssql编码问题报错UnicodeDecodeError: 'gbk' codec can't decode byte..."
slug: pymssql-unicode-error
last_modified_at: 2023-11-1
---

## TLDR

一言以概之，就是拿`pyodbc`换掉`pymssql`。

### 安装`msodbc`驱动

#### Windows

首先阅读[此Wiki](https://github.com/mkleehammer/pyodbc/wiki/Connecting-to-SQL-Server-from-Windows)了解驱动与SQL Server的版本对应关系，然后在[下载页面](https://learn.microsoft.com/zh-cn/sql/connect/odbc/windows/release-notes-odbc-sql-server-windows)选择对应链接下载并安装驱动

#### Linux

自行参阅[此Wiki](https://github.com/mkleehammer/pyodbc/wiki/Connecting-to-SQL-Server-from-Linux)及该项目Wiki中的相关文章进行驱动的安装与配置。

### 使用`pyodbc`替换`pymssql`

`pip install pyodbc`安装`pyodbc`，并将代码里的`pymssql`改为`pyodbc`

#### 连接数据库

把代码里的`connect`如下更改：

```python
pymssql.connect(
            server=Config.DATABASE_ADDRESS,
            user=Config.DATABASE_USERNAME,
            password=Config.DATABASE_PASSWORD,
            database=Config.DATABASE_DB,
            charset="CP936",  # mssb
            tds_version="7.0",
        )
```

改为：

```python
{% raw %}pyodbc.connect(f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={Config.DATABASE_ADDRESS};DATABASE={Config.DATABASE_DB};UID={Config.DATABASE_USERNAME};PWD={Config.DATABASE_PASSWORD};TrustServerCertificate=yes'){% endraw %}
```

（注意，此处的**18**要改为你安装的驱动的版本，否则会报错）

（对于Linux，你必须使用DSN配置连接信息而**不能使用上面的方法**，具体自行参见[Wiki](https://github.com/mkleehammer/pyodbc/wiki/Connecting-to-SQL-Server-from-Linux)）

#### 执行SQL

把代码里的`Cursor`对象的`execute`方法中的`%s`, `%d`等占位符全部换为`?`，即：

```python
db.execute(
    "insert into [aa] ([name],[value]) values (%s, %d)",
    (name, value),
)
```

改为：

```python
db.execute(
    "insert into [aa] ([name],[value]) values (?, ?)",
    (name, value),
)
```

完事！

## 其他解决方案

### 更改charset参数

将`pymssql.connect`中的参数改为`gbk`/`gb2312`/`gb18030`/`CP936`可能有奇效<del>，但这太玄学了</del>。
