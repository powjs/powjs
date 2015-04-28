PowJS
=====

*次项目仍在开发中, 所有特征尚未固定*

PowJS 的核心是一个 DOM 模板引擎, 最终转化为 JavaScript 代码. 
DOM 模板引擎使用 HTML 格式模板, 把 HTML 和 JavaScript 黏合在一起, 使用编程语言的逻辑语句, 流程控制, 定义变量, 获取数据, 函数调用, 发出请求, 管理事件, 延迟触发, 甚至挂起恢复. 写 HTML 就是写程序. 这是个强大模板引擎, 名副其实的 Power JavaScript.

用例代码

```html
<template>
<h1>
    <div fragment if="Pow.isMini" break>
        糟糕! 引入的 <strong>pow.js</strong> 不含注释, 无法提取 API 文档.
    </div>
    PowJS API
</h1>
<ul>
    <li repeat="Pow" class="api-{{Pow.oString(v)}}">{{k}}</li>
</ul>
</template>
```

代码用于生成 PowJS API 文档, Pow.isMini 指示是否使用了无注释版本.

    模板通常以 `template` 包裹, `template` 本身不会出现在渲染结果中.
    fragment 指令表示一个代码块, 只渲染后代节点, 它所在的标签只是占位.
    if 指令当 `Pow.isMini` 为真时后代才会被处理, 否则该节点(和后代)不被渲染.
    break 在 if 之后, `Pow.isMini` 为真 break 会中断兄弟节点的处理.
    repeat 枚举参数 `Pow` 重复生成所在节点, 就像常见的 `each`.
    求值表达式是合法的 javascript 表达式, 由一对 `{{` , `}}` 包裹

HTML 层级结构与 JavaScript 代码块层级结构对应. 属性书写顺序与指令执行顺序一致.

PowJS 的实现重点围绕一个问题: HTML 函数化. 对于一个 JavaScript 函数

```js
function name(params...) {
    codebody;
    return results
}
```

需要解决的问题有:

    匿名函数或命名函数.
    参数名.
    执行体. 包含各种流程, 分支, 循环, 递归, break.
    返回值. 包括异步返回.
    一组有序函数的调用, 参数传递.
    this 绑定.


指令
====

指令在 HTML 中以属性表现, 属性名即指令名, 属性值即指令主体. 不同指令的格式或有区别, 通常衍生于 JavaScript 原生语法. PowJS 尝试对每一个属性匹配指令, 如果没有当作常规属性或者求值表达式处理.

repeat 指令
```html
<li repeat="Pow" class="api-{{Pow.oString(v)}}">{{k}}</li>
```

等同
```html
<li repeat="Pow v,k" class="api-{{Pow.toString(v)}}">{{k}}</li>
```

可以自定义参量名
```html
<li repeat="Pow value,key" class="api-{{MyMethod(value)}}">{{key}}</li>
```

对比 JavaScript 的写法是如何相似
```js
Pow.some(Pow, function(value,key) {
    // {{key}} 子节点层级关系
})
```


文本绑定
========

`bind` 指令监视某对象的一个属性, 当该属性被赋值时, 所有文本绑定后代节点会被刷新. 文本绑定是以 `#` 开头的表达式.

    <span bind="stage.signin">{{#stage.signin?'已':'请'}}登录</span>

事实上 `bind` 监视的对象与文本绑定表达式中访问的对象没有必然联系, `bind` 只是设置一个触发条件.

作用范围
--------
从 HTML 语义来说

    {{#stage.signin?'已':'请'}}登录

是一个 Text 节点, 节点内只要有一个文本绑定表达式, 整个节点都作为文本绑定节点处理. 同理, 如果文本绑定表达式出现在属性值中, 那该属性值也作为一个整体.

自动运行
========

document 标准属性 `readyState` 当文档正在加载时返回"loading",当文档结束渲染但在加载内嵌资源时(DOMContentLoaded)返回"interactive", 当文档加载完成时返回"complete". 常规方法使用 `document.onreadystatechange` 触发指定的函数. PowJS 提出另外一种方式 `meta readyState`:

```html
<meta name="onreadystatechange" content="complete" powjs zepto jquery>
```

意思当 `readyState` 为 "complete" 时, 执行 PowJS,Zepto,jQuery 的默认行为. 如果相应的脚本没有被加载自然不会被执行. 当然条件是 Zepto,jQuery 也支持 `meta readyState` 的话(现在还不支持).
此方式好处很明显, 通常一个页面上不会同时被加载 Zepto 和 jQuery, 无论页面加载了那个, 这样的写法是无副作用的. 甚至你可以写多条或加上参数:

```html
<meta name="onreadystatechange" content="interactive" powjs="template [xjson]">
<meta name="onreadystatechange" content="complete" zepto jquery>
```

PowJS 缺省从 `template` 提取模板, 从 `[xjson]` 提取数据.

xjson
=====
xjson 以 HTML 标签包装 JSON. 使 JSON 数据以 HTML 展现.

数据类型和标签名对应关系

    null     var,param
    true     var,param
    false    var,param
    Number   var,param
    Object   div
    Array    div[array]
    String   除去 var,param,div,head 元素,表单元素以外的标签

null,true,false,Number 的值可智能识别. String 类型根据标签不同从 src,href,textContent,innerHTML 提取.

键名

    name="notEmpty"

用 xjson 展示地址: https://api.github.com/orgs/powjs/repos

```html
<div xjson array>
    <div>
        <param name="id" value="24525592">
        <h1 name="name">pow.js</h1>
        <p name="full_name">powjs/pow.js</p>
        <div name="owner">
            <p name="login">powjs</p>
            <img name="avatar_url" src="https://avatars.githubusercontent.com/u/8936527?v=3">
            <a name="url" href="https://api.github.com/users/powjs"></a>
        </div>
    </div>
</div>
```

如果要嵌入 HTML 源码字符串, 可用标签也很多, 比如 `article`. 甚至可以使用

    <script name="summary" type="text/plain">HTML enhanced for web apps</script>
    <script name="content" type="text/markdown">
    PowJS
    =====
    </script>

`script` 节点在 xjson 中的处理:

```javascript
val = node.getAttribute('src') || node.textContent
val.type = node.type
```

template 包含 xjson 属性依旧当作模板处理.

```html
<template xjson>the template in here, non-xjson<template>
```

*使用 xjson 对搜索引擎是友好的.*

缺陷
====

下述难于实现或难于选择解决方案的问题有可能在未来被解决.

0. `repeate` 指令与其它异步 `this.result=something` 交叉时, 结果无法预计.
1. fragment 可能产生连续的 Text Node, 使用 `normalize()` 会产生未知后果.
2. 文本绑定的后代需要传递参数, 复杂逻辑可能会丢失参数, 比如 `repeat`.

PowJS 只使用符合 [ECMAScript][] 及 [HTML5] 标准的 API 编写, 在现代浏览器下测试通过. 适用陈旧浏览器的兼容代码不会出现在此仓库中, 它们由其它仓库提供. PowJS 努力做到易于实施兼容性代码.

LICENSE
=======
Copyright (c) 2014 The PowJS Authors. Use of this source code is governed by a MIT license that can be found in the LICENSE file.

[ECMAScript]: http://www.ecma-international.org/ecma-262/5.1/
[HTML5]: http://www.w3.org/TR/html5/