(function(global) {
    "use strict"

    global.Pow.extend(global.Pow, xjson)

    function xjson(root) {
        /**
        	遍历 root, 提取后代节点中的数据, 返回转换后的 JavaScript 对象.
        	参数:
        		root 是 xjson 根节点, 后代才是数据.
        		如果 root 是字符串(仅后代数据), 用 toNode(root) 生成后再提取.
        	返回值:
        		xjson 总是返回数组, 其元素对应 root 子节点转换的数据.
        	JSON 数据类型和 HTML 标签名对应关系
        	    null     var,param
        	    true     var,param
        	    false    var,param
        	    Number   var,param
        	    Object   div
        	    Array    dl, dd
        	    String   除去 var,param,div,dl,dd,head 元素,表单元素以外的标签
        	键名
        	    key="键名"
        	值
        		自动根据标签判定值的存储位置.
        		img 标签支持以 data-src 保存值
        */
        var t, node, attrs, attr, all, ret, key, val, kind, prev

        root = this.toNode(root)

        all = []
        ret = []

        t = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)

        prev = t.root
        while (t.nextNode()) {
            // 先提取 key/val 再判断关系
            node = t.currentNode
            kind = node.getAttribute('kind')
            key = node.getAttribute('name')
            val = undefined
            switch (node.nodeName) {
                case 'VAR':
                    val = node.textContent
                    break
                case 'PARAM':
                    val = node.getAttribute('value')
                    break
                case 'DIV':
                    val = node.getAttribute('array') == undefined ? {} : []
                    break
                case 'A': // string
                    val = node.getAttribute('href')
                    break
                case 'IMG':
                    val = node.dataset.src || node.getAttribute('src')
                    break
                case 'SCRIPT':
                    val = node.getAttribute('src') || node.textContent
                    val.type = node.type
                    break
                default:
                    val = node.innerHTML
            }

            if (node.nodeName === 'VAR' || node.nodeName === 'PARAM') {
                if (val === 'true')
                    val = trueelse if (val === 'false')
                    val = falseelse if (val === 'null')
                    val = null
                else
                    val = Number(val)
            } else if (kind) {
                val.kind = kind
            }

            // 判断层级关系, kind 变量复用保存父节点序号
            if (prev === node.parentNode) {
                // 父子关系
                kind = all.length - 1
            } else {
                // 追述父节点序号
                kind = all[all.length - 1][0]
                while (prev.parentNode !== node.parentNode) {
                    prev = prev.parentNode
                    kind = all[kind][0]
                }
            }

            prev = node

            // 每一个 val 都保存
            all.push([kind, val])
            if (kind === -1) {
                ret.push(val)
                continue
            }
            // 维护从属关系, 提取父对象
            node = all[kind][1]
            if (key) {
                if (this.oString(node) === 'Object') {
                    node[key] = val
                    continue
                }
            } else if (this.oString(node) === 'Array') {
                node.push(val)
                continue
            }

            throw 'xjson: unknow error'
        }
        return ret
    }

})(this)