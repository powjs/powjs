/*! PowJS v@version | MIT License | https://github.com/powjs/powjs */

(function(global) {
    "use strict"
    var _array = [],
        oString,
        VERSION = '@version'

    global.Pow = Pow()

    // 修正 
    if (typeof toString == 'function' && toString.call() === '[object Undefined]') {
        oString = function(x, raw) {
            return raw && toString.call(x) || toString.call(x).slice(8, -1)
        }
    } else {
        oString = (function() {
            var objString = Object.prototype.toString
            return function(x, raw) {
                x = objString.call(x)
                if (x === '[object global]')
                    return raw && '[object global]' || 'Window'
                return !raw && x || x.slice(8, -1)
            }
        })()
    }

    global.Pow.oString = function(x, raw) {
        /**
            oString 返回 x 的类型描述字符串. 参数 raw 表示是否原样返回类型描述字符串.
            示例:
                Pow.oString(1) == "Number"
                Pow.oString(1, true) == "[object Number]"
                Pow.oString(window) == "Window"
            特别的因 ECMAScript 未明确 window.toString 的行为, 造成浏览器间有差异.
            当 x 类型为 "[object global]" 时用 "[object Window]" 替代.
         */
        return oString(x, raw)
    }


    'Object,Number,Null,Undefined,Boolean,String,XMLHttpRequest'.split(',').forEach(function(v) {
        global.Pow['is' + v] = Function('object', 'return this.oString(object) ==="' + v + '"')
    })

    'Array,Comment,Element,Error,Date,Function,Node,NodeList,RegExp,Text,Window'.split(',').forEach(function(v) {
        global.Pow['is' + v] = Function('x', 'return x instanceof ' + v)
    })

    global.Pow.HASDOC = !!global.Pow.oString.toString().indexOf('**') + 1

    extend(
        global.Pow, {
            document: global.document,
            Config: {
                nonArraylike: parameters('Window, String, Function, Text, Comment'),
                // http://www.w3.org/TR/html-markup/syntax.html#void-element
                voidElements: parameters('area, base, br, col, command, embed, hr, img, input, keygen, link, meta, param, source, track, wbr')
            },
            Directives: Object.create(null),

            assert: function(any, x, message) {
                /**
                    断言.
                    if (!any || any instanceof Error) throw message.
                    如果有参数 x, 使用 JSON.stringify(x)
                 */

                if (any instanceof Error)
                    throw any
                if (any) return
                if (message && message.slice(-1) != ':') {
                    message += ': unexpected'
                }
                throw (message || 'unexpected') + ' ' + x ? JSON.stringify(x) : 'arguments'
            },
            echo: function(x) {
                return x
            },
            likeArray: function(x) {
                /**
                    返回 x 是否为类数组
                 */
                if (x instanceof Array) return true
                if (!x || !this.isNumber(x.length) || this.isElement(x)) {
                    return false
                }
                return this.Config.nonArraylike.indexOf(this.oString(x)) === -1
            },
            noop: function() {},
            null: function() {
                return null
            },
            object: function(keys, values) {
                /**
                    生成一个 Object 对象.
                 */
                var obj = Object.create(null),
                    isArray

                if (values === undefined)
                    values = null
                isArray = this.isArray(values)

                this.toArray(keys, true).some(function(name, i) {
                    if (!isArray) {
                        obj[String(name)] = values
                        return
                    }
                    if (values.length === i) return true
                    obj[String(name)] = values[i]
                })

                return obj
            },
            slice: function(arraylike, begin, end) {
                /**
                    便捷函数, 返回 arraylike.slice(begin, end)
                 */
                return _array.slice.call(arraylike, begin, end)
            },
            tick: (function() {
                var c = 1;
                return function() {
                    /**
                        递增计数器
                     */
                    return c++
                }
            })()
        },
        any,
        deepCreate,
        deepProperty,
        defaults,
        directive,
        extend,
        New,
        omit,
        parameters,
        pick,
        toArray
    )


    function Pow() {
        var callee = function PowJS(selector, context) {
            return callee.PowJS(selector, context)
        }

        callee.version = VERSION
        callee.prototype = new Array()
        callee.prototype.version = VERSION
        return callee
    }

    function New() {
        /**
            New 生成一个新的 Pow 对象.
         */
        var dst = Pow()
        Clone(this, dst)
        return dst
    }

    function Clone(src, dst) {
        var key, val, fn
        for (key in src) {
            val = src[key]
            switch (oString(val)) {
                case 'Function':
                    dst[key] = val
                    if (key[0].toUpperCase() !== key[0]) {
                        break
                    }
                    // prototype 备份恢复
                    fn = Object.create(val.prototype)
                    if (val.prototype instanceof Array) {
                        dst[key].prototype = new Array
                        Clone(fn, dst[key].prototype)
                        val.prototype = new Array
                        Clone(fn, val.prototype)
                    } else {
                        dst[key].prototype = Object.create(null)
                        Clone(fn, dst[key].prototype)
                        val.prototype = Object.create(null)
                        Clone(fn, val.prototype)
                    }
                    break
                case 'Array':
                    dst[key] = val.slice(0)
                    break
                case 'Object':
                    dst[key] = new Object
                    Clone(val, dst[key])
                    break
                default:
                    dst[key] = val
            }
        }
    }

    function any(object, callback, thisArg, eachStyle) {
        /**
            遍历 object 元素或属性, 调用 callback, 如果 callback 有返回值, 终止遍历并返回该值.
            算法:
                if (thisArg == null) {
                    thisArg = global
                }
                // something
                if (!eachStyle)
                    callback.call(thisArg , value, key, object)
                else
                    callback.call(thisArg , key, value, object)
         */
        var ret, v

        if (thisArg == null) {
            thisArg = global
        }

        if (this.likeArray(object)) {
            object = this.slice(object)
        }

        if (this.isArray(object)) {
            for (var i = 0, l = object.length; i < l; i++) {
                v = object[i]

                if (!eachStyle) {
                    ret = callback.call(thisArg, object[i], i, object)
                } else {
                    ret = callback.call(thisArg, i, object[i], object)
                }

                if (ret !== undefined) break
            }
            return ret
        }

        if (this.oString(object) === 'NamedNodeMap') {
            for (var i = 0, l = object.length; i < l; i++) {
                v = object.item(i)

                if (!eachStyle) {
                    ret = callback.call(thisArg, v.nodeName, v.nodeValue, object)
                } else {
                    ret = callback.call(thisArg, v.nodeValue, v.nodeName, object)
                }

                if (ret !== undefined) break
            }
            return ret
        }

        for (var k in object) {
            if (!eachStyle) {
                ret = callback.call(thisArg, object[k], k, object)
            } else {
                ret = callback.call(thisArg, k, object[k], object)
            }
            if (ret !== undefined) break
        }
        return ret
    }

    function toArray(x, mustBeArraylike) {
        /**
            转换 x 为数组, 参数和行为对应关系:
                (Array)        return x
                (String)       return Pow.parameters(x)
                (Arraylike)    return Pow.slice(x)
                (other)        return [x]
                (other,true)   抛出异常
            返回:
                Array | 抛出异常(mustBeArraylike).
         */
        if (x instanceof Array) return x
        if (typeof x == 'string') return this.parameters(x)
        if (this.likeArray(x)) {
            return this.slice(x)
        }

        this.assert(!mustBeArraylike, x)

        return [x]
    }

    function defaults(target) {
        /**
            无覆盖扩展 target 属性, 保留原有属性, 扩展新属性.
            如果 target == undefined, 创建一个裸对象.
         */
        var source;
        if (target == undefined)
            target = Object.create(null);
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            if (!source) continue;

            if ('function' === typeof source) {
                if (target[source.name] === undefined)
                    target[source.name] = source
            } else {
                for (var key in source) {
                    if (target[key] === undefined)
                        target[key] = source[key]
                }
            }
        }
        return target;
    }

    function extend(target) {
        /**
            覆盖扩展 target 属性.
            如果 target == undefined, 创建一个裸对象.
         */
        var source;
        if (target == undefined)
            target = Object.create(null);
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            if (!source) continue;

            if ('function' === typeof source) {
                target[source.name] = source
            } else {
                for (var key in source) {
                    target[key] = source[key]
                }
            }
        }
        return target;
    }


    function pick(object, xKeys) {
        /**
            提取 object 包含在 xKeys 的属性, 返回这些属性构成的新对象.
            参数:
                object  待提取属性的对象
                xKeys   要提取的属性名, 最终转换为 [String]
                    [String]    xKeys
                    Undefined   Object.keys(object) 
                    Object      Object.keys(xKeys)
                    String      [xKeys]
                    *String     Pow.slice(arguments, 1)
         */
        var result = Object.create(null)

        if (object == undefined) return result
        switch (this.oString(xKeys)) {
            case 'Undefined':
                xKeys = Object.keys(object)
                break
            case 'String':
                xKeys = arguments.length === 2 ?
                    xKeys.split(',') :
                    this.slice(arguments, 1)
                break
            case 'Array':
                break
            case 'Object':
                xKeys = Object.keys(xKeys)
                break
            default:
                this.assert(false, xKeys)
        }

        xKeys.forEach(function(name) {
            result[name] = object[name]
        })

        return result
    }

    function omit(object, xKeys) {
        /**
            提取 object 不包含在 xKeys 的属性, 返回这些属性构成的新对象.
            参数:
                object    待提取属性的对象
                xKeys     要提取的属性名, 最终转换为 [String]
                    [String]    xKeys
                    Undefined   Object.keys(object) 
                    Object      Object.keys(xKeys)
                    String      [xKeys]
                    *String     Pow.slice(arguments, 1)
         */
        var result = Object.create(null)

        if (object == undefined || xKeys == undefined) return result

        switch (this.oString(xKeys)) {
            case 'Object':
                xKeys = Object.keys(xKeys)
                break
            case 'String':
                xKeys = arguments.length === 2 ?
                    xKeys.split(',') :
                    this.slice(arguments, 1)
                break
            case 'Array':
                break
            default:
                this.assert(false, xKeys)
        }

        this.any(object, function(v, k) {
            if (v !== undefined && xKeys.indexOf(k) === -1)
                result[k] = v
        })

        return result
    }

    function deepProperty(object, xPath) {
        /**
            返回 object 深层属性值.
         */
        if (object == undefined) return
        xPath = this.toArray.apply(this, this.slice(arguments, 1))

        xPath.some(function(prop) {
            object = object[prop]
            if (object === undefined) {
                return true
            }
        })
        return object
    }

    function deepCreate(object, xPath) {
        /**
            创建 object 深层属性, 保持已有属性, 否则创建一个裸对象.
            返回最深一层的属性值.
         */
        if (object == null)
            object = Object.create(null)

        xPath = this.toArray.apply(this, this.slice(arguments, 1))

        xPath.forEach(function(prop, v) {
            v = object[prop]
            if (v === null) {
                object = object[prop] = Object.create(null)
            } else {
                object = v
            }
        })

        return object
    }

    function parameters(params) {
        /**
            辅助函数, 处理 params 以符合指令对参数名的需求
            参数:
                params 字符串或者最终元素为字符串的数组 
            返回:
                字符串数组, 剔除空字符串和重复值.
         */
        var a = []
        if (!params) return a
        if (Array.isArray(params))
            params = params.join(',')

        params.split(',').forEach(function(v) {
            v = v.trim()
            if (v && a.indexOf(v) == -1)
                a.push(v)
        })
        return a
    }

    function directive(prefix) {
        /**
            directive 设置指令编译函数. 指令编译函数负责生成指令执行函数. 形式为:
                directive([prefix],Function|Object ...)
            参数:
                prefix   如果第一参数是 String 类型, 表示后续所有指令加前缀 "prefix-".
                Function 指令编译函数, 函数必须具有命名.
                Object   以 key/function 形式的指令编译函数对象.

            由 prefix,key 或者函数名最终拼接出纯小写指令名保存于 Pow.Directives.
            依据属性名进行最长优先匹配.
         */
        var dirs, pow = this,
            offset = 0
        if (!pow.Directives) {
            pow.Directives = Object.create(null)
        }

        dirs = pow.Directives
        if (typeof prefix == 'string') {
            offset = 1
            prefix = prefix.toLowerCase() + '-'
        } else {
            prefix = ''
        }

        pow.slice(arguments, offset).forEach(function(di) {
            switch (pow.oString(di)) {
                case 'Function':
                    if (!di.name)
                        return
                    dirs[prefix + di.name.toLowerCase()] = di
                    break
                case 'Object':
                    pow.any(di, function(di, name) {
                        if (name && 'function' === typeof di) {
                            dirs[prefix + name.toLowerCase()] = di
                        }
                    })
                    break
            }
        })
    }

})(this);

