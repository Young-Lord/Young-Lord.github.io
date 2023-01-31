#!/usr/bin/python3
import os
OFFSET_MIX_LOCKED = 20480
OFFSET_MIX_UNLOCKED = 9076736
OFFSET_FASTBOOT = 7020544 # 注意这个尺寸比较小
OFFSET_BROKEN = 16076800
files = (OFFSET_MIX_LOCKED,OFFSET_MIX_UNLOCKED,OFFSET_FASTBOOT,OFFSET_BROKEN)
temp_file ="logo_orig_py"
os.system(f"su -c dd if=/dev/block/by-name/logo of={temp_file}")
os.system(f"su -c chmod 666 {temp_file}")
ofa=9076736
f1=open(temp_file,"r+b")
for i in range(len(files)):
    newfile = f"logo{i+1}.bmp"
    if os.path.isfile(newfile):
        f2=open(newfile,"rb")
        kk=f2.read()
        f2.close()
        f1.seek(files[i])
        f1.write(kk)
    else:
        print(newfile, "not found, pass.")
f1.close();
os.system(f"su -c dd of=/dev/block/by-name/logo if={temp_file}")

"""
su -c dd if=/dev/block/by-name/logo of=logo_orig_py
# binwalk logo_orig_py

python

o=[20480, 9076736, 7020544, 16076800]
f1=open("logo_orig_py","rb")
for i in o:
    f2=open(f"logo_{i}.bmp","wb")
    f1.seek(i)
    f2.write(f1.read())
    f2.close()

f1.close()
exit()

file *.bmp
"""