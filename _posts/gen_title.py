#!/bin/python3
# 用于防止愚蠢的Jekyll胡乱大小写
import os


def processSingleFile(filename: str):
    is_crlf = False
    with open(filename, encoding="utf-8") as f:
        ff = f.read()
        if ff.find("\r\n") > 0:
            is_crlf = True
        ff = ff.replace("\r\n", '\n').split('\n')
    mark_begin = ff.index("---")
    if mark_begin == -1:
        return 1
    mark_end = ff.index("---", mark_begin+1)
    if mark_end == -1:
        return 1
    if len([1 for i in ff[mark_begin+1:mark_end] if i.startswith("title: ")]) != 0:
        return 2
    new_title = filename.split("-", 3)[3][:-3]  # 提取标题正文，去除".md"
    if new_title.find(": ") != -1:
        print("警告："+filename+"中标题存在特殊字符")  # 应该不太可能吧，毕竟":"基本不会用到
    new_tile_text = f"title: {new_title}"
    ff.insert(mark_end, new_tile_text)
    new_file_str = ('\r\n' if is_crlf else '\n').join(ff)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_file_str)
    return 0


files = []
for i in os.listdir():
    if i.endswith(".md"):
        files.append(i)

for filename in files:
    ret = processSingleFile(filename)
    if ret == 1:
        print(ret, filename, "格式错误，跳过")
    elif ret == 2:
        print(ret, filename, "已有标题，跳过")
    elif ret == 0:
        print(ret, filename, "标题重写完成。")
    else:
        print("ERR: ", filename, ret)
