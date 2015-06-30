# PowJS

*PowJS 仍在开发中, 所有特性尚未固定, 期待您的反馈建议 [issues][]*

PowJS 像写程序一样写 HTML, 是比框架更低级的 HTML 增强工具.
HTML 模板先由浏览器生成 DOM tree, 然后分析 DOM tree 编译成 JavaScript 执行.

## 源代码

PowJS API 源代码:

```html
<template>
<h1 forgo-nextSiblings-if="!Pow.HASDOC">
    <fragment if="!Pow.HASDOC" forgo-nextSiblings>
        糟糕! min 版无法提取 API 文档.
    </fragment>
    PowJS API
</h1>
<ul var-api="Pow.docez()" repeat-api>
    <li class="api-{{key}}">{{key}}</li>
</ul>
</template>
```

通常认为上面的源代码由三种元素组成:

1. 指令       存在于标签名和属性中. 有对应的指令名称.
2. 求值表达式 存在于非指令的属性值和文本节点中, 被一对儿 "{{","}}" 包裹.
3. 定值       非指令和求值表达式的其它 HTML 节点描述.

事实上, 在 PowJS 中求值表达式是一条内置的赋值指令, 计算表达式的值并赋值到节点属性. 
所有的指令都被函数化, 因此 PowJS 中其实只有两种元素:

1. 函数      具名指令和赋值指令
2. 定值      描述节点固定属性

上例中出现六条指令:

 - forgo    标记丢弃指定范围的节点, "nextSiblings" 表示后续兄弟节点.
 - fragment 表示当前节点是个 DocumentFragment, 是无标签透明的, 子节点会被上提
 - if       当表达式成立时, 执行同节点后续指令, 否则忽略同节点后续指令.
 - var      定义向后传递的参数
 - repeat   遍历对象, 重复执行当前位置之后的节点
 - {{key}}  赋值指令, 两次出现分别赋值给节点的 "class" 属性和 "textContent".

提示: if 指令不丢弃节点, 只是忽略后续指令. forgo 丢弃节点, 但不一定忽略后续指令.

## 指令

### 具名指令

格式为:

    name[-suffix][="body"]

以 "-" 作为分界符, 以最长匹配指令名. 如果匹配成功, 指令被分成三部分.

- name    指令名, 对应指令编译函数
- suffix  指令后缀, 作为参数传递给指令编译
- body    指令体, 作为参数传递给指令编译

很明显标签名也符合此格式, 只是仅有 name 部分, 例如 fragment. 

指令编译函数根据 suffix, body 生成指令执行函数. 根据 HTML 标准属性名不区分大小写, 
所以 PowJS 总是把 name, suffix 转换为纯小写. PowJS 是这样调用指令编译函数的

```js
Pow.Directives[name](suffix, paramsNames, body)
```

所有指令编译函数位于 Pow.Directives 下, 他们生成指令执行函数.
指令执行有上下文, 有参数传递, paramsNames 就是上文传递的参数名(不是参数),
真正的参数传递在指令执行函数中进行.

suffix 由具体的指令编译函数解析, 良好的 suffix 设计会让代码可读性更好更优雅.

指令间的关系和源代码表现得结构完全一致, 父子节点对应嵌套代码, 兄弟节点对应顺序代码,
而同一个节点下的属性中的指令也是嵌套关系.

提示: name, suffix 中可以包含 "-", 所以 Pow.Directives 下的指令只有一层深度.

### 赋值指令

格式:

    [literals]{{[#obj.prop] express}}[literals]

其中

- literals   为字面值.
- #obj.prop  用于文本绑定, 当 obj.prop 被赋值时, 赋值指令被再次执行.
- express    是个标准的 JavaScript 求值表达式.

最终计算的值是个字符串.
如果赋值指令位于标签属性值中, 最终值被赋值给相应的属性.
如果位于文本节点中, 最终值被赋值给所属节点的 "textContent".

赋值指令可以包含多段

    Hi {{user.gender=='female'?'Girl':'Boy'}}, you have {{message.length}} message.

## ready

通常使用显示代码绑定 `document.onreadystatechange` 在页面加载完成时触发 ready 函数.
PowJS 使用另外一种方式 `meta onreadyState`, 在页面加入一行:

```html
<meta name="onreadystate" content="complete" powjs>
```

如果页面加载了 powjs 那么, 那么 PowJS 从页面自动提取模板和数据, 并执行.
如果没有加载 powjs, 那么这不会产生任何副作用.

## xjson

xjson 以 HTML 标签包装 JSON. 使 JSON 数据以 HTML 展现.

数据类型和标签名对应关系

    null     var
    true     var
    false    var
    Number   var
    Object   div
    Array    div[array]
    String   表单元素, var, param, div, head 等特殊标签以外的标签

null, true, false, Number 的值可智能识别.
String 类型的值根据标签不同从 src, href, textContent, innerHTML 提取.

在属性中有两种形式指定键名

    keyname
    name="keyName"

如果键名是纯小写的, 可用第一种形式简化写法用属性名表示, 否则用第二种完整写法.

用 xjson 表现 https://api.github.com/orgs/powjs/repos 部分代码

```html
<div xjson array>
    <div>
        <var id>24525592</var>
        <h1 name>powjs</h1>
        <p full_name>powjs/powjs</p>
        <div owner>
            <p login>powjs</p>
            <var id>24525592</var>
            <img avatar_url src="https://avatars.githubusercontent.com/u/8936527?v=3">
            <a url>https://api.github.com/users/powjs</a>
        </div>
    </div>
</div>
```

如果要嵌入源码字符串, 可用标签也很多, 甚至可以使用 `script`

```html
    <script summary type="text/plain">HTML enhanced for web apps</script>
    <script summary type="text/html">
        <b>HTML enhanced for web apps</b>
    </script>
    <script content type="text/markdown">
    PowJS
    =====
    </script>
```

只是声明 `type` 属性让浏览器不把它当做脚本执行就可以了.

如果内容中包含 `script` 标签, 您也可以使用 `template` 标签.

```html
<template htmlcode>
<b>HTML</b> in here, non-xjson
<script>
    var app=Pow.New()
</script>
<template>
```

*使用 xjson 对搜索引擎是友好的.*

## New

PowJS 中没有 App 的概念, Pow.New 方法提供了更好的解决方案.

    Pow.New() 生成一个新的 Pow 对象 

调用 Pow 方法的时候, 会产生一些对象, 可以把这些对象保存在当前的 Pow 对象下.
Pow.New() 产生的新 Pow 对象和原对象就隔离了.

## 兼容性

PowJS 使用符合 [ECMAScript][] 标准及 [HTML5][] 标准 API 编写, 在现代浏览器下测试通过.
兼容陈旧浏览器请搜索 [polyfill][], 有很多项目专门解决此类问题, PowJS 不重复此方面工作.

# LICENSE

Copyright (c) 2014 The PowJS Authors.
Use of this source code is governed by a MIT license that can be found in the LICENSE file.

[ECMAScript]: http://www.ecma-international.org/ecma-262/5.1/
[HTML5]: http://www.w3.org/TR/html5/
[polyfill]: https://github.com/search?l=JavaScript&o=desc&q=polyfill&s=stars&type=Repositories&utf8=✓
[issues]: https://github.com/powjs/powjs/issues