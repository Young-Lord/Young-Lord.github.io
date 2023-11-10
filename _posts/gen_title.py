#!/bin/python3
# 用于防止愚蠢的Jekyll胡乱大小写
import os


def processSingleFile(filename: str):
    is_crlf = False
    with open(filename, encoding="utf-8") as f:
        file_content_str = f.read()
        if file_content_str.find("\r\n") > 0:
            is_crlf = True
        file_content_list: list[str] = file_content_str.replace("\r\n", "\n").split(
            "\n"
        )
    mark_begin = file_content_list.index("---")
    if mark_begin == -1:
        return 1
    mark_end = file_content_list.index("---", mark_begin + 1)
    if mark_end == -1:
        return 1
    yaml_datas = file_content_list[mark_begin + 1 : mark_end]
    new_title = filename.split("-", 3)[3][:-3]  # 提取标题正文，去除".md"
    if new_title.find(": ") != -1:
        print("警告：" + filename + "中标题存在特殊字符")  # 应该不太可能吧，毕竟":"基本不会用到
    if not any(
        1
        for i in file_content_list[mark_begin + 1 : mark_end]
        if i.startswith("redirect_from: ")
    ) and not any(
        1
        for i in file_content_list[mark_begin + 1 : mark_end]
        if i.startswith("slug: ")
    ):
        yaml_datas.append("slug: " + new_title)
        yaml_datas.append("redirect_from: ")
        yaml_datas.append("  - /posts/" + filename.split("-", 3)[3].removesuffix(".md"))
        print(filename + " 未设置slug，已自动设置。")
        file_content_str = file_content_list[:mark_begin + 1] + yaml_datas + file_content_list[mark_end:]
        new_file_str = ("\r\n" if is_crlf else "\n").join(file_content_str)
        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_file_str)
    new_tile_text = f"title: {new_title}"
    if any(
        1
        for i in yaml_datas
        if i.startswith("title: ")
    ):
        return 2
    yaml_datas.append(new_tile_text)
    file_content_str = file_content_list[:mark_begin + 1] + yaml_datas + file_content_list[mark_end:]
    new_file_str = ("\r\n" if is_crlf else "\n").join(file_content_str)
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
