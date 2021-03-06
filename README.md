# PowJS

[![badge](https://img.shields.io/badge/Pow-ECMAScript-green.svg?style=flat-square)](https://github.com/powjs/powjs)
[![npm](https://img.shields.io/npm/l/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)
[![npm](https://img.shields.io/npm/dm/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)
[![npm](https://img.shields.io/npm/dt/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)

PowJS 是一个 ECMAScript 6 编译型 Real-DOM 模板引擎.

    Real-DOM 直接在 DOM Tree 上编译, 渲染. DOM Tree 就是模板
    原生语法 指令与 ECMAScript 原生语法对应
    导出视图 采用 ECMAScript 源码
    属性插值 非指令属性可使用插值 name="somethin {{expr}}"
    文本插值 文本节点可使用插值 {{expr}}, 总是剔除文本节点两端的空白
    缺省形参 顶层缺省形参为 (v, k)
    形参传递 除非使用 param 指令, 子层继承上层的形参

分享请至 [Wiki][].

流程

```text
HTML string ---> Real DocumentFragment
                   |
                   V
Real Node   ---> PowJS <---> View
                   |
                   V
                 render(...args)
                   |
                   V
                 Real DocumentFragment ---> Real DOM
```

## install

NodeJS 环境

```sh
yarn add powjs
```

浏览器环境

```html
<script src="//unpkg.com/powjs"></script>
```

## 入门

PowJS 是个 module, 入口函数定义为:

```js
module.exports = function (source, option) {
  /**
   * 参数
   *
   *   source:
   *      undefined     返回 PowJS.prototype
   *      string        编译  HTML 源码
   *      Node          编译 单个 DOM 节点
   *      [Node]        编译 多个 DOM 节点
   *      [Array]       载入 已编译的 PowJS 视图
   *      其它          抛出错误或渲染结果为空
   *
   *   option:
   *      string        可选编译时指令前缀, 缺省为 ''
   *      Object        可选渲染期 addon
   *      其它          忽略
   *
   * 返回
   *
   *   PowJS.prototype  如果 source === undefined
   *   PowJS 实例       如果 source instanceof Node
   *                      或 Array.isArray(source)
   */
};
```

渲染过程在 DocumentFragment 中进行, 不直接影响页面.

导出的视图是视图数组, 每个视图的结构与 DOM 节点结构对应:

```js
/*! Generated by PowJS. Do not edit */
module.exports = [
  [
    'TAG',
    {/*Non-interpolation attribute*/},
    function (param, paramN) {
        /*directives or interpolation*/
    },
    [
        /*...view of childNodes*/
    ]
    /* There may be a name */
  ]
  /* more view ...*/
];
```

以面包屑导航为例:

```html
<nav>
  <div class="nav-wrapper">
    <div class="col s12">
      <a href="#!" class="breadcrumb">First</a>
      <a href="#!" class="breadcrumb">Second</a>
      <a href="#!" class="breadcrumb">Third</a>
    </div>
  </div>
</nav>
```

PowJS 高可读性模板写法:

```html
<nav func="breadcrumb" param="paths">
  <div class="nav-wrapper">
    <div class="col s12" each="paths, val-path">
      <a href="#!" class="breadcrumb">{{path}}</a>
    </div>
  </div>
</nav>
```

使用 PowJS 编译并生成代码(视图数组):

```js
const powjs = require('powjs');
let instance = powjs(htmlOrNodeOrView);
instance.toScript();
// instance.render(['First','Second','Third']);
```

生成:

```js
[
  [
    "NAV", 0, 0,
    [
      [
        "DIV",{ class: "nav-wrapper" }, 0,
        [
          [
            "DIV", { class: "col s12" }, function(paths) {
              this.each(paths);
            },
            [
              [
                "A", { href: "#!", class: "breadcrumb" }, 0,
                [
                  [
                    "#", 0, function(path, k, $l, $n) {
                      this.text(`${path}`);
                    }
                  ]
                ]
              ]
            ]
          ]
        ]
      ]
    ],
    "breadcrumb"
  ]
]
```

可用伪代码表示为:

```js
function breadcrumb(paths) {
  create('nav');
  createChild(function() {
    create('div', {class: 'nav-wrapper'});
    createChild(function(){
      create('div', {class: 'col s12'});
      eachCreateChild(paths, function(path) {
        create('a', {href: '#!', class: 'breadcrumb'});
        createChild(function(path) {
          text(path);
        });
      });
    });
  });
}
```

还有更简约的写法, 没有函数名(视图名), 使用缺省形参名 `v`:

```html
<nav>
  <div class="nav-wrapper">
    <div class="col s12" each="v">
      <a href="#!" class="breadcrumb">{{v}}</a>
    </div>
  </div>
</nav>
```

## 指令

指令在节点中是属性, 值为 ECMAScript 表达式或语句, 最终拼接生成视图函数.

    func   ="name"            给生成的视图函数命名
    param  ="v,k"             生成视图函数的形参: 参见示例
    if     ="cond"            渲染条件和可变标签: 参见下文
    let    ="a=expr,b=1"      局部变量: let a=expr,b=1;
    do     ="code"            执行代码: code;
    text   ="expr"            设置文本: this.text(expr);
    html   ="expr"            设置HTML: this.html(expr);
    end                       保留本节点, 终止渲染: return this.end();
    end    ="cond"            保留本节点, 终止条件: if(cond) return this.end();
    skip                      跳过子层渲染: this.skip();
    skip   ="cond"            子层渲染条件: if(cond) this.skip();
    break                     跳过兄弟层渲染: this.break();
    break  ="cond"            兄弟层渲染条件: if(cond) this.break();
    render ="args,argsN"      渲染子层: this.render(args,argsN);
    each   ="expr,args,argsN" 遍历渲染子层: this.each(expr,args,argsN);

### 指令顺序

首先指令作为节点属性不会重复, 这是 HTML DOM 规范规定的.

指令执行顺序:

1. 创建节点 包含 `if` 指令产生的代码
1. 设置静态属性 无插值的属性
1. 执行生成视图函数, 具体代码和指令或插值属性出现的次序一致

前文的示例已经表明, PowJS 的模板结构和视图函数是完全对应的:

```html
<tag func="name" param="data" if="Array.isArray(data)"
  id="{{data[0]}}" each="data" break class="static">
  <!-- ... -->
</tag>
```

对应伪代码:

```js
function name(data) {
  if(Array.isArray(data))
    this.create('tag', {class:'static'});
  else
    return;
  this.attr('id', data[0]);
  this.each(data);
  this.break();
}
```

指令 `skip` 不应该写在 `each`, `render`, `html`, `text` 之后, 因为子层已被渲染.
同理先写 `end` 的话后续指令不会被执行.

有可能需要在 `each`, `render` 之后写 `do` 指令做后续的处理.

PowJS 在编译期会检查有明显冲突的指令顺序, 养成良好的指令顺序书写习惯更重要.
比如指令 `func`, `param`, `if` 应该写在最前面才利于阅读.

### 插值

插值可用于文本节点或者非指令属性, 指令只能使用 ECMAScript, 不能使用插值.

插值被转换为 ECMAScript 模板字符串, PowJS 只是替换 `{{`, `}}` 为 `${`,`}`.

    abc {{exp}} def  ===> `abc ${exp} def`

### func

指令 `func` 给生成的视图函数命名, 以便在视图中调用.

```html
<b func="name"><i>{{@name}}</i></b>
<b func="name"><i if="something && '@name';"></i></b>
<b func="name"><i do="if(something) return this.call('name',arg)"></i></b>
```

如上所示, 调用子视图函数有两种方法:

- 在 文本节点中调用, 文本表达式有 `{{@`, `}}` 包裹
- 在 `if` 中返回 `@` 开头视图名字符串, 此时未创建当前节点, 行为是转让节点
- 用 `this.call` 传递视图名和其它实参, 此时已创建当前节点, 行为是创建子节点

调用视图相当于调用子函数, 可能产生递归甚至死循环, 应谨慎使用.

例:

```html
{{@name}}<span func="name">yes</span>
<!-- render().html() output: -->
<span>yes</span><span>yes</span>
```

例:

```html
<i if="'@name';">never</i><span func="name">yes</span>
<!-- render().html() output: -->
<span>yes</span><span>yes</span>
```

例:

```html
<b><i if="'@name';">never</i></b><span func="name">yes</span>
<!-- render().html() output: -->
<b><span>yes</span></b><span>yes</span>
```

例:

```html
<i do="return this.call('name')">never</i><span func="name">yes</span>
<!-- render().html() output: -->
<i><span>yes</span></i><span>yes</span>
```

例:

```html
<b><i do="return this.call('name')">never</i></b><span func="name">yes</span>
<!-- render().html() output: -->
<b><i><span>yes</span></i></b><span>yes</span>
```

### param

指令 `param` 用于生成视图函数的形参, 如果使用必须包含完整的形参名列表,
否则继承上级产生的形参名.

### each-render

指令 `render` 渲染子层, 指令 `each` 遍历第一个参数, 调用 `render` 并附加参数.

支持对子层形参推导: 满足任何一个条件就进行形参推导, 否则子层继续使用继承形参.

- 在值(参数)中以 `:` 开头, 从后续的实参中提取子层的形参名 `param`
- 在 `each` 中使用 `xxx-` 自定义形参名, 否则使用缺省参数名

指令 `each` 总是以固定次序将下列四个参数添加到用户参数之后.

1. 遍历的值 可使用 `val-` 自定义该形参名, 缺省 `v`
1. 遍历的键 可使用 `key-` 自定义该形参名, 缺省 `k`
1. 长度总数 可使用 `len-` 自定义该形参名, 缺省 `$l`
1. 本次序号 从 1 开始, 可使用 `num-` 自定义该形参名, 缺省 `$n`

行为:

- 形参推导仅对子层有效
- 不进行语法分析, 只是简单的字符串处理
- `each` 附加的参数总是添加到用户参数之后, 且次序固定
- 子层总是可以使用 `param` 重新定义形参名

例: render 参数未以 `:` 开头, 不进行形参推导

```html
<ul render="k,v"><li>{{k}}{{v}}</li></ul>
<!-- pow.render(1,2).html() output: -->
<ul><li>12</li></ul>
```

例: render 参数以 `:` 开头, 进行了形参推导

```html
<ul render=":k,v"><li>{{k}}{{v}}</li></ul>
<!-- pow.render(1,2).html() output: -->
<ul><li>21</li></ul>
```

例: each 总是附加参数在最后

```html
<dl param="array, id" each=":array,id">
  <dd>{{id}}:{{item}}</dd> <!-- function(id,item,v,k,$l,$n) -->
</dl>

<dl param="array, id" each="array,id,val-item">
  <dd>{{id}}:{{item}}</dd> <!-- function(id,item,k,$l,$n) -->
</dl>

<dl param="array, id" each=":array,id,val-item,num-row">
  <dd>{{id}}:{{item}}</dd> <!-- function(id,item,key,$l,row) -->
</dl>
```

形参推导中的形参名提取算法:

```js
/**
 * Split arguments expression for Parameter-Inference
 * @param  {String} expOfRenderOrEach Does not include the starting ':'
 * @return {array}
 */
function splitArguments(expOfRenderOrEach) {
  return expOfRenderOrEach.match(/(key-|val-)?(([a-z]\w*),|([a-z]\w*)$)/ig)
    .map(function(s) {
      return s.endsWith(',')?s.slice(0,-1):s;
    });
}
```

### if

指令 `if` 会生成一个函数, 判定渲染条件的同时可以改变节点名称, 或调用其它视图.

例: 纯渲染条件

```html
<ul param="data" if="Array.isArray(data)"></ul>
```

生成:

```js
[
  [
    function(data) {
      return Array.isArray(data) && "UL";
    },
  ]
]
```

例: 以 `;` 结尾不添加缺省标签

```html
<ul param="data" if="Array.isArray(data) && 'OL'||'DIV';"></ul>
```

生成:

```js
[
  [
    function(data) {
      return (Array.isArray(data) && "OL") || "DIV";
    },
  ]
]
```

例: 使用引号包裹的占位符 `---`, 但 PowJS 不会判断引号是否存在.

```html
<ul param="data" if="Array.isArray(data) && '---'"></ul>
```

生成:

```js
[
  [
    function(data) {
      return Array.isArray(data) && "UL";
    },
  ]
]
```

该指令的内部实现:

```js
directives.if = function(exp, tag) {
  if(exp.includes('---')){
    exp = exp.replace(/---/g, tag);
    return `return ${exp};`;
  }

  if(exp.endsWith(';')) return `return ${exp}`;
  return `return ${exp} && '${tag}';`;
};
```

即:

1. 包含占位符 `---`, 替换 `---` 为当前标签名
1. 以 `||` 结尾, 添加 `TAG`
1. 否则添加 `&& TAG`

返回值的影响:

- 非字符串   放弃创建节点
- 空字符串   放弃创建节点
- `#` 开头   `Text` 节点, `#` 之后的字符串作为节点的内容
- `@` 开头   调用命名视图, 且传递继承的实参
- `=` 开头   `=` 之后的字符串向 `this.parent.textContent` 赋值, 典型用例 `style`
- `!` 开头   注释节点, `!` 之后的字符串作为节点的内容
- `:` 开头   伪节点, 执行操作 `this.node = this.parent`, 并继续执行后续指令(代码)
- 字母开头   创建 `Element` 节点
- 其它       不创建节点并继续执行后续指令(代码), 注意此时 `this.node === null`

### skip-break

在渲染函数中 `render` 渲染子层是本层的一个步骤, `skip` 跳过本层就是跳过子层渲染.
而子层渲染是在一个循环中, `break` 跳出循环就是跳过兄弟层渲染.

### do

当其它指令无法满足需求时 `do` 是最后一招, 直接写原生 ECMAScript 代码.

例:

```html
<div param="array" if="isArray(array)"
  do="if(isArray(array[0])) return this.each(array)">
  ...
</div>
```

生成:

```js
[
  [
    function(array) {
      return isArray(array) && "DIV";
    },
    0,
    function(array) {
      if (isArray(array[0])) return this.each(array);
      this.render(array); // PowJS 补全缺省行为
    },
    [["#..."]]            // # 开头的是 Text 节点
  ]
]
```

如果使用的指令都和渲染无关, PowJS 就会补全 `this.render`.

同理, 善用 `skip` 指令可以避免补全的 `this.render` 被执行.

## 属性和方法

属性:

    x       addon, 如果需要可以随时设置
    node    只读, 当前渲染生成的节点
    parent  只读, 当前节点的父节点, 最顶层是 DocumentFragment BODY 临时节点

方法:

    create()          内部方法, 构建当前节点
    end()             内部方法, 用于指令
    break()           内部方法, 用于指令
    render(...)       渲染入口, 渲染并返回 this
    each(x,...)       遍历渲染, 渲染并返回 this, 内部调用 this.render(..., v, k)
    text(expr)        指令专用
    html(expr)        指令专用
    call(name,...)    视图调用
    addon(object)     辅助方法, 设置插件或上下文, 返回 this
    isRoot()          辅助方法, 返回 this 是否是顶层视图的 PowJS 实例
    isReal()          辅助方法, 返回 当前节点是否连接到真实的页面 DOM 中
    attr(attrName[,v])辅助方法, 设置或返回当前节点属性值
    prop(propName[,v])辅助方法, 设置或返回当前节点特征值. 比如 checked.
    firstChild()      辅助方法, 返回 this.parent.firstChild
    childNodes()      辅助方法, 返回 this.parent.childNodes
    lastChild()       辅助方法, 返回 this.parent.lastChild
    query(selector)   辅助方法, 返回 this.parent.querySelectorAll(selector)
    slice(...)        辅助方法, 调用 Array.prototype.slice
    inc()             辅助方法, 计数器 return ++counter
    pow(inc)          辅助方法, 计数ID if(inc)this.inc();return '-pow-'+counter
    toScript()        辅助方法, 导出视图源码
    exports(target)   辅助方法, 导出视图源码, 前缀 `module.exports =`
    renew(node)       节点操作, 用渲染的节点替换 node
    appendTo(node)    节点操作, 追加渲染的节点到 node 末尾
    insertBefore(node)节点操作, 插入渲染的节点到 node 之前
    insertAfter(node) 节点操作, 插入渲染的节点到 node 之后
    removeChilds()    节点操作, 删除 this.node 下全部的子节点

### each

同名指令 `each`, 该方法可遍历 `[object Object]` 或 ArrayLike 对象.
总是附加参数: 值, 键(序号) 传递给 `render` 方法.

### end

只要调用了 `end()` 方法, 必须确保结束视图函数, 就像指令方式用 `return` 那样.
否则, 复杂的逻辑或不良的指令次序可能会造成非预期的结果.

## isRoot

顶层视图生成的 PowJS 实例是顶层实例, 渲染过程中的会生成临时实例.
顶层实例的 `parent` 属性和 `node` 属性是同一个对象, 且顶层的 `root` 属性为 null.

实现:

```js
PowJS.prototype.isRoot = function() {
  return !this.root;
};
```

这个对象是:

```js
document.createElement('template').content;
```

渲染过程是在 template -> DocumentFragment 中进行, 不直接影响页面.

顶层实例可能会拥有多个子节点, 这取决于:

- 模板顶层有多个节点
- render 被多次执行
- 子节点是否被添加到页面上(取走)

造成事实:

- view   视图数组, 每个元素都是生成一个节点的一个视图
- render 渲染子节点, 遍历渲染 view 数组的每个元素, 生成子节点添加到 parent
- each   遍历渲染子节点, 调用 render 并传递值, 键(索引)

不应该对顶层对象使用 `attr`, `prop` 方法. 慎用 `text`, `html` 方法.

### Why

不使用 `this.parent === this.node` 进行 `isRoot` 有更深层的原因:

    这使得 this.parent 和 this.node 可以分离, 产生更多变化的可能.
    比如设置 this.parent 或者 this.node 指向页面上的节点, 进行实时渲染.

## addon

PowJS 实例的 `x` 属性就是用户传入的 `addon` 对象, 它融合了插件和用户上下文.
当节点的属性名和 `addon` 下的属性名匹配且是个函数时, 该函数就是插件,
在渲染时匹配到属性名时被执行. 显然如果未判定为插件, 那就由用户控制(上下文).

插件函数原型:

```js
/**
 * 插件原型, 如果被执行, PowJS 不再对该属性进行设置
 * @param  {PowJS}   pow  当前的 PowJS 实例
 * @param  {string}  val  属性值
 * @param  {string}  key  属性名
 */
function plugin(pow, val, key) {
    //...
}
```

例:

```js
let pow = require('powjs');

pow(`<img src="1.jpg" do="this.attr('src','2.jpg')">`, {
  src: function(pow, val) {
      pow.attr('data-src', val);
  }
}).render().html();
// output: <img data-src="2.jpg">
```

## 伪节点

伪节点不生成 DOM 节点, 起到代码块的效果.

鉴于目前自定义节点尚未在主流浏览器普及, 可以通过 `if="':';"` 产生伪节点:

```html
<div param="array" if="':';" each="array,val-name">
<b>{{name}}</b>
</div>
<!-- render([1,2,3]) output -->
<b>1</b><b>2</b><b>3</b>
```

视图:

```js
[
  [
    function(array) {
      return ":";
    },
    0,
    function(array) {
      this.each(array);
    },
    [
      [
        "B",
        0,
        0,
        [
          [
            "#",
            0,
            function(name, k, $l, $n) {
              this.text(`${name}`);
            }
          ]
        ]
      ]
    ]
  ]
]
```

## xPowJS

可以使用 `require('powjs')()` 获得 PowJS.prototype 进行扩展.
为防止与未来版本冲突, PowJS 保留以 `$` 开头的属性或方法, 保证不使用 `x` 开头的.
事实上 `x` 属性已经分配给用户插件.

## shadowRoot

PowJS 不处理 shadowRoot. 如果在构造方法中使用 PowJS 构建子节点, 那也是独立的.

所以 `powjs(shadownode).html()` 不会包括 `shadownode.shadowRoot.innerHTML` 的内容,
这和 Shadow DOM 的原始语义完全一致.

## 赞助

赞助以帮助 PowJS 持续更新

![通过支付宝赞助](https://user-images.githubusercontent.com/489285/31326203-9b0c95c0-ac8a-11e7-9161-b2d8f1cc00e8.png)
![通过微信赞助](https://user-images.githubusercontent.com/489285/31326223-c62b133a-ac8a-11e7-9af5-ff5465872280.png)
[![通过 Paypal 赞助](https://user-images.githubusercontent.com/489285/31326166-63e63682-ac8a-11e7-829a-0f75875ac88a.png)](https://www.paypal.me/HengChunYU/5)

## License

MIT License <https://github.com/powjs/powjs/blob/master/LICENSE>

[PowJS]: https://github.com/powjs/powjs
[Wiki]: https://github.com/powjs/powjs/wiki