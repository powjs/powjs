(function(global) {
    "use strict"
    var textTags = global.Pow.Config.textContentTags = ['#text', '#comment', 'script']

    global.Pow.extend(global.Pow, toTags,
        toNode,
        textTrimFilter
    )

    function toTags(node, nodeFilter) {
        /**
            遍历 node 后代节点, 提取节点 nodeName, attributes, 返回 node 节点树平面化数组.
            参数:
                node    是 htmlSrc 或者 DOM Node.
                filter  NodeFilter, 缺省值为 Pow.textTrimFilter.
            返回:
                返回 Tag 数组:
                [
                    {
                        attrs: Object,       // 提取自 nodeName, attributes
                        index: Number,       // 该节点下标
                        parentIndex: Number  // 父节点的下标, 顶层为 -1
                    }
                ]
            #text, #comment 等节点没有 attributes, 提取唯一的 textContent 属性.
        */
        // ??? 缺少对 node 为 body 的属性提取支持
        var iter, tag, attrs, attr, prev, tags = []

        node = this.toNode(node)

        iter = document.createNodeIterator(node, NodeFilter.SHOW_ALL, nodeFilter || this.textTrimFilter)
        prev = iter.nextNode() // 上一个, 第一次调用值为 iter.root
        while (node = iter.nextNode()) {
            tag = Object.create(null)
            tag.attrs = Object.create(null)
            tag.index = tags.length // 节点序号

            // 先提取 nodeName 可保障自定义定义 nodeName 指令先执行.
            tag.attrs.nodeName = node.nodeName.toLowerCase()

            // 判断层级关系, 确定父节点序号, 顶层节点的 parentIndex 为 -1
            if (prev === node.parentNode) {
                // 父子关系
                tag.parentIndex = tags.length - 1
            } else {
                // 追述 parentIndex
                tag.parentIndex = tags[tags.length - 1].parentIndex
                while (prev.parentNode !== node.parentNode) {
                    prev = prev.parentNode
                    tag.parentIndex = tags[tag.parentIndex].parentIndex
                }
            }

            // 先提取 attributes

            attrs = node.attributes
            if (attrs) {
                for (var i = 0, l = attrs.length; i < l; i++) {
                    attr = attrs.item(i)
                    tag.attrs[attr.nodeName] = attr.value
                }
            }

            if (textTags.indexOf(tag.attrs.nodeName) !== -1) {
                tag.attrs.textContent = node.textContent
            }

            tags.push(tag)
            prev = node
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

    function textTrimFilter(node) {
        /**
            NodeIterator 过滤器.
            如果 node 不是 TEXT NODE, 返回 NodeFilter.FILTER_ACCEPT;
            否则剔除 textContent 两端的白字符, 返回:
                node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
         */
        if (node.nodeType != document.TEXT_NODE)
            return NodeFilter.FILTER_ACCEPT
        node.textContent = node.textContent.trim()
        return node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }

    function textTabFilter(node) {
        /**
            NodeIterator 过滤器.
            如果 node 不是 TEXT NODE, 返回 NodeFilter.FILTER_ACCEPT;
            否则剔除 textContent 两端的 "\n","\t", 返回:
                node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
         */
        if (node.nodeType != document.TEXT_NODE)
            return NodeFilter.FILTER_ACCEPT
        node.textContent = node.textContent.trim()
        return node.textContent ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
})(this)