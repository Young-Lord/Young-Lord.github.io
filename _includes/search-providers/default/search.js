var SOURCES = window.TEXT_VARIABLES.sources;
var PAHTS = window.TEXT_VARIABLES.paths;
window.Lazyload.js(
  [SOURCES.jquery, PAHTS.search_js, SOURCES.pinyin_pro],
  function () {
    var search = window.search || (window.search = {});
    var searchData = window.TEXT_SEARCH_DATA || {};
    var { match } = pinyinPro;

    function memorize(f) {
      var cache = {};
      return function () {
        var key = Array.prototype.join.call(arguments, ",");
        if (key in cache) return cache[key];
        else return (cache[key] = f.apply(this, arguments));
      };
    }

    /// search
    function searchByQuery(query) {
      query = query.toLowerCase().replaceAll("'", "");
      var i,
        j,
        key,
        keys,
        current_entry,
        _title,
        _url,
        result = {},
        filtered_each_result_list;
      keys = Object.keys(searchData);

      for (i = 0; i < keys.length; i++) {
        key = keys[i]; // only `posts` for now
        for (j = 0; j < searchData[key].length; j++) {
          current_entry = searchData[key][j];
          _title = current_entry.title.toLowerCase();
          _url = current_entry.url.toLowerCase();
          if (
            result[key] === undefined ||
            (result[key] && result[key].length < 100)
            // add only if less than 100 results
          ) {
            if (result[key] === undefined) {
              // init
              result[key] = [];
            }
            if (_title.indexOf(query) >= 0) {
              // match by name
              result[key].push([current_entry, 1]);
            } else if (_url.replace(/^\/posts\//, "").indexOf(query) >= 0) {
              // match by post url
              result[key].push([current_entry, 2]);
            } else if (match(_title, query, { continuous: true }) !== null) {
              // match by pinyin
              result[key].push([current_entry, 3]);
            }
          }
        }
        // sort result
        result[key].sort(function (a, b) {
          return a[1] - b[1];
        });
        // preserve only the entry, remove the weight
        result[key] = result[key].map(function (entry) {
          return entry[0];
        });
        // remove duplicate entries
        filtered_each_result_list = [];
        result[key].forEach(function (entry) {
          if (filtered_each_result_list.indexOf(entry) === -1) {
            filtered_each_result_list.push(entry);
          }
        });
        result[key] = filtered_each_result_list;
        if (result[key].length === 0) {
          delete result[key];
        }
      }
      return result;
    }

    var renderHeader = memorize(function (header) {
      return $('<p class="search-result__header">' + header + "</p>");
    });

    var renderItem = function (index, title, url) {
      return $(
        '<li class="search-result__item" data-index="' +
          index +
          '"><a class="button" href="' +
          url +
          '">' +
          title +
          "</a></li>"
      );
    };

    function render(data) {
      if (!data) {
        return null;
      }
      var $root = $("<ul></ul>"),
        i,
        j,
        key,
        keys,
        cur,
        itemIndex = 0;
      keys = Object.keys(data);
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        $root.append(renderHeader(key));
        for (j = 0; j < data[key].length; j++) {
          cur = data[key][j];
          $root.append(renderItem(itemIndex++, cur.title, cur.url));
        }
      }
      return $root;
    }

    // search box
    var $result = $(".js-search-result"),
      $resultItems;
    var lastActiveIndex, activeIndex;

    function clear() {
      $result.html(null);
      $resultItems = $(".search-result__item");
      activeIndex = 0;
    }
    function onInputNotEmpty(val) {
      $result.html(render(searchByQuery(val)));
      $resultItems = $(".search-result__item");
      activeIndex = 0;
      $resultItems.eq(0).addClass("active");
    }

    search.clear = clear;
    search.onInputNotEmpty = onInputNotEmpty;

    function updateResultItems() {
      lastActiveIndex >= 0 &&
        $resultItems.eq(lastActiveIndex).removeClass("active");
      activeIndex >= 0 && $resultItems.eq(activeIndex).addClass("active");
    }

    function moveActiveIndex(direction) {
      var itemsCount = $resultItems ? $resultItems.length : 0;
      if (itemsCount > 1) {
        lastActiveIndex = activeIndex;
        if (direction === "up") {
          activeIndex = (activeIndex - 1 + itemsCount) % itemsCount;
        } else if (direction === "down") {
          activeIndex = (activeIndex + 1 + itemsCount) % itemsCount;
        }
        updateResultItems();
      }
    }

    $(window).on("keyup", function (e) {
      var modalVisible = search.getModalVisible && search.getModalVisible();
      var processed = false;
      if (modalVisible) {
        if (e.key === "ArrowUp") {
          moveActiveIndex("up");
          processed = true;
        } else if (e.key === "ArrowDown") {
          moveActiveIndex("down");
          processed = true;
        } else if (e.key === "Enter") {
          if ($resultItems && activeIndex >= 0) {
            $resultItems.eq(activeIndex).children("a")[0].click();
            processed = true;
          }
        }
        if (processed) {
          return false;
        }
      }
    });

    $result.on("mouseover", ".search-result__item > a", function () {
      var itemIndex = $(this).parent().data("index");
      itemIndex >= 0 &&
        ((lastActiveIndex = activeIndex),
        (activeIndex = itemIndex),
        updateResultItems());
    });
  }
);
