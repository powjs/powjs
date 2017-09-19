# PowJS

[PowJS][] 仍在开发中, 此文档提及的特性是已经确定的.

PowJS 模板引擎支持:

    采用原生 JavaScript 表达式
    编译一个 DOM Node 模板
    编译一个祖标签的 HTML 源码模板
    导出视图, 数组形式的 JavaScript 源码
    渲染视图到 DOM Node
    属性值表达式 name="{expr}"
    文本节表达式 {{expr}}
    自动剔除空白文本节点
    缺省执行函数形参为 (v,k)
    支持继承形参, 推导形参

```text
模板----->PowJS<----->视图(导出,载入)
           |
           V
          渲染
```

```js
function PowJS(source, mixed /*, ...renderArgs*/) {
    /**
     * 随参数的不同进行编译, 载入, 渲染.
     * source:
     *      string      要编译的 HTML 源码, 单个祖标签
     *      Node        要编译的 DOM 节点
     *      Array       要载入的已编译好的 PowJS 视图
     *      其它        抛出错误或渲染结果为空
     * mixed:
     *      Node        渲染并替换掉该节点
     *      Object      上下文对象, 用于编译或渲染的参数
     *      其它        忽略
     * renderArgs:
     *      渲染数据
     *
     * 返回: PowJS 实例
     */
}
```

## 指令

指令是标签的一个属性, 属性值是 *JavaScript 表达式或语句*.
每个标签的所有指令生成一个被 render 函数调用的 *执行函数*,

    param  ="...args"       声明执行函数的形参
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

    渲染是渲染子节点, 根实例总是把渲染节点作为子节点处理

### 执行函数

构建执行函数的行为

    0. 构建开始, 传入形参为 v, k.
    1. 如果有 param 指令先确定形参, 否则使用继承的形参
    2. 如果有 if 指令生成 if(!(expr)) return;
    3. 构建节点 生成      this.create()
    4. 按指令在属性中的次序生成执行代码
    5. 如果使用了 render|each|html|text 指令后续指令被忽略
    6. 如果未使用 render|each 指令, 生成一个 this.render
    7. 遍历子孙节点重复步骤 1

### 推导形参

编译器不能识别复杂的 render, each 属性推导子节点形参, 可识别:

```js
let PARAMS_TEST = /^[$_a-zA-Z][$_a-zA-Z\d]*(\s*,\s*[$_a-zA-Z][$_a-zA-Z\d]*)*$/
```

另外 each 因为继承关系 v, k 还可能会产生形参重复的冲突, 约定推导行为:

    使用了 render|each, 且属性值通过 PARAMS_TEST 测试
    提取这些参数名作为推导形参, each 指令还是会添加形参 v, k
    无重名冲突, 作为子节点的继承形参, 否则使用上层的继承形参

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

全部指令示意

```html
<tag
    param='a, b'
    if="a"
    let="c=a*b"
    do="console.log(b)"
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

### 模板实例

属性:

    view    编译生成的视图数组, 完整的节点树
    parent  父节点(渲染子节点的容器)
    $       参见 [Context](#Context)

方法:

    render(...)  渲染方法, 渲染子节点一次
    each(...)    渲染方法, 迭代渲染子节点
    node()       指令可用, 返回 this.$.node
    end()        对应指令
    text(expr)   对应指令, 设置或返回 this.node().textContent
    html(expr)   对应指令, 设置或返回 this.node().innerHTML
    attr(...)    辅助方法, 设置或返回 this.node() 属性值
    slice(...)   辅助方法, 调用 Array.prototype.slice
    export()     辅助方法, 导出视图为 JavaScript 源码
    childNodes() 辅助方法, 返回 this.parent.childNodes
    firstChild() 辅助方法, 返回 this.parent.firstChild
    create()     内部方法, 构建当前节点

重要: 节点 `由外向内构建`, `由内向外装配` 到父节点

### Context

this.$ 是渲染时的上下文对象

    prefix   编译选项, string   指令前缀, 缺省为 ''
    discard  编译选项, [string] 被丢弃的属性名列表, 缺省为 []
    flag     渲染标记, 内部维护, -1 表示被 end() 结束
    node     渲染对象, 当前节点对象
    其它     用户自定义上下文值

### 文本节点

文本节点求值语法 {{ expr }}, 并剔除两端空白, 空白节点被忽略.

当整个模板是一个文本节点时, 默认的形参自然生效:

```js
function(v,k){
    this.create();
    this.text(/*文本节点求值表达式*/);
}
```

## License

MIT License <https://github.com/powjs/powjs/blob/master/LICENSE>

[PowJS]: https://github.com/powjs/powjs
