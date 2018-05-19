# Change Log

该项目遵循 [Semantic Versioning](http://semver.org/).

## 2.2.2

- 优化 指令顺序冲突检测

## 2.2.1

- 优化 顶层节点类型为 template.content, 渲染时图片等资源不会被加载
- 优化 保持 `^`style, `^`script, `!`Comment 的原始内容, 不做插值处理
- 优化 模板处理 DocumentFragment,HTMLTemplateElement,NodeList,Node,[Node],String

## 2.2.0

- 修复 `exports` 导出 BUG
- 优化 `toString` 输出
- 变更 `if` 指令取消尾部 `||` 规则, 优化为尾部 `;` 判断
- 增加 `each` 附加参数以及形参推导

## 2.1.1

- 修复 `each` 形参推导 BUG

## 2.1.0

- 修复 `if` 指令未能正确处理 `#text string` 的 BUG
- 变更 `isRoot` 的判断算法, 为实时渲染提供基础
- 增加 `func` 指令命名视图, 支持视图调用
- 增加 形参推导, 参见 `each-render` 小节
- 增加 `isReal` 返回当前节点是否连接到真实的页面 DOM 中

## 2.0.0

- 变更 环境 ECMAScript 6
- 变更 指令 `if` 融合渲染条件和可变标签
- 变更 插值使用模板字符串 `${x}`
- 变更 toScript() 格式, 支持多节点模板
- 变更 模块入口参数 `option` 格式
- 移除 required(), outerHTML(), node(), view
- 增加 多节点模板支持: Node,[Node],NodeList
- 增加 属性 node, 当前渲染的节点
- 增加 辅助方法 prop(propertyName[,v])
- 增加 辅助方法 exports(target),lastChild(),isRoot(),query(selector)
- 增加 节点操作 appendTo(node),renew(node),insertBefore(node),insertAfter(node)

## 1.1.0

- 增加 .outerHTML 和插件支持

## 1.0.0

- 第一个可用版本