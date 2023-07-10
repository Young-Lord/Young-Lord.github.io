import sys
if len(sys.argv) < 3:
    print("Usage: txttobin.py <txt file> <uid>")
    print("Example: txttobin.py 0x7052c102_003B.txt 7052c102")
    sys.exit(1)

data = open(sys.argv[1], 'rb').readlines()
uid = sys.argv[2]
def parity(x):
    return ("{0:08b}".format(x).count('1') & 1)

fp = open(uid+'_generated.bin','wb')
fp.write(bytes.fromhex(uid)+b"\x00"*2)
bits = 0
pbits = 0
for l in data:
    if bits == 8:
        fp.write(bytes([pbits]))
        bits = 0
        pbits = 0
    hexbytes = list(filter(None, l.strip().split(b' ')))
    bits += 4
    for x in hexbytes:
        b = int(x.replace(b'!', b''), 16)
        p = parity(b)
        if b'!' not in x:
            p^=1
        pbits <<= 1
        pbits |= p
        fp.write(bytes([b]))

'''
Modified by GitHub @Young-Lord, https://young-lord.github.io

License
-------

MIT license

Copyright (c) 2015-2016 Aram Verstegen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
'''