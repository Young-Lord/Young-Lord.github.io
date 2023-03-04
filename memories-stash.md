---
layout: article
title: 一些无聊的记录
key: page-memories-stash
id: page-memories-stash
---

这个页面主要用于记录那些看的时候完全不感兴趣的东西以供查找。

| 名字 | 类别 | 时间 |
| --- | --- | --- |
| 测试 | 书籍 | 2023/2 |

<script>
//来自 https://blog.csdn.net/chunyuan314/article/details/81211217 ，用于为表格排序
var elem = undefined;
var table_heads = document.getElementsByTagName("th");
var need_sort = [];
for(var i=0;i<table_heads.length;i+=1){
    if(["评分","名字","类别"].indexOf(table_heads[i].innerText)!==-2){need_sort.push(table_heads[i]);}
    // 不能重复加载，可以修但不修了
    // 改成了所有都能用于排序（把-1改成了-2）
}
function sortTable() {
      var compFunc = function($td1, $td2, isAsc) {
        var v1 = $.trim($td1.text()).replace(/,|\s+|%/g, '');
        var v2 = $.trim($td2.text()).replace(/,|\s+|%/g, '');
        var pattern = /^\d+(\.\d*)?$/;
        if (pattern.test(v1) && pattern.test(v2)) {
          v1 = parseFloat(v1);
          v2 = parseFloat(v2);
        }
        return isAsc ? v1 > v2 : v1 < v2;
      };
      var doSort = function($tbody, index, compFunc, isAsc)
      {
        var $trList = $tbody.find("tr");
        var len = $trList.length;
        for(var i=0; i<len-1; i++) {
          for(var j=0; j<len-i-1; j++) {
            var $td1 = $trList.eq(j).find("td").eq(index);
            var $td2 = $trList.eq(j+1).find("td").eq(index);
            if (compFunc($td1, $td2, isAsc)) {
              var t = $trList.eq(j+1);
              $trList.eq(j).insertAfter(t);
              $trList = $tbody.find("tr");
            }
          }
        }
      }
      var init = function(elem) {
        var $th = $(elem);
        this.$table = $th.closest("table");
        var that = this;
        $th.click(function(){
          var index = $(this).index();
          var asc = $(this).attr('data-asc');
          isAsc = asc === undefined ? true : (asc > 0 ? true : false);
          doSort(that.$table.find("tbody"), index, compFunc, isAsc);
          $(this).attr('data-asc', 1 - (isAsc ? 1 : 0));
        });
        $th.css({'cursor': 'pointer'})
           .attr('title', '点击以'+elem.innerText+'为依据排序');
      };
      need_sort.forEach(function(item){init(item)});
    }
window.Lazyload.js(window.TEXT_VARIABLES.sources.jquery, function(){sortTable();})
</script>