(function(global) {
    "use strict"
    var hasPromise = 0,
        errorChainingCycle = TypeError("Chaining cycle detected for promise #<Promise>")

    global.Pow.extend(global.Pow,
        Promise
    )

    function Promise(executor) {
        /**
            返回 ES6 风格的 Promise 对象. executor 必须为函数.
            如果只有一个参数且全局支持 ES6 Promise, 返回 new global.Promise(executor).
            否则 PowJS 实现的 PromiseLite 对象, 该对象实现了 then, catch 方法.
         */
        var pow = this
        if ((typeof executor !== 'function'))
            throw TypeError("Promise constructor takes a function argument")

        if (hasPromise === 0) {
            if (pow.isFunction(global.Promise)) {
                hasPromise = new global.Promise(function() {})
                hasPromise = pow.isFunction(hasPromise.then) && pow.isFunction(hasPromise.catch)
            } else {
                hasPromise = false
            }
        }

        if (arguments.length == 1 && hasPromise === true) {
            return new global.Promise(executor)
        }

        return new PromiseLite(executor)
    }

    function isPromise(x) {
        return global.Promise && x instanceof global.Promise ||
            x instanceof PromiseLite
    }

    function PromiseLite(executor, scope) {
        var promise = this
        scope = scope || new PromiseScope()

        this.then = scope.then.bind(scope)
        this.catch = scope.catch.bind(scope)

        executor && executor(function(v) {
            if (v === promise) throw errorChainingCycle
            scope.value = v
            scope.state = 'fulfilled'
            setTimeout(function() {
                play(scope)
            }, 0)
        }, function(v) {
            if (v === promise) throw errorChainingCycle
            scope.value = v
            scope.state = 'rejected'
            setTimeout(function() {
                play(scope)
            }, 0)
        })
    }

    function play(scope) {
        var stacks = scope.stacks,
            value = scope.value
        if (scope.state == 'pending') return
        while (stacks.length) {
            stacks.shift()(value)
        }
    }

    function PromiseScope() {
        this.state = 'pending'
        this.stacks = []
    }

    Promise.prototype = PromiseScope.prototype

    PromiseScope.prototype.then = function(onFulfilled, onRejected) {
        var scope = this,
            next = new PromiseScope()
        scope.stacks.push(function(v) {
            var value
            if (scope.state == 'fulfilled') {
                if (typeof onFulfilled == 'function') {
                    value = onFulfilled(v)
                }
            } else if (scope.state == 'rejected' && typeof onRejected == 'function') {
                value = onRejected(v)
            }
            next.state = scope.state
            next.value = value === undefined ? v : value

            setTimeout(function() {
                play(next)
            }, 0)
            return v
        })

        play(scope)

        return new PromiseLite(null, next)
    }

    PromiseScope.prototype.catch = function(onRejected) {
        return this.then(null, onRejected)
    }

})(this)