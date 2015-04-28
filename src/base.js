(function(global) {
    "use strict"
    var EZ = /^function .+\((.*)\)\s*{\s*\/\*+([\S\s]*)\*+\//,
        LOOP = 'LOOP' + Math.random(),
        BREAK = 'BREAK' + Math.random(),
        ISTEMPLATE = 'IS-DOM-TEMPLATE' + Math.random(),
        ISXJSON = 'IS-X-JSON' + Math.random(),
        nonArraylike = ['Window', 'String', 'Function',
            'Text', 'Comment'
        ],
        oString,
        VERSION = '@version'

    global.Pow = Pow()

    // 修正 ECMAScript 对 window.toString 未明确定义造成的浏览器实现差异
    try {
        if (toString.call() === '[object Undefined]') {
            oString = function(x, origin) {
                return origin && toString.call(x) || toString.call(x).slice(8, -1)
            }
        } else
            oString = (function() {
                var oString = Object.prototype.toString
                return function(x, origin) {
                    x = origin && oString.call(x) || oString.call(x).slice(8, -1)
                    return x === 'global' && 'Window' || x
                }
            })()
    } catch (e) {
        oString = (function() {
            var oString = Object.prototype.toString
            return function(x, origin) {
                return origin && oString.call(x) || oString.call(x).slice(8, -1)
            }
        })()
    }
    global.Pow.oString = oString;

    'Function,Error,Object,Number,Null,Undefined,Boolean,String,Date,RegExp,Window,XMLHttpRequest'.split(',').forEach(function(v) {
        global.Pow['is' + v] = Function('object', 'return this.oString(object) ==="' + v + '"')
    })


    extend(
        global.Pow, {
            isMini: !clone.toString().match(EZ),
            document: global.document,
            LOOP: LOOP,
            BREAK: BREAK,
            Config: {
                nonArraylike: nonArraylike
            },
            Directives: {
                ow: Object.create(null)
            },
            has: Object.prototype.hasOwnProperty.call
                .bind(Object.prototype.hasOwnProperty),

            slice: Array.prototype.slice.call
                .bind(Array.prototype.slice),

            ift: function(any, message, x) {
                /**
                    if (any) throw message.
                    如果有参数 x, 使用 JSON.stringify(x)
                 */
                // "use strict" 模式下 arguments.caller 不可用
                if (any) {
                    if (any instanceof Error)
                        throw any
                    if (message && message.slice(-1) != ':') {
                        message += ': unexpected'
                    }
                    throw (message || 'unexpected') + ' ' +
                    x ? JSON.stringify(x) :
                    (typeof any === 'object' ? this.oString(any) : String(any))
                }
            },
            sw: function(eachCallback) {
                /**
                    sw 包装 eachCallback, 交换第一第二参数. 实例场景:
                    包装 each 风格回调函数, 返回数组原生 forEach 风格回调函数.
                    返回值符合 forEach 函数的回调函数.
                    forEach 标准风格回调函数参数次序为:
                        item  元素值
                        index 元素索引
                        list  被遍历的数组对象本身
                    each 风格回调函数参数次序为:
                        index 元素索引
                        item  元素值
                        list  被遍历的数组对象本身
                 */
                return function(item, index) {
                    var args = Pow.slice(arguments)
                    args[0] = index
                    args[1] = item
                    return eachCallback.apply(this, args)
                }
            },
            fe: function(forEachMethod) {
                /**
                    包装 forEach 风格函数 forEachMethod, 返回 each 风格函数.
                    返回值可接受 eachCallback 风格的参数.
                 */
                return function(eachCallback, thisArg) {
                    thisArg = Pow.slice(arguments)
                    thisArg[0] = Pow.sw(eachCallback)
                    forEachMethod.apply(this, thisArg)
                }
            },
            tick: (function() {
                var c = 1;
                return function() {
                    /**
                        递增计数器
                     */
                    return c++
                }
            })(),
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
            isArray: function(x) {
                return x instanceof Array
            },
            isComment: function(x) {
                return x instanceof Comment
            },
            isElement: function(x) {
                return x instanceof Element
            },
            isNode: function(x) {
                return x instanceof Node
            },
            isText: function(x) {
                return x instanceof Text
            },
            object: function(list, values) {
                /**
                    拼装一个 Object 对象.
                        object(String, valueNotArray)
                        object([String],[value])
                    内部总是把 list, values 转化为数组, 以 list 元素为 key,
                    values 同下标元素(如果有的化)为 value 组成返回对象的一个属性.
                 */
                var obj = Object.create(null)

                values = this.toArray(values, true)
                this.toArray(list, true).some(function(name, i) {
                    if (values.length === i) return true
                    obj[String(name)] = values[i]
                })

                return obj
            },
            noop: function() {},
            null: function() {
                return null
            }
        },
        any,
        clone,
        deepCreate,
        deepProperty,
        defaults,
        directive,
        docez,
        extend,
        omit,
        pick,
        toArray,
        watch
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

    function clone() {
        /**
            clone 专用于 PowJS 自身克隆, 返回 Pow 的克隆对象.
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

    function any(object, callback, thisArg) {
        /**
            遍历 object 元素或属性, 当 callback 有返回值, 终止遍历并返回该值.
                callback.call(thisArg , value, key, object)
         */
        var ret, v
        if (this.oString(object) === 'NamedNodeMap') {
            for (var i = 0, l = object.length; i < l; i++) {
                v = object.item(i)
                ret = callback.call(thisArg, v.nodeName, v.nodeValue, object)
                if (ret !== undefined) break
            }
            return ret
        }

        if (!(object instanceof Array) && this.likeArray(object)) {
            object = this.slice(x)
        }

        for (var k in object) {
            ret = callback.call(thisArg, object[k], k, object)
            if (ret !== undefined) break
        }
        return ret
    }

    function toArray(x, mustBeArraylike) {
        /**
            转换 x 为数组.
                (Array)        return x
                (Arraylike)    return Pow.slice(x)
                (other)        return [x]
                (other,true)   抛出异常
            返回:
                Array | 抛出异常(mustBeArraylike).
         */
        if (x instanceof Array) return x
        if (this.likeArray(x)) {
            return this.slice(x)
        }

        this.ift(mustBeArraylike, x)

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
                this.ift(this.oString(xKeys))
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
                this.ift(1, '', xKeys)
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
        if (object == undefined)
            object = Object.create(null)

        xPath = this.toArray.apply(this, this.slice(arguments, 1))

        xPath.forEach(function(prop, v) {
            v = object[prop]
            if (v === undefined) {
                object = object[prop] = Object.create(null)
            } else {
                object = v
            }
        })
        return object
    }

    function watch(object, prop, descriptor) {
        /**
            watch 监视对象某属性被赋值时(setter)调用指定的函数.
            内部通过 Object.defineProperty 实现.
            参数:
                object     被监视对象. 自动创建裸对象.
                prop       被监视对象属性名.
                descriptor 属性描述, object/function/undefined.
                    对象可包括属性:
                    enumerable   属性是否出现在枚举属性中. 默认为 false.
                    configurable 属性是否能被删除. 默认为 false.
                    writable     属性是否能被赋值. 默认为 false.
                    skipGetter   不要接管 getter. 缺省为 false.
                    value        缺省属性值.
                    set          给属性提供 setter 的方法.
                    get          给属性提供 getter 的方法.
            返回:
                如果 descriptor == undefined, 返回 Watcher 对象. 否则返回 object
                Watcher 对象在 descriptor 基础上做了扩展.

            如果参数 descriptor 是个函数, 表示 setter 方法.

            Watcher 对象可包括属性:
                enumerable
                configurable
                writable
                value        缺省属性值或者最近一次 setter 的值.
                set          由内部提供的 setter 的方法接管.
                get          getter 的方法, descriptor 定义或者被内部方法接管.
                setters      descriptor 指示的 setter 的方法数组.
                receiver     参数中的 object
                name         参数中的 prop

            提示:
                切勿在 getter/setter 的方法中发生递归调用.
                enumerable,configurable,writable,value 只在初次使用时有效.
                writable,value,set,get 属性相互影响, 不当的搭配会抛出异常.
                如果 object[prop] 已经由其他函数定义了 descriptor 可能抛出异常.
                watch 主要负责处理的是 setter 的方法, getter 可由使用者决定.
                如果使用者没有定义 getter, 将使用内部方法接管.
         */
        var watcher, value, writable;

        if (object == undefined)
            object = Object.create(null)

        if ('function' === typeof descriptor)
            descriptor = {
                set: descriptor
            }

        watcher = getWatcher(object, prop)

        if (!watcher) {
            // 初次 defineProperty
            watcher = getWatcher(descriptor && descriptor.skipGetter)

            // 提取初始值
            value = descriptor == undefined || descriptor.value == undefined ?
                object[prop] : descriptor.value

            Object.defineProperty(object, prop, this.extend(
                this.pick(descriptor, ['enumerable', 'configurable']),
                watcher
            ))

            if (value !== undefined)
                watcher.value = value

        } else if (!this.has(watcher, 'receiver')) {
            // 已经定义了 getter, 可能抛出异常
            if (watcher.set || watcher.configurable === false)
                throw "Pow.watch is useless"

                // 这种方法可能有副作用
            writable = watcher.writable
            delete object[prop]

            watcher = this.extend(
                getWatcher(watcher.get ? true : false),
                this.pick(watcher, ['enumerable', 'configurable', 'get'])
            )

            Object.defineProperty(object, prop, watcher)

            watcher.writable = writable
        }

        if (!watcher.setters) {
            Object.defineProperties(watcher, {
                name: {
                    value: prop
                },
                receiver: {
                    value: object
                },
                setters: {
                    value: []
                }
            })

        }

        // 修正属性差异
        if (watcher.writable == undefined) {
            watcher.writable = true
        }

        // 仅新建 watcher
        if (descriptor == undefined)
            return watcher
        if (descriptor.set) {
            // ???需要检测重复定义 setter
            // && watcher.setters.indexOf(descriptor.set) === -1
            watcher.setters.push(descriptor.set)
        }

        return object
    }

    function getWatcher(object, prop) {
        /**
            返回 object[prop] 对应的 watcher 对象.
            如果没有参数, 新建一个 watcher 对象并返回.
         */
        var watcher
        if (arguments.length === 2) {
            // 获取 watcher
            watcher = Object.getOwnPropertyDescriptor(object, prop)
            if (watcher && watcher.set && watcher.set.constructor === watcherSet) {
                // 获取完整的 watcher
                return watcher.set(watcherGet)
            }
            // 非 getWatcher 定义的
            return watcher
        }

        // 生成并绑定到 watcher
        watcher = Object.create(null)

        Object.defineProperty(watcher, 'set', {
            enumerable: true,
            value: watcherSet.bind(watcher)
        })

        watcher.set.constructor = watcherSet

        // object 复用表示 skip get
        if (object !== true) {
            Object.defineProperty(watcher, 'get', {
                enumerable: true,
                value: watcherGet.bind(watcher)
            })
            watcher.get.constructor = watcherGet
        }

        return watcher
    }

    function watcherGet() {
        /**
            托管 Object.defineProperty descriptor.get.
            this 被绑定到 watcher 对象
        */
        return this.value
    }

    function watcherSet(newValue) {
        /**
            watcherSet 遍历调用 watcher.setters, this 对象是 receiver, 原 object.
            如果 writable 为真, newValue 被保存.
         */
        var object = this.receiver
        if (newValue === watcherGet) {
            return this
        }

        if (this.writable)
            this.value = newValue

        this.setters.forEach(function(set) {
            set.call(object, newValue)
        })
    }

    function directive() {
        /**
            directive 设置指令编译函数. 指令编译函数负责生成指令执行函数.
            指令格式:
                格式符合 HTML 属性写法, 属性名即指令名, 属性值即指令体.
                [prefix-]directivename[-config][=code]
                分割符:
                    "-" 为分隔符
                指令前缀:
                    指示指令位于 Pow.Directives[prefix].
                    如果没有则直接位于 Pow.Directives 下.
                指令名:
                    对应指令编译函数.
                指令配置:
                    可接受任意字符串, 相当于配置参数, 由编译函数处理.
                    'ow-' 开头的指令忽略 config, 除非特别说明.
                指令体:
                    code 为指令体, 由编译函数处理.

            directive 接受三种类型的参数:
                String   表示指令前缀, 缺省为 'ow'.
                Function 指令编译函数, 函数必须有命名.
                Object   以 key/function 形式的指令编译函数对象.

            指令编译函数:
                生成指令执行函数并在上下文传递(增减)参数.
                function(config,  params, code){
                    // ...
                }
                config
                    指令格式中的 config 部分.
                code
                    指令格式中的 code 部分.
                params
                    执行函数参数名列表.
                
                返回
                    undefined  无值表示无执行函数
                    String     固定属性值.
                    Error      返回一个编译错误
                    Function   调用 Pow.func 生成的结果, 请参阅 Pow.func.

            指令执行函数:
                function(__ ,param1,paramN){
                    dosomething
                    return args
                }

                "__" 表示 target, 由 PowJS 负责带入.
                "__" 开头和结尾的变量名被编译器保留.
                后续参数即指令编译函数中的 params 部分.
                返回值传递给后代作为的参数. 无传递后代执行函数不被执行.
                可以用 this.result = args 替代 return 传递参数.
                如果无参数可传递, 使用 return [].
                执行函数中的 this 是 Chain 对象, 请参阅 Pow.Chain.
         */
        var ow = this.Directives.ow

        this.slice(arguments).forEach(function(di) {
            switch (this.oString(di)) {
                case 'Function':
                    this.ift(!di.name || di.name.indexOf('-') !== -1,
                        'Pow.directive: invalid name of compilation functions:', di.name)

                    ow[di.name.toLowerCase()] = di
                break
                case 'Object':
                    this.any(di, function(di, name) {
                        if ('function' === typeof di) {
                            this.ift(name.indexOf('-') !== -1,
                                'Pow.directive: invalid name of compilation functions:', name)

                            ow[name.toLowerCase()] = di
                        }
                    }, this)
                break
                case 'String':
                    this.ift(di.indexOf('-') !== -1,
                        'Pow.directive: invalid prefix:', di)

                    di = di.toLowerCase().trim()
                    if (!di) {
                        ow = this.Directives
                        break
                    }
                    if (!this.Directives[di]) {
                        this.Directives[di] = Object.create(null)
                    }
                    ow = this.Directives[di]
                break
            }
        }, this)
    }

    function docez(self) {
        /**
            返回 PowJS API 文档数据.
         */
        var comment, space,
            api = Object.create(null),
            object = Object.create(null),
            property = Object.create(null),
            method = Object.create(null),
            proto = Object.create(null)

        self = self || this
        Object.keys(self).sort().forEach(function(name, val) {
            val = self[name]
            switch (oString(val)) {
                case 'Function':
                    comment = (val.toString().match(EZ) || '')[2] || name
                    space = (comment.match(/[\t ]+/) || [''])[0].length
                    comment = comment.split("\n").map(function(line) {
                        return line.slice(space) || "\n"
                    })
                    method[name] = comment.join("\n").trim()

                    if (val.prototype && Object.keys(val.prototype).length) {
                        proto[name] = this.docez(val.prototype).method
                    }
                break
                case 'Object':
                    object[name] = this.docez(val)
                break
                case 'String':
                case 'Number':
                case 'Boolean':
                    property[name] = val
                break
                default:
                    property[name] = name + ' is an ' + oString(val)
            }
        }, this)

        if (Object.keys(property).length) {
            api.property = property
        }
        if (Object.keys(object).length) {
            api.object = object
        }
        if (Object.keys(method).length) {
            api.method = method
        }
        if (Object.keys(proto).length) {
            api.proto = proto
        }
        return api
    }

})(this)