(function(global) {
    "use strict"
    var textTags = global.Pow.Config.textTags = ['#text', '#comment', 'SCRIPT']

    global.Pow.extend(global.Pow, toTags,
        toNode,
        nodeFilter
    )

    function toTags(root, filter) {
        /**
            遍历 root 后代节点, 提取的 nodeName 和 attributes 属性返回一个对象数组.
            参数:
                root    是 htmlSrc 或者 DOM Node.
                filter  节点过滤(预处理)函数 function (node), 返回处理后的节点, 假值跳过节点.
                            缺省为 nodeFilter.
            返回值:
                如果 root.childNodes 不是 NodeList 抛出异常.
                如果 root 是 <template xjson> 返回 Pow.ISXJSON
                其他返回 Tag 数组(称做 Tags):
                [
                    {
                        $:Object,         // 编译生成的附加属性对象
                        nodeName: String, // nodeName
                        // ... 其他属性 key/value, 提取自 attributes
                    }
                ]
            #text, #comment 节点没有 attributes, 提取唯一的 textContent 属性.
            附加属性($ 属性之下)
                index: Number // 该节点下标
                parentIndex: Number // 父节点的下标, 顶层为 -1
        */
        // ??? 缺少对 root 为 body 的属性提取支持
        var t, tag, attrs, attr, tags, prev

        root = this.toNode(root)

        if (root.nodeName === 'TEMPLATE') {
            if (root.getAttribute('xjson') != undefined) {
                return this.ISXJSON
            }
        }

        this.ift(!(root.childNodes instanceof NodeList), null, root)
        filter = filter || this.nodeFilter
        tags = []

        t = document.createTreeWalker(root)
        prev = t.root
        while (t.nextNode()) {
            // 变量复用
            root = filter(t.currentNode)
            if (!root) continue
            tag = Object.create(null)
            tag.$ = Object.create(null)
            tag.$.index = tags.length // 节点序号

            // 判断层级关系, 确定父节点序号, 顶层节点的 parentIndex 为 -1
            if (prev === root.parentNode) {
                // 父子关系
                tag.$.parentIndex = tags.length - 1
            } else {
                // 追述 parentIndex
                tag.$.parentIndex = tags[tags.length - 1].$.parentIndex
                while (prev.parentNode !== root.parentNode) {
                    prev = prev.parentNode
                    tag.$.parentIndex = tags[tag.$.parentIndex].$.parentIndex
                }
            }

            // 先提取 attributes

            attrs = root.attributes
            if (attrs && textTags.indexOf(tag.nodeName) === -1) {
                for (var i = 0, l = attrs.length; i < l; i++) {
                    attr = attrs.item(i)
                    tag[attr.nodeName] = attr.value
                }
            } else {
                tag.textContent = root.textContent
            }

            // nodeName 最后提取, 可保障用户定义 nodeName 指令.
            tag.nodeName = root.nodeName
            tags.push(tag)
            prev = root
        }
        return tags
    }


    function toNode(htmlSrc) {
        /**
            以 HTML 源码创建并返回 html 或者 body 节点. 
            如果 htmlSrc 包含 html 节点, 返回的节点是 html 节点.
            否则返回 body 节点.
         */
        var html, doc

        if (htmlSrc instanceof Node) {
            return htmlSrc
        }

        doc = this.document.implementation.createHTMLDocument('')

        if (htmlSrc.match(/<!DOCTYPE.*>/i)) {
            htmlSrc = htmlSrc.slice(htmlSrc.indexOf('>') + 1)
        }

        html = htmlSrc.match(/<html.*>/i)
        if (html) {
            htmlSrc = htmlSrc.slice(html.index + html[0].length,
                htmlSrc.match(/<\/html>/i).index)
        }

        if (!html) {
            // ???缺乏提取 body 属性
            doc.body.innerHTML = htmlSrc
            return doc.body
        }
        // ???缺乏提取 html 属性
        doc.documentElement.innerHTML = htmlSrc
        return doc.documentElement
    }

    function nodeFilter(node) {
        /**
            默认的节点过滤器, 过滤 Text Node 两端的白字符.
         */
        var text
        if (node.nodeType == document.TEXT_NODE) {
            text = node.textContent.trim()
            if (!text) return
            node.textContent = text
        }
        return node
    }
})(this)