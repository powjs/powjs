(function(global) {
    "use strict"
    global.Pow.PowJS = PowJS
    PowJS.prototype = global.Pow.prototype

    global.Pow.extend(
        PowJS.prototype, {
            all: querySelectorAll // alias
        },
        add,
        attr,
        first,
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
            这是 Pow 的执行体, 返回匹配的元素数组, 称作 Pow 对象, 提供集合操作.
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
            返回:
                Pow 对象
            Pow 外观与 Zepto/jQuery 很像, 事实上不兼容.
            Pow 是一个 Array, 保留原生方法并采用原生 API 风格.
            典型差异:
                Array.prototype.forEach ( callback [ , thisArg ] )
                thisArg 缺省时, callback 中 this 为 window.
            callback 风格为:
                function forEachCallback(item,index[,list])
            Zepto/jQuery 回调函数风格为:
                function eachCallback(index[,item])
                callback 中 this 为 item
            注意:
                Pow.slice()
                返回值是 Array 对象, 而不是 Pow.
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

    function first(selectors) {
        /**
            返回一个 Pow 对象, 最多只有一个元素, 是首个匹配的元素.
                ()       Pow(this[0])
                (String) this.querySelector(selectors)
         */
        if (selectors)
            return this.querySelector(selectors)
        return PowJS(this[0])
    }

    function last() {
        return PowJS(this[this.length - 1])
    }

    function querySelectorAll(selectors) {
        /**
            别名 all. 返回当前集合后代与选择器匹配的元素集合.
            selectors 必须为 CSS 选择器字符串.
         */
        var po = PowJS()
        this.forEach(function(el) {
            if (!el || !el.querySelectorAll) return
            po.add(el.querySelectorAll(selectors))
        })
        return po
    }

    function querySelector(selectors) {
        /**
            返回一个 Pow 对象, 最多只有一个元素, 是当前集合首个匹配选择器的后代元素.
            selectors 必须为 CSS 选择器字符串.
         */
        var po = PowJS()
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
                (DOM node)
                    添加 DOM node 元素到集合.
                (Arraylike)
                    添加所有 Arraylike 元素到集合.
                (Object)
                    添加一个元素到集合.
                (HTML)
                    添加 HTML 源码生成的子节点(childNodes)到集合.
            返回:
                this Pow 对象
         */

        if (selectors == undefined) return this

        // Node 直接保存
        if (selectors instanceof Node) {
            this.push(selectors)
            return this
        }

        if ('string' === typeof selectors) {
            if (selectors[0] !== '<') {
                if (context) {
                    selectors = PowJS(context).querySelectorAll(selectors)
                } else {
                    selectors = this.Pow.document.querySelectorAll(selectors)
                }
            } else {
                selectors = this.Pow.fragment(selectors).childNodes
            }

            for (var i = 0; i < selectors.length; i++) {
                context = selectors[i]
                if (context != undefined && this.indexOf(context) === -1) {
                    this.push(context)
                }
            }
        } else {
            this.Pow.toArray(selectors).forEach(function(el) {
                if (el != undefined && this.indexOf(el) === -1) {
                    this.push(el)
                }
            }, this)
        }
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

    function attr(name, value) {
        /**
            对元素属性进行 get/set/remove 操作, 不同参数组合有不同的行为:
            返回第一元素属性值:
                ()               返回全部属性副本
                (String)         返回一个属性值
                ([String])       返回多个属性副本组成的对象.
            设置所有元素属性值并返回 this:
                (Object)         以 Object 的 key/value 设置多个属性值.
                (String, value)  设置一个属性值为 value
            删除所有元素属性并返回 this:
                (String, null)   删除一个属性
                ([String], null) 删除多个属性
        */
        var isNode, keys, pow = this.Pow
        if (value === null) {
            return this.removeAttr(name)
        }
        // set
        if (arguments.length === 2 && pow.isString(name)) {
            name = pow.object(name, value)
        }

        // PlainObject set
        if (pow.isObject(name)) {
            keys = Object.keys(name)
            this.forEach(function(el) {
                if (!pow.isNode(el)) keys.forEach(function(k) {
                    el[k] = name[k]
                })
                else if (el.setAttribute) keys.forEach(function(k) {
                    // form 元素, #text, #comment 需要特殊处理???
                    el.setAttribute(k, String(name[k]))
                })
            })
            return this
        }

        // get
        if (!this.length) return

        if (pow.isString(name)) {
            return !pow.isNode(this[0]) ? this[0][name] :
                this[0].getAttribute && this[0].getAttribute(name)
        }

        pow.ift(!pow.isArray(name), 0, name)

        value = Object.create(null)

        name.forEach(function(name) {
            value[name] = !pow.isNode(this) ? this[name] :
                this.getAttribute && this.getAttribute(name)
        }, this[0])

        return value
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