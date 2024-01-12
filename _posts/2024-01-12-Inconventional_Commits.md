---
tags: []
title: Inconventional Commits
slug: inconventional-commits
last_modified_at: 2024-1-12
---

## 前言

我一直试着遵循[Conventional Commits](https://www.conventionalcommits.org/)，但并不认可它的一些规则。

比如说：`feat(lang): add Polish language`——你管这叫feat？这有新功能？

比如说：`docs: correct spaces of CHANGELOG`——docs/style/chore都完全可以适用，为什么一定是docs？

鉴于这个过于混乱，我个人稍微整合了一下，作为自己的commit规范。没提到的都和Conventional Commits一样。

因为比较不conventional，所以取了Inconventional Commits这个名字。

## 正文

去除了`revert`，删除某个以前有的东西应当在`类别`前加`-`，如`-feat`。后面的内容依然是对此commit本身的描述。

| 类别 | 说明 | 示例 |
| --- | --- | --- |
| init | 初始化项目 | `init` |
| docs | 文档 | `docs: add WebExtension` |
| chore | 杂项（格式化、修改标点或换行等等，完全不影响代码和文档本身功能） | `chore: style`; `chore: clean build logs after build` |
| ci | CI | `ci: clone with --depth 1` |
| test | 测试 | `test: add Spotify.apk` |
| deps | 依赖 | `deps: bump openai to 1.0.0`; `-deps: revert alembic to 1.13.1`; `deps: bump` |
| perf | 性能 | `perf: skip resource analyzing in build` |
| refactor | 重构，对**代码功能**、**文档内容**无影响，但是使**调用关系**或**目录结构**等更清晰。 | `refactor: make Password a class` |
| feat | 增加/移除功能。注意，此处的“功能”是在用户层面的具体感受，而非某个全新API返回字段等。 | `feat: reset password` |
| release | 发布新版本。只应涉及版本号更改和`git tag`。 | `release: 1.0.0` |
| logic | 运行逻辑，对用户不可见，但对程序执行或达成目标的路径有比refactor大的影响。 | `logic: skip page elements extraction` |

以下内容为每个项目本身特有的，可以视情况选用，作为原Conventional Commits中混乱的`feat`的扩展。

| 类别 | 说明 | 示例 |
| --- | --- | --- |
| i18n | 国际化 |  |
| a11y | 无障碍化 |  |
| security | 安全性 |  |
| ui | UI / UX |  |
| prompt | LLM prompt |  |
