# PowJS

[![badge](https://img.shields.io/badge/Pow-JavaScript-green.svg?style=flat-square)](https://github.com/powjs/powjs)
[![npm](https://img.shields.io/npm/l/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)
[![npm](https://img.shields.io/npm/dm/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)
[![npm](https://img.shields.io/npm/dt/powjs.svg?style=flat-square)](https://www.npmjs.org/package/powjs)

PowJS 是一个编译型 Real-DOM 模板引擎.

    工作在浏览器环境, 直接在 DOM Tree 上编译, 渲染. DOM Tree 就是模板.
    采用原生 JavaScript 语法, 指令与 JavaScript 语句一一对应
    单节点的 HTML 源码模板 或 DOM Node 模板
    导出视图 JavaScript 源码格式
    属性插值 name="somethin {{expr}}"
    文本插值 {{expr}}, 并剔除文本节点两端空白
    推导形参 缺省形参 (v,k)

绕过文档直视 [Demo](https://codepen.io/achun/project/full/XjEvaw)

流程

```text
string, Node ----> PowJS <----> View
               |
               V
             render
```

DOM 节点与视图的转换关系:

```js
[
    'TAG', {/*attribute*/},
    function (v,k) {
        /*directives*/
    },
    [
        /*...childNodes*/
    ]
]
```

## 入门

PowJS 是个 module, 入口函数定义为:

```js
function (source, option) {
    /**
     * 参数
     *
     * source:
     *      undefined   返回 PowJS.prototype
     *      string      编译 单个祖节点 HTML 源码
     *      Node        编译 单个 DOM 节点
     *      Array       载入 已编译的 PowJS 视图
     *      其它        抛出错误或渲染结果为空
     * option:
     *      Object      编译选项或渲染的上下文对象
     *      其它        忽略
     *
     * 返回: PowJS.prototype 或 PowJS 实例
     */
}
```

NodeJS 环境下安装

```sh
yarn add powjs
```

浏览器环境下引入

```html
<script src="//unpkg.com/powjs"></script>
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

PowJS 模板写法:

```html
<nav>
    <div class="nav-wrapper">
      <div class="col s12" each="v">
        <!-- 下面的 v 是推导形参, 是上面 v 的遍历元素 -->
        <a href="#!" class="breadcrumb">{{v}}</a>
      </div>
    </div>
</nav>
```

使用 PowJS 编译该模板或载入编译好的视图, 并渲:

```js
let powjs = require('powjs');
let instance = powjs(htmlOrNodeOrView);
instance.render(['First','Second','Third']);
```

事实上可以手工写出该模板的编译结果(视图):

```js
[
    "NAV",     // 标签
    null,null, // 该节点没有属性和指令函数
    [          // 子节点
        [
            "DIV", {class:'nav-wrapper'},null,
            [
                [
                    "DIV", {class:'col s12'},
                    function(v, k) {         // 缺省推导形参
                        this.create();       // 自动生成的
                        return this.each(v); // each="v"
                    },
                    [
                        [
                            "A",
                            {href:'#!',class:'breadcrumb'},
                            function(v, k) {
                                this.create();
                                return this.text(v);
                            },
                            null
                        ]
                    ]
                ]
            ]
        ]
    ]
]
```

### option

该值包含编译选项和渲染上下文对象

    prefix   编译选项, string   指令前缀, 缺省为 ''
    discard  编译选项, [string] 被丢弃的属性名列表, 缺省为 []
    flag     渲染标记, 内部维护
    node     渲染节点, 内部维护
    plugins  渲染插件, 属性控制
    其它     用户自定义上下文

## 实例

属性:

    view    编译生成的视图数组, 完整的节点树
    parent  父节点(渲染子节点的容器)
    $       源自 [option](#option)

方法:

    create()     内部方法, 构建当前节点
    render(...)  渲染方法, 渲染子节点一次, 并返回 this
    each(...)    渲染方法, 迭代渲染子节点, 并返回 this
    node()       指令可用, 返回 this.$.node
    end()        对应指令
    text(expr)   对应指令, 设置或返回 this.node().textContent
    html(expr)   对应指令, 设置或返回 this.node().innerHTML
    attr(...)    辅助方法, 设置或返回 this.node() 属性值
    slice(...)   辅助方法, 调用 Array.prototype.slice
    export()     辅助方法, 导出视图为 JavaScript 源码
    childNodes() 辅助方法, 返回 this.parent.childNodes
    firstChild() 辅助方法, 返回 this.parent.firstChild
    required()   辅助方法, 添加 required 属性
    inc()        辅助方法, 全局计数器 return ++counter;
    pow(inc)     辅助方法, 全局计数ID if(inc)this.inc();return '-pow-'+counter;
    outerHTML()  辅助方法, 返回 this.parent.outerHTML ;

## 指令

指令是标签中的属性, 值为 JavaScript 表达式或语句, 所有指令生成一个 *指令函数*.

    param  ="...args"       声明指令函数的形参
    if     ="condition"     条件成立节点才会被渲染
    let    ="赋值语句"      设置局部变量
    do     ="code"          直接执行代码
    text   ="expr"          赋值当前节点的 textContent 值并返回
    html   ="expr"          赋值当前节点的 innerHTML 值并返回
    skip   ="condition"     条件成立或为空时, 不渲染子模板, 本节点保留
    end    ="condition"     条件成立或为空时, 渲染完子模板后结束
    break  ="condition"     条件成立或为空时, 渲染完子模板后不渲染后续兄弟模板
    render ="...args"       带参数渲染子节点一次并返回
    each   ="expr,...args"  迭代 expr 值调用 this.render(...args, v, k) 并返回
                            expr值 可以是 Object 或者可迭代对象
                            v, k 是 expr 的迭代值和键名

提示:

    render, each 总是渲染子节点, 根实例是个容器, 被渲染的节点是它的子节点

### 指令函数

指令函数的构建过程:

    0. 初始化 传入缺省形参 (v, k)
    1. 如果有 param 指令先确定形参, 否则使用继承形参
    2. 如果有 if 指令生成 if(!(expr)) return;
    3. 构建节点 this.create();
    4. 按指令在属性中的次序生成执行代码
    5. 如果使用了指令 render|each|html|text 后续指令被忽略
    6. 如果未使用指令 render|each|html|text 生成 return this.render(...)
    7. 遍历子节点重复步骤 1

### 推导形参

如果未使用 render|each 指令, 那么所有指令函数的形参上层的 param 定义的或 v, k.
如果使用了 render|each 指令, 参数通过测试且无重名, 那么作为子节点的形参.
each 指令还会添加形参 v, k.

形参测试正则其实就是无运算的纯变量名:

```js
let PARAMS_TEST = /^[$_a-zA-Z][$_a-zA-Z\d]*(\s*,\s*[$_a-zA-Z][$_a-zA-Z\d]*)*$/
```

### plugins

插件是一个函数, 在渲染执行, 用于控制当前节点的属性. 定义:

```js
/**
 * 插件原型
 * @param  {Element} node 当前节点
 * @param  {string}  val  属性值
 * @param  {string}  key  属性名
 * @param  {PowJS}   pow  当前的 PowJS 实例
 */
function plugin(node, val, key, pow) {
    //...
}
```

很简单, 示例:

```js
let pow = require('powjs');

pow('<img src="1.jpg">', {
    plugins:{
        'src': function(node, val) {
            node.setAttribute('data-src', val);
        }
    }
}).render().outerHTML();
// output: <img data-src="1.jpg">
```

### 示例

缺省形参

```html
<tag/>
```

生成

```js
function(v, k) {
    this.create(); // 生成构建节点
    return this.render(v, k); // 自动补充
}
```

指令示意

```html
<tag
    param='a, b'
    if="a"
    let="c=a*b"
    do="console.log(b)"
    class="a-class {{a}}"
    text="c"
    html="'<b>html</b>'"
    skip="c==0"
    break="c==1"
    end="c==-1"
    render="c"
    each="[1,2,3],c"
/>
```

生成

```js
function(a, b) {
    if(!(a)) return;
    this.create();
    var c=a*2;
    console.log(b);
    this.attr('class', "a-class " + (a)); // 属性插值
    return this.text(c);

    // 因为 text 指令已经返回, 现实中不会生成下面的代码

    return this.html('<b>html</b>');
    if(c==0) return; // skip
    if(c==1) this.break();
    if(c==-1) this.end();
    return this.render(c);
    return this.each([1,2,3],c);
}
```

可见: 一组指令完全对应一个标准的 JavaScript 函数

计算形参

```html
<ul each="v"><li>{{k}} {{v}}</li></ul>
```

输入

```js
[1,2]
```

输出

```html
<ul><li>0 1</li><li>1 2</li></ul>
```

冲突的例子, 假设输入参数类型为 Array, String

```html
<ul each="v,k"><li>{{v}}</li></ul>
```

多种解决方式

```html
<ul param="arr,str" each="arr,str">
    <li>{{str}} {{k}} {{v}}</li>
</ul>

<ul each="v,k">
    <li param="str,v,k">{{str}} {{k}} {{v}}</li>
</ul>

<ul let="str=k" each="v,str">
    <li>{{str}} {{k}} {{v}}</li>
</ul>
```

### 文本节点

文本节点剔除两端空白, 空白节点被忽略.

当整个模板是一个文本节点时, 默认的形参自然生效:

## 赞助

赞助以帮助 PowJS 持续更新

![通过支付宝赞助](https://user-images.githubusercontent.com/489285/31326203-9b0c95c0-ac8a-11e7-9161-b2d8f1cc00e8.png)
![通过微信赞助](https://user-images.githubusercontent.com/489285/31326223-c62b133a-ac8a-11e7-9af5-ff5465872280.png)
[![通过 Paypal 赞助](https://user-images.githubusercontent.com/489285/31326166-63e63682-ac8a-11e7-829a-0f75875ac88a.png)](https://www.paypal.me/HengChunYU/5)

## License

MIT License <https://github.com/powjs/powjs/blob/master/LICENSE>

[PowJS]: https://github.com/powjs/powjs
