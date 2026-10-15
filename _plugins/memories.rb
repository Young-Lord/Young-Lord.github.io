# memories.md 的构建期处理：
#   1. 校验作品表的数据规范（规则见 _data/memories.yml），不合规就让构建失败
#   2. 把 <nsfw /> 这类自闭合写法展开成成对标签
#   3. 给 <spoiler>/<nsfw> 补上 markdown="span"，否则 kramdown 会把标签里的 Markdown 当原文输出
#   4. 给作品表套一层滚动容器（见 memories.css）
# 只做校验可以单独运行：ruby _plugins/memories.rb
require 'yaml'

module Memories
  PAGE = 'memories.md'.freeze
  DATA = '_data/memories.yml'.freeze
  PAGE_ID = 'page-memories'.freeze
  TABLE_ID = 'memories-table'.freeze
  ALT_COLUMN = '原名字/备注'.freeze
  PAIRED_TAGS = %w[spoiler nsfw].freeze

  class << self
    # <nsfw /> 在 HTML 里其实是个开标签，会把后面的内容全吞进去，构建期展开成 <nsfw></nsfw>
    def expand_self_closing(content)
      content.gsub(%r{<(#{PAIRED_TAGS.join('|')})((?:\s[^>]*?)?)\s*/>}) do
        "<#{Regexp.last_match(1)}#{Regexp.last_match(2).rstrip}></#{Regexp.last_match(1)}>"
      end
    end

    # 只改代码块/行内代码之外的部分，否则规范说明里举例用的 `<spoiler>…</spoiler>` 也会被改写
    def outside_code(content)
      content.gsub(/^```.*?^```|`+[^`\n]*`+|[^`]+/m) do |chunk|
        chunk.start_with?('`') ? chunk : yield(chunk)
      end
    end

    # kramdown 默认把未知标签的内容当原文，补上 markdown="span" 才会解析里面的 Markdown
    def enable_markdown_in_tags(content)
      outside_code(content) do |chunk|
        expand_self_closing(chunk).gsub(/<(#{PAIRED_TAGS.join('|')})((?:\s[^>]*)?)>/) do
          attrs = Regexp.last_match(2)
          attrs.include?('markdown=') ? Regexp.last_match(0) : "<#{Regexp.last_match(1)}#{attrs} markdown=\"span\">"
        end
      end
    end

    # 主题给 table 设的是 display:block，里面那张匿名表格会按内容收缩；
    # 套一层容器后表格才能用 min-width:100% 撑满，同时保留横向滚动
    def wrap_table(html)
      html.sub(%r{<table id="#{TABLE_ID}".*?</table>}m) do
        "<div class=\"memories-scroll\">#{Regexp.last_match(0)}</div>"
      end
    end

    def labels(config)
      config.fetch('alt_name_labels', {}).values.flatten.compact
    end

    # 拆单元格，忽略被转义的 \|
    def split_row(line)
      line.strip.sub(/\A\|/, '').sub(/\|\z/, '').split(/(?<!\\)\|/).map(&:strip)
    end

    # 返回 [[表头单元格, [[行号, 单元格], ...]], ...]
    def tables(markdown)
      found = []
      lines = markdown.split("\n", -1)
      i = 0
      while i < lines.length
        header, divider = lines[i], lines[i + 1]
        unless header.to_s.start_with?('|') && divider.to_s =~ /\A\|[\s\-:|]+\z/
          i += 1
          next
        end
        rows = []
        j = i + 2
        while j < lines.length && lines[j].start_with?('|')
          rows << [j + 1, split_row(lines[j])]
          j += 1
        end
        found << [split_row(header), rows]
        i = j
      end
      found
    end

    # 「日语：**X**」→ ['日语', '**X**']；无标签的自由备注 → [nil, 原文]
    def split_segment(segment)
      body = segment.sub(/\A(?:<[^>]+>\s*)+/, '') # 跳过 <del> 之类的前缀标签
      m = /\A([^：<>*\s]{1,8})：(.*)\z/m.match(body)
      m ? [m[1], m[2]] : [nil, body]
    end

    def lint_alt_cell(cell, allowed)
      errors = []
      return errors if cell.empty? || cell == '/'

      seen = []
      cell.split('；', -1).each do |segment|
        segment = segment.strip
        if segment.empty?
          errors << '「原名字/备注」里有空的「；」分段'
          next
        end
        label, body = split_segment(segment)
        next if label.nil? # 无标签的自由备注，不做限制

        if !allowed.include?(label)
          errors << "未知标签「#{label}」，如果要用请先加进 #{DATA}"
        elsif seen.include?(label)
          errors << "标签「#{label}」在同一行里出现了多次"
        end
        seen << label

        stray = allowed.find { |l| body.include?("#{l}：") }
        errors << "「#{label}」分段里还有一个「#{stray}：」，疑似漏了「；」" if stray
      end
      errors
    end

    def lint_tags(row)
      text = expand_self_closing(row.join('|'))
      PAIRED_TAGS.filter_map do |tag|
        open_count = text.scan(/<#{tag}(?:\s[^>]*)?>/).length
        close_count = text.scan(%r{</#{tag}>}).length
        "<#{tag}> 与 </#{tag}> 数量不符（#{open_count} vs #{close_count}）" if open_count != close_count
      end
    end

    def lint(markdown, config)
      allowed = labels(config)
      errors = []
      tables(markdown).each do |header, rows|
        alt_index = header.index(ALT_COLUMN)
        rows.each do |lineno, cells|
          prefix = "memories.md:#{lineno}（#{cells.first.to_s[0, 24]}）"
          if cells.length != header.length
            errors << "#{prefix}: 列数是 #{cells.length}，表头是 #{header.length}"
            next
          end
          messages = lint_tags(cells)
          messages += lint_alt_cell(cells[alt_index], allowed) if alt_index
          messages.each { |message| errors << "#{prefix}: #{message}" }
        end
      end
      errors
    end

    def run(root)
      config = YAML.load_file(File.join(root, DATA))
      lint(File.read(File.join(root, PAGE), encoding: 'utf-8'), config)
    end
  end
end

if defined?(Jekyll)
  Jekyll::Hooks.register :site, :post_read do |site|
    next unless File.exist?(File.join(site.source, Memories::PAGE))

    errors = Memories.run(site.source)
    next if errors.empty?

    raise Jekyll::Errors::FatalException, "memories 数据不合规范：\n  " + errors.join("\n  ")
  end

  Jekyll::Hooks.register :pages, :pre_render do |page|
    next unless page.data['id'] == Memories::PAGE_ID

    page.content = Memories.enable_markdown_in_tags(page.content)
  end

  Jekyll::Hooks.register :pages, :post_render do |page|
    next unless page.data['id'] == Memories::PAGE_ID

    page.output = Memories.wrap_table(page.output)
  end
elsif $PROGRAM_NAME == __FILE__
  errors = Memories.run(File.expand_path('..', __dir__))
  puts errors.empty? ? 'memories.md: OK' : errors.join("\n")
  exit(errors.empty? ? 0 : 1)
end
