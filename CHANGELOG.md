# Change Log

该项目遵循 [Semantic Versioning](http://semver.org/).

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