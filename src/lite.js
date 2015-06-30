(function(global) {
    "use strict"
    global.Pow.PowJS = PowJS
    PowJS.prototype = global.Pow.prototype

    // 源代码中内部方法在前, PowJS 对象方法在后, 保持 PowJS 对象方法名排序

    global.Pow.extend(
        PowJS.prototype, {
            all: querySelectorAll // alias
        },
        add,
        attr,
        eq,
        get,
        first,
        html,
        last,
        querySelector,
        querySelectorAll,
        removeAttr
    )

    global.Pow.extend(
        global.Pow, {
            first: function(selectors) {
                /**
                    便捷函数返回:
                        Pow(document.querySelector(selectors))
                 */
                return this(this.document.querySelector(selectors))
            },
            all: function(selectors) {
                /**
                    便捷函数返回:
                        Pow(document.querySelectorAll(selectors))
                 */
                return this(this.document.querySelectorAll(selectors))
            }
        }
    )

    function PowJS(selectors, context) {
        /**
            这是 Pow 的执行体, 返回称作 PowJS 对象的数组, 提供集合操作.
            参数:
                ()
                    返回空集合.
                (selectors [, context ])
                    返回 context.querySelectorAll(selectors) 的元素集合.
                    selectors 为原生 CSS 选择器表达式字符串.
                    context 指定选择器查找元素所在的上下文, 缺省为 document.
                (DOM node)
                    返回只有一个 DOM node 元素的集合.
                (Arraylike)
                    返回拥有所有 Arraylike 元素的集合.
                (Object)
                    返回只有一个元素的集合.
                (HTML)
                    返回 HTML 源码生成的子节点(childNodes)集合.

            PowJS 对象使用 Chaining 调用风格, 这与 Zepto/jQuery 风格很像.
            PowJS 对象方法是为满足其自身的需求设计的, 具体方法不完全兼容 Zepto/jQuery.
            典型差异:
                PowJS 对象是一个 Array, 保留 Array 原生方法.
                Array.prototype.forEach ( callback [ , thisArg ] )
                thisArg 缺省时, callback 中 this 为全局变量, 通常是 window.
                PowJS callback 采用原生 forEach 风格:
                    function forEachCallback(item, index [,list])
                Zepto/jQuery callback 采用 each 风格:
                    function eachCallback(index [,item])
            个别差异:
                .html()  返回所有 Node 元素 outerHTML/textContent 的字符串拼接
                .slice() 返回 Array 对象, 而不是 PowJS 对象.
         */
        var inst
        if (selectors instanceof PowJS)
            return selectors

        if (this instanceof PowJS) {
            return
        }

        inst = new PowJS()
        inst.Pow = this // this is Pow

        return inst.add(selectors, context)
    }

    // ----- 内部方法
    function getAttrs(el, keys) {
        var attrs = Object.create(null)
        keys && keys.forEach(function(name) {
            var v = el.getAttribute(name)
            if (v !== undefined)
                attrs[name] = v
        })
        if (keys) {
            return attrs
        }

        for (var i = 0; i < el.attributes.length; i++) {
            var attr = el.attributes.item(i)
            attrs[attr.name] = attr.value
        }

        return attrs
    }

    // ----- PowJS 对象方法

    function add(selectors, context) {
        /**
            添加元素到集合.
            参数:
                ()
                    返回 this Pow 对象.
                (selectors [, context ])
                    添加 context.querySelectorAll(selectors) 的元素到集合.
                    selectors 为原生 CSS 选择器表达式字符串.
                    context 指定选择器查找元素所在的上下文, 缺省为 document.
                (Node)
                    添加 DOM node 元素到集合.
                (Array)
                    添加所有 Array 元素到集合.
                (Object)
                    添加一个 Object 到集合.
                (HTML)
                    添加 HTML 源码生成的子节点(childNodes)到集合.
            返回:
                this Pow 对象
         */
        var pow = this.Pow
        if (selectors == undefined) return this

        // Node 直接保存
        if (pow.isNode(selectors)) {
            this.indexOf(selectors) === -1 && this.push(selectors)

        } else if ('string' === typeof selectors) {

            if (selectors.indexOf('<') != -1 && selectors.indexOf('<') < selectors.indexOf('>')) {
                selectors = pow.fragment(selectors).childNodes
            } else {
                if (context) {
                    selectors = pow(context).querySelectorAll(selectors)
                } else {
                    selectors = pow.document.querySelectorAll(selectors)
                }
            }

            for (var i = 0; i < selectors.length; i++) {
                context = selectors[i]
                if (context != undefined && this.indexOf(context) === -1) {
                    this.push(context)
                }
            }

        } else if (pow.isNodeList(selectors)) {

            for (var i = 0; i < selectors.length; i++) {
                this.indexOf(selectors[i]) === -1 && this.push(selectors[i])
            }

        } else if (pow.isArray(selectors)) {

            selectors.forEach(function(el) {
                if (el != null && this.indexOf(el) === -1) {
                    this.indexOf(el) == -1 && this.push(el)
                }
            }, this)

        } else {
            this.indexOf(selectors) === -1 && this.push(selectors)
        }
        return this
    }

    function attr(name, value) {
        /**
            对元素属性进行 get/set/remove 操作, 不同参数组合有不同的行为:
            返回第一元素属性值:
                ()               返回全部属性组成的对象
                (String)         返回一个属性值
                ([String])       返回多个属性组成的对象.
            设置所有元素属性值并返回 this:
                (Object)         以 Object 的 key/value 设置多个属性值.
                (String, value)  设置一个属性值为 value
            删除所有元素属性并返回 this:
                (String, null)   删除一个属性
                ([String], null) 删除多个属性
        */
        var pow = this.Pow,
            node

        switch (arguments.length) {
            case 0:
                node = this[0]
                return pow.isElement(node) && getAttrs(node) || Object.create(null)
            case 1:
                if (typeof name == 'string') {
                    node = this[0]
                    x = pow.parameters(name)
                    if (x.length == 1) {
                        return pow.isElement(node) && getAttrs(node, x)[name]
                    }
                    return pow.isElement(node) && getAttrs(node) || Object.create(null)

                } else if (pow.isArray(name)) {

                    return pow.isElement(node) && getAttrs(node) || Object.create(null)
                }
                value = name
                break
            default:
                if (value === null) {
                    return this.removeAttr(name)
                }

                if (typeof name != 'string') {
                    return this
                }
                value = pow.object(name, [value])
                break
        }

        // Object
        name = Object.keys(value)
        this.forEach(function(node) {
            pow.isElement(node) && name.forEach(function(k) {
                k != 'nodeName' && node.setAttribute(k, value[k])
            })
        })
        return this
    }

    function any(callback, thisArg) {
        /**
            调用 callback 遍历元素.
            当 callback 有返回值, 终止遍历并返回该值. 
         */
        var ret
        for (var i = 0, l = this.length; i < l; i++) {
            ret = callback.call(thisArg, this[i], i, this)
            if (ret !== undefined) return ret
        }
    }

    function eq(index) {
        /**
            返回 PowJS(this[index])
         */
        return this.Pow(this[index])
    }

    function get(index) {
        /**
            返回序号为 index 的元素
         */
        return this[index]
    }

    function first(selectors) {
        /**
            返回一个 Pow 对象, 最多只有一个元素, 是首个匹配的元素.
                ()       Pow(this[0])
                (String) this.querySelector(selectors)
         */
        if (selectors)
            return this.querySelector(selectors)
        return this.Pow(this[0])
    }

    function html(inner) {
        /**
            当参数 inner == null 时返回 Node 元素的 outerHTML/textContent 拼接字符串.
            否则设置所有 Node 元素 innerHTML/textContent 为 inner.
         */

        var pow = this.Pow,
            out = inner == null,
            outer = out ? '' : null,
            voids = this.Pow.Config.voidElements,
            x

        this.forEach(function(el) {
            if (!pow.isNode(el)) return

            switch (el.nodeType) {
                case 3: // TEXT_NODE
                    if (out) {
                        outer += el.textContent
                    } else {
                        el.textContent = inner
                    }
                    return
                case 11: // DOCUMENT_FRAGMENT_NODE
                    if (out)
                        outer += pow(el.childNodes).html()
                    return
                case 1: // ELEEMENT_NODE
                    x = el.nodeName.toLowerCase()
                    if (!out) {
                        if (voids.indexOf(x) == -1)
                            el.innerHTML = inner
                        return
                    }

                    outer += '<' + x

                    for (var i = 0; i < el.attributes.length; i++) {
                        var attr = el.attributes.item(i)
                        outer += ' ' + attr.name + (attr.value ? '=' + JSON.stringify(attr.value) : '')
                    }
                    outer += el.innerHTML ? '>' + el.innerHTML + '</' + x + '>' :
                        (voids.indexOf(x) != -1 ? '>' : ' />')
                    return
            }
        })
        return out ? outer : this
    }

    function last() {
        return this.Pow(this[this.length - 1])
    }

    function querySelector(selectors) {
        /**
            返回一个 Pow 对象, 最多只有一个元素, 是当前集合首个匹配选择器的后代元素.
            selectors 必须为 CSS 选择器字符串.
         */
        var po = this.Pow()
        this.some(function(el) {
            if (!el || !el.querySelector) return
            el = el.querySelector(selectors)
            if (el) {
                po.push(el)
                return true
            }
        })
        return po
    }

    function querySelectorAll(selectors) {
        /**
            别名 all. 返回当前集合后代与选择器匹配的元素集合.
            selectors 必须为 CSS 选择器字符串.
         */
        var po = this.Pow()
        this.forEach(function(el) {
            if (!el || !el.querySelectorAll) return
            po.add(el.querySelectorAll(selectors))
        })
        return po
    }

    function removeAttr(name) {
        /**
            移除每个元素的指定属性
                (name)    移除 name 属性
                ([name])  移除所有 [name] 属性
            返回 this
        */
        var pow = this.Pow
        name = pow.toArray(name)
        for (var i = 0; i < this.length; i++) {
            if (this[i] instanceof Node)
                name.forEach(function(name) {
                    if (this.removeAttribute)
                        this.removeAttribute(name)
                }, this[i])
            else
                name.forEach(function(name) {
                    if (pow.has(this, name))
                        delete this[name]
                }, this[i])
        }
        return this
    }

})(this)