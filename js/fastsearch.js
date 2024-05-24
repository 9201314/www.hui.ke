let fuse; // 搜索引擎实例
let searchVisible = false; // 搜索框是否可见
let firstRun = true; // 用于标记是否第一次运行，以便延迟加载json数据
const list = document.getElementById('searchResults'); // 目标<ul>元素
let first, last; // 搜索结果的第一个和最后一个子元素
const maininput = document.getElementById('searchInput'); // 搜索输入框
let resultsAvailable = false; // 是否有搜索结果

// 主键盘事件监听器
document.addEventListener('keydown', (event) => {
    // CMD-/ 显示/隐藏搜索框
    if (event.metaKey && event.key === '/') {
        // 如果是第一次调用搜索，加载json搜索索引
        if (firstRun) {
            loadSearch(); // 加载json数据并构建fuse.js搜索索引
            firstRun = false; // 确保不再重复加载
        }

        // 切换搜索框的可见性
        toggleSearchVisibility();
    }

    // 允许通过ESC键关闭搜索框
    if (event.key === 'Escape') {
        if (searchVisible) {
            toggleSearchVisibility();
        }
    }

    // 向下箭头键
    if (event.key === 'ArrowDown') {
        if (searchVisible && resultsAvailable) {
            event.preventDefault(); // 阻止窗口滚动
            if (document.activeElement === maininput) {
                first.focus(); // 如果当前聚焦在输入框，聚焦到第一个搜索结果
            } else if (document.activeElement === last) {
                last.focus(); // 如果在最后一个结果，保持不变
            } else {
                document.activeElement.parentElement.nextElementSibling.querySelector('a').focus(); // 否则聚焦到下一个搜索结果的<a>元素
            }
        }
    }

    // 向上箭头键
    if (event.key === 'ArrowUp') {
        if (searchVisible && resultsAvailable) {
            event.preventDefault(); // 阻止窗口滚动
            if (document.activeElement === maininput) {
                maininput.focus(); // 如果当前在输入框，不做任何操作
            } else if (document.activeElement === first) {
                maininput.focus(); // 如果在第一个结果，返回输入框
            } else {
                document.activeElement.parentElement.previousElementSibling.querySelector('a').focus(); // 否则聚焦到上一个搜索结果的<a>元素
            }
        }
    }
});

// 每次输入一个字符时执行搜索
maininput.addEventListener('keyup', (e) => {
    executeSearch(e.target.value);
});

// 切换搜索框的可见性
const toggleSearchVisibility = () => {
    const fastSearch = document.getElementById("fastSearch");
    if (!searchVisible) {
        fastSearch.classList.add("active"); // 添加active类名，显示搜索框
        maininput.focus(); // 聚焦到输入框，便于直接输入
        searchVisible = true; // 标记搜索框可见
    } else {
        fastSearch.classList.remove("active"); // 移除active类名，隐藏搜索框
        document.activeElement.blur(); // 移除搜索框的聚焦
        searchVisible = false; // 标记搜索框不可见
    }
};

// 当搜索输入框获得焦点时切换搜索框的可见性，并加载搜索索引
maininput.addEventListener('focus', () => {
    if (firstRun) {
        loadSearch(); // 加载json数据并构建fuse.js搜索索引
        firstRun = false; // 确保不再重复加载
    }
    if (!searchVisible) {
        toggleSearchVisibility();
    }
});

// 监听点击事件，判断是否点击了#fastSearch之外的区域
document.addEventListener('click', (event) => {
    const fastSearch = document.getElementById("fastSearch");
    if (!fastSearch.contains(event.target) && searchVisible) {
        toggleSearchVisibility();
    }
});

// 使用Fetch API获取json数据
const fetchJSONFile = (path, callback) => {
    fetch(path)
        .then(response => response.json())
        .then(data => {
            if (callback) callback(data);
        })
        .catch(error => console.error('Error fetching JSON:', error));
};

// 加载搜索索引，只在第一次调用搜索框时执行
const loadSearch = () => {
    fetchJSONFile('/index.json', (data) => {
        const options = { // fuse.js配置选项
            shouldSort: true,
            location: 0,
            distance: 100,
            threshold: 0.4,
            ignoreLocation: true,
            minMatchCharLength: 2,
            keys: ['title', 'permalink', 'content']
        };
        fuse = new Fuse(data, options); // 从json数据构建索引
    });
};

// 执行搜索，每次在搜索框输入字符时调用
const executeSearch = (term) => {
    const results = fuse.search(term); // 使用fuse.js运行查询
    let searchitems = ''; // 存放结果的HTML
    if (results.length === 0 && term.trim() !== '') { // 如果没有结果且输入框不为空
        searchitems = '<p class="not-found">(⊙o⊙)？等半天你跟我说没搜到？(╯‵□′)╯︵┻━┻！换个关键词试试呢 (ಥ _ ಥ)</p>';
        resultsAvailable = false;
    } else { // 构建HTML
        results.slice(0, 50).forEach(result => {
            searchitems += `
        <li>
          <a href="${result.item.permalink}" tabindex="0">
            <div class="title">${result.item.title}</div>
            <div class="meta">
              <span class="section">${result.item.section}</span> -
              <span class="date">${result.item.date}</span>
            </div>
            <div class="description">${result.item.description}</div>
          </a>
        </li>`;
        });
        resultsAvailable = results.length > 0;
    }

    list.innerHTML = searchitems;
    if (results.length > 0) {
        first = list.querySelector('a'); // 第一个结果的<a>元素
        last = list.lastElementChild.querySelector('a'); // 最后一个结果的<a>元素
    }
};