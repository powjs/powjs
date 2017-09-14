# PowJS

PowJS 仍在开发中, 此文档提及的特性是已经确定的.

PowJS 模板引擎支持:

    采用原生 JavaScript 表达式
    编译一个 DOM Node 模板
    编译一个祖标签的 HTML 源码模板
    导出视图, 数组形式的 JavaScript 源码
    渲染视图到 DOM Node
    文本节点求值语法 {{ expr }}, 剔除两端空白
    缺省执行函数形参为 (v,k)

```
模板----->PowJS<----->视图(导出,载入)
           |
           V
          渲染
```

```js
function PowJS(source, mixed, ...data) {
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
     * data:
     *      渲染数据
     *
     * 返回: PowJS 实例
     */
}
```

## 指令

指令是标签的一个属性, 属性值是 *JavaScript 表达式或语句*.
每个标签的所有指令生成一个被 render 函数调用的 *执行函数*,

    param  ="...args"   声明执行函数的形参
    if     ="condition" 条件成立节点才会被渲染
    let    ="赋值语句"  设置局部变量
    do     ="code"      直接执行代码
    text   ="expr"      赋值当前节点的 textContent 值并返回
    html   ="expr"      赋值当前节点的 innerHTML 值并返回
    skip   ="condition" 条件成立或为空时返回, 不渲染子节点
    end    ="condition" 条件成立或为空时终止, 不渲染后续节点
    render ="...args"   带参数渲染子节点一次并返回
    each   ="I,...args" 迭代 I 调用 this.render(...args, v, k) 并返回
                        v, k 是 I 的迭代值和键名
                        但是, 子节点执行函数形参由使用者负责

提示: 渲染是渲染子节点, 根实例总是把渲染节点作为子节点处理

### 执行函数

构建执行函数的次序

    0. 构建开始, 传入形参为 v, k.
    1. 如果有 param 指令先确定形参, 否则使用继承的形参
    2. 如果有 if 指令优先生成
    3. 构建节点 this.create()
    4. 按指令在属性中的次序生成执行代码
    5. 如果未使用 render 和 each 指令, 生成一个 this.render
    6. 遍历子孙节点重复步骤 1

编译器不能理解 render, each 对后续形参的影响, 这交由使用者负责.

### 示例

```html
<tag param='a, a+b'/>
```

```js
 function(a, b) {
    this.create();
    return this.render(a, a+b); // 自动生成
 }
```

```html
<tag if(a) param='a,b' render='a+b'/>
```

```js
 function(a, b) {
    if(!a) return;
    this.create();
    return this.render(a+b);
 }
```

```html
 <tag param='a, b , array' let='c=a*2' code='a++' if='b'
      skip='b.valid()' text='"ok"' html='b.html()'
      each='array,b'
 />
```

```js
 function(a, b, array) {
    if(!b) return;
    var c=a*2;
    a++;
    if(b.valid()) return;
    return this.text("ok");    // 本例下面的代码不会被执行
    return this.html(b.html());
    return this.each(array, b);
 }
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


# License

MIT License [https://github.com/powjs/powjs/blob/master/LICENSE]()

[PowJS]: https://github.com/powjs/powjs
