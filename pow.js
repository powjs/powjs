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

    // 修正 ECMAScript 对 toString 定义不够明确造成的浏览器实现差异
    try {
        if (toString.call() === '[object Undefined]') {
            oString = function(x, nonSlice) {
                return nonSlice && toString.call(x) || toString.call(x).slice(8, -1)
            }
        } else oString = (function() {
            var oString = Object.prototype.toString
            return function(x, nonSlice) {
                x = nonSlice && oString.call(x) || oString.call(x).slice(8, -1)
                return x === 'global' && 'Window' || x
            }
        })()
    } catch (e) {
        oString = (function() {
            var oString = Object.prototype.toString
            return function(x, nonSlice) {
                return nonSlice && oString.call(x) || oString.call(x).slice(8, -1)
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
                    if (any instanceof Error) throw any
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
            clone 专用于 PowJS 自身克隆, 返回 this 的克隆对象.
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
                    console.log(key)
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
        if (target == undefined) target = Object.create(null);
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
        if (target == undefined) target = Object.create(null);
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

            if (value !== undefined) watcher.value = value

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

        if (descriptor.set &&
            watcher.setters.indexOf(descriptor.set) === -1) {

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
            directive  设置指令编译函数. 编译函数负责生成指令执行函数.
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
                    此步执行函数带入的参数名拼接字符串. 不包括第一参数.
                
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
        var comment, space, api = Object.create(null),
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
(function(global) {
    "use strict"
    var LOOP = global.Pow.LOOP,
        BREAK = global.Pow.BREAK,
        SPACE = '    '

    global.Pow.Chain = Chain
    Chain.prototype = new Array()
    global.Pow.extend(Chain.prototype, set, invoke, source)

    function Chain(chain, receiver) {
        /**
            返回一个 Chain 对象, 提供有序链式调用.
            Chain 对象是个数组, 元素为函数或者 Chain 对象.
            参数:
                chain    初始化数组, 元素为函数或者 Chain 对象. 缺省为 [].
                receiver 对象, 在不同 Chain 之间共享结果. 可以后期设置.
            Chain 对象属性:
                Pow      当前的 Pow 对象.
                receiver receiver
                set      function(receiver) 设置 receiver, 返回 this.
                cursor   当前调用在 Chain 中的序号.
                result   必要时函数主动通过 cursor 和 result 返回值, 比如: 异步, repeate.
                invoke   负责链式调用, 此方法也是 this.result 的 setter.
            receiver 对象属性:
                result   链式调用最终结果, 这是个数组化的返回值.
         */
        var inst
        if (this instanceof Chain) {
            return
        }

        inst = new this.Chain()
        inst.Pow = this
        inst.cursor = 0
        inst.set(receiver)
        chain && chain.forEach(function(chain) {
            if (typeof chain === 'function' || chain instanceof Chain) {
                inst.push(chain)
            } else if (chain instanceof Array) {
                inst.push(this.Chain(chain, receiver))
            } else {
                throw 'Chain: unexpected ' + this.oString(chain)
            }
        }, this)

        inst.invoke = inst.invoke.bind(inst)
        return this.watch(inst, 'result', inst.invoke)
    }

    function set(receiver) {
        /**
            设定返回值接收对象
         */
        this.receiver = receiver
        return this
    }

    function invoke(args) {
        /**
            invoke 方法顺序调用 Chain 中元素, 无返回值.
            初始参数为:
                args = Pow.toArray(args)
            元素为 Chain 时:
                chain.set(this.receiver).invoke(args)
                continue
            元素为函数时:
                val = func.apply(this, args)
                依据 val 类型确定行为:
                undefined  return
                Error      cursor=0; receiver.result=val; return
                BREAK      cursor=0; receiver.result=val; return
                other      args=Pow.toArray(val);continue
            正常完成调用链:
                cursor=0, this.receiver.result=args.
            所有调用链使用同一个 receiver, 监视 receiver.result 变化可得到所有结果.
         */
        var it, pow = this.Pow
        args = pow.toArray(args)

        while (this.cursor < this.length) {
            it = this[this.cursor]

            // 如果元素是 Chain 类型
            if (it instanceof Chain) {
                it.set(this.receiver).invoke(args)
                this.cursor++
                    continue
            }

            if (typeof it !== 'function') continue

            it = it.apply(this.receiver, args)

            if (it === undefined) {
                return
            }

            if (it === pow.BREAK || it instanceof Error) {
                args = it
                break
            }

            /**
            // 如果返回 Chain 类型
            if (it instanceof Chain) {
                this.cursor = 0
                this.receiver.result = args
                this.receiver.result = it
                return
            }
            */
            args = pow.toArray(it)
            this.cursor++
        }
        this.cursor = 0
        this.receiver.result = args
    }

    function source() {
        /**
            输出所有函数 JavaScript 源码.
         */
        var deep = arguments[0] || 0,
            space = SPACE.repeat(deep),
            indent = '\n' + space + space,
            str = space + '['

        this.forEach(function(a, i) {
            str += (i ? ',\n' : '\n')
            if (typeof a !== 'function') {
                str += a.source(deep + 1)
                return
            }
            str += space + space + a.toString()
                .replace('function anonymous(', 'function (')
                .replace('\n/**/', '')
                .split('\n').slice(0, -1).join(indent + space) + indent + '}'
        })
        return str + '\n' + space + ']'
    }
})(this)
(function(global) {
    "use strict"
    var AnonymousPos = func().toString().indexOf('(')

    global.Pow.extend(global.Pow.Config, {
        delimiterLeft: '{{',
        delimiterRight: '}}'
    })

    global.Pow.extend(global.Pow, compile, express,
        func,
        toJSON,
        toJS
    )

    function compile(tag, params) {
        /**
            调用指令编译函数或编译表达式生成执行队列.
            编译函数执行时 this 对象为 Pow.
            参数:
                tag  一个完整标签定义,即一个 Tags 元素.
            返回:
                错误或者编译后的执行队列 [functions...]
            提示:
                该方法仅处理指令编译函数返回的
                    undefined, String, Error
                类型结果, 其他类型作为结果 push 进结果中.
         */
        var err,
            dirs = this.Directives,
            cfg = this.Config,
            keys = [],
            clone = Object.create(null),
            array = [0]

        // 保存原始参数
        array[0] = params = params.slice(1).join(',')
        clone.nodeName = tag.nodeName
        err = this.any(tag, function(text, key) {
            var cc, config, code
            if (key[0] === '$' || key == 'nodeName') {
                return
            }

            // 匹配编译指令, 位置只有两种情况
            // dirs 或者 dirs[prefix], 贪心匹配
            // textContent 也是个指令, 并唯一
            config = key.toLowerCase().split('-')

            cc = dirs[config[0]]
            if (cc && !this.isFunction(cc) && config[1]) {
                cc = cc[config[1]]
                config = config.slice(2).join('-')
            } else {
                config = config.slice(1).join('-')
            }

            if (this.isFunction(cc)) {
                code = cc.call(this, config, params, text)
            } else {
                // 求值表达式
                code = this.express(key, params, text)
            }

            switch (this.oString(code)) {
                case 'Undefined':
                    return
                case 'String':
                    // 字面值
                    clone[key] = code
                    return
                case 'Error':
                    return code
                case 'Function':
                    params = code()[2].slice(1).join(',')
                    array.push(code)
                    break
                default:
                    return Error('compile: unexpected ' + this.oString(code))
            }
        }, this)

        if (err) return err
        clone.$ = [tag.$.index, tag.$.parentIndex]
        clone = JSON.stringify(clone)

        // 第一函数
        array[0] = this.func(array[0], '__=[' + clone + '];\n__=__.concat(__.slice.call(arguments))')
        return array
    }

    function express(propName, params, text) {
        /**
            express 把求值表达式函数化. express 其实也是指令编译器.
            工作期:
                tag           非 textBinding 时直接赋值
                node          用于初始化 Node 属性.
                owTextChanged 事件触发用于绑定更新.
            参数:
                propName 对求值结果进行 Pow(__).attr(propName,value)
            返回:
                String   text 不是表达式, 原值返回 text.
                Error    非法表达式
                Function 转化后的表达式求值函数
        */
        var a, code, bind = '',
            cfg = this.Config

        if (!text) return text

        a = text.split(cfg.delimiterRight)
        if (a.length === 1) {
            return text
        }

        code = []
        a.some(function(text) {
            var a
            if (!text) return
            a = text.split(cfg.delimiterLeft)

            // 非法表达式
            if (a.length > 2) {
                code = text
                return true
            }

            // 字面值 
            if (a[0]) {
                code.push(JSON.stringify(a[0]))
            }

            if (!a[1]) {
                return
            }

            a[1] = a[1].trim()
            if (a[1][0] === '#') {
                a[1] = a[1].slice(1).trim()
                if (a[1]) bind = true
            }

            // 表达式
            if (a[1]) code.push('(' + a[1] + ')')
        })

        if (typeof code === 'string') {
            return Error('unclosed expression: ' + JSON.stringify(code))
        }

        code = code.join('+')

        // 非 textBinding 只工作于 tag, 直接赋值
        if (!bind) {
            return this.func(params, '__.' + propName + '=' + code)
        }

        // textBinding 工作于 node 和 "owTextChanged", 无返回值
        if (propName === 'textContent')
            return this.func(params,
                '__.textContent=' + code,
                '', 'node,owTextChanged'
            )

        propName = JSON.stringify(propName)
            // textBinding 属性
        return this.func(params,
            'var __k__=' + propName + ',__v__=' + code +
            ';\nthis.Pow(__).attr(__k__,__v__)',
            null, 'node,owTextChanged'
        )
    }

    function nameTrim(v) {
        return v.trim()
    }

    // 去除重复
    function nameIfy(v, i, array) {
        return v && array.indexOf(v) == i
    }

    function func(params, code, results, type, object) {
        /**
            生成符合 PowJS 内部机制的指令执行函数.
            编译函数调用 Pow.func 可保证内部机制有效运行.
            参数:
                params  输入参数字符串. 自动添加 '__'.
                code    执行体代码.
                results 输出参数字符串, 缺省等于 params, 非 '' 自动添加 '__'.
                type    字符串值, 表示指令执行期, 缺省为 'tag'.
                object  PlainObject, 最终转换为 JSON, 由内部机制处理, 缺省为 null.
            返回:
                Error | 符合 PowJS 内部机制的函数对象.
            提示:
                调用者可在 code 中自己控制输出, 请参阅源码了解细节.
                保存功能由其他方法实现, 这里只是存储此参数.
                无参数调用返回的函数可返回:
                    [types,params,results,object]
                其中 types,params,results 都是字符串数组.
                object 是原值, 内部机制暂时只支持字符串值, 表示存储键值.
        */
        params = ('__,' + (params || ''))
            .split(',').map(nameTrim).filter(nameIfy)

        if (results == undefined) {
            results = params
        } else if (results != '') {
            results = ('__,' + results)
                .split(',').map(nameTrim).filter(nameIfy)
        }

        // 保存 [types,params,results,object]
        type = [
            (type || 'tag').split(',').map(nameTrim).filter(nameIfy),
            params, results, object || null
        ]

        // 把 type 加到第一行
        code = 'if(!arguments.length) return ' + JSON.stringify(type) + ";\n" +
            (code && code + ';\n' || '') +
            (results.length ? ('return [' + results.join(',') + ']') : '')

        try {
            code = Function(params.join(','), code)
                // code() //??? 运行一下
            code.toJSON = toJSON
        } catch (err) {
            return err
        }

        return code
    }
    function toJSON() {
        // 函数转成字符串代码, 4 空格缩进
        // JSON.stringify 后还是 JSON 字符串, 需要 JSON.parse.
        return 'function ' + this.toString()
            .slice(AnonymousPos).replace('\n/**/', '')
            .split('\n').slice(0, -1).join('\n            ') +
            '\n        }'
    }

    function toJS(x) {
        /**
            特别配合 PowJS 内部机制, 返回可存储的 JavaScript 代码.
            参数 x 是编译结果.
         */
        return JSON.stringify(x, null, 4)
            .replace(/"function .+}"/g, function(src) {
                return JSON.parse(src)
            })
    }

})(this)
(function(global) {
    "use strict"
    global.Pow.directive(
        '',
        bind,
        Break,
        breakIf,
        chain,
        fragment,
        func,
        If,
        js,
        repeate,
        textContent,
        valueTo,
        Var
    )

    function func(chainname, params, code) {
        /**
            func 指令定义一个可被调用的函数, 工作于 "tag" 期, 缺省为匿名函数.
            通过 config 参数给函数命名(存储路径)可以保存函数.
            格式:
                ow-func[-chainname]="[,]params1[,paramsN][ code]"
            如果以 "," 开头表示在现有参数后增加新参数, 否则只传递定义的参数.
            用例:
                ow-func=""
                ow-func="paramsOnly"
                ow-func=" codeOnly()"
                ow-func=",x,y x=initX();y=initY()"
                ow-func-my-nodes="params code()"
            chainname 对执行函数命名, 事实上是整个节点和后代组成的 Chain 对象命名.
            此命名唯一, 否则会被覆盖.
         */
        var results = code.split(' ')[0]
        code = code.slice(results.length)

        params += ',' + results

        if (results[0] == ',') {
            results = params
        }
        // chain 需要在运行期保存
        return this.func(params, code,
            results || null, chainname ? 'tag chain' : 'tag', chainname)
    }

    function nameTrim(v) {
        return v.trim()
    }

    function nameIfy(v, i, array) {
        return v && array.indexOf(v) == i
    }

    function chain(chainname, params, code) {
        /**
            chain 指令调用 func 指令命名的函数(Chain), 生成子节点的 Tags.
            格式:
               ow-child-chainname="[,]params1[,paramsN][ code]"
            提取 chainname 对应的 Chain 对象 __chain__, 执行 code,然后调用:
                __chain__.set(this.receiver).invoke(args)
            这里的 args 是 paramsN 与 params 合并(如果首字符为",")的结果.
         */
        var args = code.split(' ')[0]
        code = code.slice(args.length)

        params += ',' + args

        if (args[0] == ',') {
            args = params
        }

        args = ('__,' + args).split(',').map(nameTrim).filter(nameIfy).join(',')

        code = 'var __chain__=this.Pow.getChain("' + chainname + '");\n' + code + ';\n' +
            '__chain__.set(this.receiver).invoke([' + args + '])'

        return this.func(params, code)
    }

    function Var(cfg, params, code) {
        /**
            var 指令格式与 func 指令格式一致, 只是不产生可被调用的函数.
         */
        var results = code.split(' ')[0]
        code = code.slice(results.length)

        params += ',' + results

        if (results[0] == ',') {
            results = params
        }

        return this.func(params, code, results || null, 'tag')
    }

    function js(cfg, params, code) {
        /**
            js 嵌入 javascript 代码.
            例如在 code 中对 var 指令定义的变量赋值.
         */
        return this.func(params, code)
    }

    function If(cfg, params, code) {
        /**
            if 指令当 code 表达式为真时所在节点和后代节点才能继续.
            不影响同级节点.
         */
        return this.func(params, 'if (!(' + code + ')) return')
    }

    function Break(cfg, params, code) {
        /**
            break 跳过后续同级节点, 后代节点不影响.
         */
        return this.func(params, code + ';return this.Pow.BREAK', this.BREAK)
    }

    function breakIf(cfg, params, code) {
        /**
            breakIf 指令当 code 表达式为真时跳过后续同级节点.
            不影响后代节点.
            格式:
                "express"
         */
        return this.func(params, 'if (!(' + code + ')) return this.Pow.BREAK')
    }

    function repeate(cfg, params, code) {
        /**
            repeate 枚举某对象属性, 重复所在节点和后代节点.
            格式:
                "express[ varOfvalue[ varOfkey]]"
            用例:
                "express"       等价 "express val key"
                "express val"   不会传递 key
                "express ! key" 不会传递 val
            val, key 参量被加入到后代节点.
         */
        var results, names = ''

        code = (code).split(' ').slice(3)

        if (code.length == 1) {
            code.push('val')
            code.push('key')
        }

        if (code[1] && code[1] !== '!') {
            names = code[1]
        }

        if (code[2]) {
            names += (names ? ',' : '') + code[2]
        }

        // 去重
        results = (params + ',' + names).split(',')
            .map(nameTrim).filter(nameIfy).join(',')

        code = 'var __c__=this.cursor;' +
            'this.Pow.any(' + code[0] + ',function(' + names + ') {' +
            'this.cursor=__c__;this.result=[__,' + results + ']},this);return'

        return this.func(params, code, results)
    }

    function valueTo(cfg, params, code) {
        /**
            当元素 value 属性发生改变, 对指定对象属性进行赋值.
            工作期:
                node
            两种格式:
                "object.propName"
                "object 'propName'"
            第二种格式 'propName'事实上是属性名求值表达式.
            提示:
                value 指令和 bind 指令配合使用, 可实现表单元素数据绑定.
         */

        var object = code.split(' ', 1)[0]

        cfg = code.slice(object.length + 1) // propName

        if (!cfg) {
            object = object.split('.')
            cfg = "'" + object.pop() + "'"
            object = object.join('.')
        }

        if (!object || !cfg) {
            return Error('invalided code value=' + JSON.stringify(code))
        }

        // __k__ 保证表达式只被计算一次
        return this.func(params,
            'var __k__=' + cfg +
            ';if(__.hasOwnProperty("value")) ' +
            'this.Pow(__).on("change",function(){' + object + '[__k__]=this.value})',
            null,
            'node'
        )
    }

    function bind(cfg, params, code) {
        /**
            当对象属性被赋值时, 发出 "owTextChanged" 事件.
            工作期:
                node
            两种格式:
                "object.propName"
                "object 'propName'"
            第二种格式 'propName'事实上是属性名求值表达式.
         */
        var object = code.split(' ', 1)[0]

        cfg = code.slice(object.length + 1) // propName

        if (!cfg) {
            object = object.split('.')
            cfg = "'" + object.pop() + "'"
            object = object.join('.')
        }

        if (!object || !cfg) {
            return Error('invalided code bind=' + JSON.stringify(code))
        }

        // watch 无法判断重复加入的匿名函数, 有可能出问题么???
        // __k__ 保证表达式只被计算一次
        return this.func(params,
            'var __pow__=this.Pow,__k__=' + cfg +
            ';__pow__.watch(' + object + ',__k__, {' +
            'enumerable:true,skipGetter:true,' +
            'set:function(){' +
            '__pow__(__).fire("owTextChanged",[' + params + '])}})',
            null,
            'node'
        )
    }

    function textContent(cfg, params, text) {
        /**
            textContent 调用 Pow.express('textContent', params, text)
        */
        return this.express('textContent', params, text)
    }

    function fragment(cfg, params, code) {
        return this.func(params, '__.nodeName=null;' + code)
    }

})(this)
(function(global) {
	"use strict"
	/**
		The Document interface:
			createEvent(type)
			CustomEvent(type, detail)
		The CustomEvent interface:
			initCustomEvent(type, canBubble, cancelable, detail)
			detail attribute
		The EventTarget interface:
			addEventListener(type, listener, useCapture)
			removeEventListener(type, listener, useCapture)
			dispatchEvent(event)
		The Event interface:
			NONE constant
			CAPTURING_PHASE constant
			AT_TARGET constant
			BUBBLING_PHASE constant
			type attribute
			target attribute
			currentTarget attribute
			eventPhase attribute
			bubbles attribute
			cancelable attribute
			timeStamp attribute
			defaultPrevented attribute
			isTrusted attribute
			stopPropagation() method
			stopImmediatePropagation() method
			preventDefault() method
			initEvent(type, canBubble, cancelable) method
	 */
	var ELEMENT_NODE = Node.ELEMENT_NODE,
		ATTRIBUTE_NODE = Node.ATTRIBUTE_NODE,
		TEXT_NODE = Node.TEXT_NODE,
		CDATA_SECTION_NODE = Node.CDATA_SECTION_NODE,
		ENTITY_REFERENCE_NODE = Node.ENTITY_REFERENCE_NODE,
		ENTITY_NODE = Node.ENTITY_NODE,
		PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE,
		COMMENT_NODE = Node.COMMENT_NODE,
		DOCUMENT_NODE = Node.DOCUMENT_NODE,
		DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE,
		DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE,
		NOTATION_NODE = Node.NOTATION_NODE,
		oString = global.Pow.oString

	global.Pow.extend(
		global.Pow.prototype, {
			addEventListener: on,
			removeEventListener: off,
			dispatchEvent: fire
		},
		on, off, fire, once
	)

	// 全部支持 Element 的事件
	global.Pow.StandardEvents = Object.create(null)
	global.Pow.any({
		abort: "Window,Element:Event",
		blur: "Window,Element:FocusEvent",
		click: "Element:MouseEvent",
		dblclick: "Element:MouseEvent",
		error: "Window,Element:Event",
		focus: "Window,Element:FocusEvent",
		focusin: "Window,Element:FocusEvent",
		focusout: "Window,Element:FocusEvent",
		keydown: "Element:KeyboardEvent",
		keyup: "Element:KeyboardEvent",
		load: "Window,Document,Element:Event",
		mousedown: "Element:MouseEvent",
		mouseenter: "Element:MouseEvent",
		mouseleave: "Element:MouseEvent",
		mousemove: "Element:MouseEvent",
		mouseout: "Element:MouseEvent",
		mouseover: "Element:MouseEvent",
		mouseup: "Element:MouseEvent",
		resize: "Window,Element:UIEvent",
		scroll: "Document,Element:UIEvent",
		select: "Element:Event",
		unload: "Window,Document,Element:Event",
		wheel: "Element:WheelEvent"
	}, function(s, k) {
		this[k] = Object.create(null)
		s = s.split(':')
		this[k].iface = s[1]
		this[k].target = s[0].split(',')
	}, global.Pow.StandardEvents)

	function on(type, listener, useCapture) {
		/**
			在每个元素上注册监听事件. 多个 type 用 "," 拼接.
		 */
		var pool = this.Pow.Pool
		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				pool.put(evKey(el), el, t, listener)
				if (el.addEventListener) {
					el.addEventListener(type, listener, useCapture)
				}
			})
		}, this)
		return this
	}

	function once(type, listener, useCapture) {
		/**
			在每个元素上注册一次性监听事件. 多个 type 用 "," 拼接.
		 */
		var key, callee, pool = this.Pow.Pool

		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				key = evKey(el)
				if (el.addEventListener) {
					callee = onceListener(pool, el, t, listener, useCapture)
					el.addEventListener(t, callee, useCapture)
				} else {
					callee = onceListener(pool, el, t, callee, key)
				}
				pool.put(key, el, t, listener)
			})
		}, this)
		return this
	}

	function onceListener(pool, el, t, listener, key, callee) {
		return callee = function(e) {
			setTimeout(function() {
				pool.use(key, el, t, listener)
				if (typeof key !== 'string') {
					el.removeEventListener(t, callee, key)
				}
			}, 0)
			return listener(e)
		}
	}

	function off(type, listener, useCapture) {
		/**
			在每个元素上注销监听事件. 多个 type 用 "," 拼接.
		 */
		var pool = this.Pow.Pool
		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				if (el.removeEventListener) {
					el.removeEventListener(type, listener, useCapture)
				}
				pool.use(evKey(el), el, t, listener)
			})
		}, this)
		return this
	}

	function fire(type, props) {
		/**
			在每个元素上派发(触发)单个事件.
		 */
		var event, target,
			pow = this.Pow,
			pool = pow.Pool

		if (typeof type !== 'string') {
			props = type, type = type.type
		} else {
			props = props || Object.create(null)
		}

		target = pow.StandardEvents[type]
		event = pow.document.createEvent(target && target.iface || 'CustomEvent')
		target = target && target.target || []

		pow.extend(event, props)
		event.initEvent(type,
			props.bubbles === false ? false : true,
			props.cancelable === false ? false : true
		)

		// ??? stopPropagation, preventDefault
		type = type.toLowerCase()
		this.forEach(function(el) {
			if (el.dispatchEvent) {
				el.dispatchEvent(event)
				return
			}
			props = pool.get(evKey(el), el, type)
			if (props) props.objs.forEach(function(listener) {
				if (listener) listener(event)
			})
		})
		return this
	}

	function evKey(target) {
		// 非 Element 根据目标类型计算 key
		return 'events_' + oString(target)
	}

})(this)
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
            如果有 selectors 调用 querySelector(selectors),
            可以把 first 当作 querySelector 的别名.
            否则返回:
                Pow(this[0])
         */
        if (selectors && this.Pow.isString(selectors))
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
            返回当前集合后代与选择器匹配的第一个元素集合
            selectors 必须为 CSS 选择器字符串.
         */
        var po = PowJS()
        this.some(function(el) {
            if (!el || !el.querySelector) return
            el = el.querySelector(selectors)
            if (el && po.indexOf(el) === -1) {
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
(function(global) {
	"use strict"

	global.Pow.extend(Mapper.prototype,
		put, get, set, use, useOf, size, valid,
		keyOf, valOf, keys, vals,
		indexOf
	)

	global.Pow.Mapper = Mapper
	global.Pow.Pool = Mapper()

	function Mapper() {
		var map

		/**
			返回一个对象映射容器 Mapper, 以两个数组 objs/maps 按下标关联(保存)对象.
			Mapper 提供的方法总是认为调用者要把一个对象和一组对象关联起来,
			因此 objs 数组中的元素值是唯一非 undefined 对象, 相当于 key.
			总是初始化 key 对应的 maps 元素为 Mapper, 除非使用者自主改写它.
			如果 key 是 Mapper 类型由使用者控制, Mapper 只把它当作普通对象.
			注意:
				Mapper 的结构是完全开放的.
				Pow.Pool 是 PowJS 管理的全局对象池.
				使用者应谨慎自主改写值.
		 */
		if (!(this instanceof Mapper)) {
			map = new Mapper()
			map.objs = []
			map.maps = []
			return map
		}
	}

	function keys() {
		/**
			返回 objs 数组副本并过滤无效值.
		 */
		return this.objs.filter(function(v) {
			return v !== undefined
		})
	}

	function vals() {
		/**
			返回 maps 数组副本并过滤无效值 
		 */
		return this.maps.filter(function(v) {
			return v !== undefined
		})
	}

	function indexOf(obj) {
		/**
			返回 obj 在 objs 中的下标, -1 表示不存在.
		 */
		return this.objs.indexOf(obj)
	}

	function keyOf(index) {
		/**
			index 是路径下标, 或者路径下标数组.
			递归返回 objs 数组中 index 所对应的对象.
		 */
		var i, l, map = this

		if (!(index instanceof Array)) {
			index = [index]
		}

		l = index.length - 1

		for (i = 0; i <= l; i++) {
			if (i === l) {
				return map.objs[index[i]]
			}
			map = map.maps[index[i]]
			if (map === undefined) break
		}
	}

	function valOf(index) {
		/**
			index 是路径下标, 或者路径下标数组.
			递归返回 maps 数组中 index 所对应的对象.
		 */
		var i, l, map = this

		if (!(index instanceof Array)) {
			index = [index]
		}

		l = index.length
		if (!l) return

		for (i = 0; i < l; i++) {
			map = map.maps[index[i]]
			if (map === undefined) return
		}

		return map
	}

	function size() {
		/**
			返回 this.objs.length.
		 */
		return this.objs.length
	}

	function valid() {
		/**
			返回 objs 中非 undefined 元素个数
		 */
		var i = 0
		this.objs.forEach(function(k) {
			k !== undefined && i++
		})
		return i
	}

	function set(obj, val) {
		/**
			把关联对象 obj, val 分别保存到 objs, maps 中并返回位置下标.
			set 让使用者自己控制 maps 中的值, 不使用默认的 Mapper.
			obj 不能为 undefined 或者 null.
			val 不能为 undefined.
		 */
		var idx
		if (obj === undefined || val === undefined)
			throw 'Mapper.set: invalid arguments'

		idx = this.objs.indexOf(obj)
		if (idx === -1) {
			// 重用
			idx = this.objs.indexOf(undefined)
			if (idx === -1) {
				// 新建
				idx = this.objs.length
			}
			this.objs[idx] = obj
		}
		this.maps[idx] = val
		return idx
	}

	function put(obj) {
		/**
			变参 obj 为要保存在 objs 数组中, 并生成一个空 Mapper 保存于 maps 中.
			然后递归保存后续参数到 objs 数组中. 返回下标位置组成的数组
		 */
		var i, idx,
			path = [],
			map = this,
			len = arguments.length

		for (i = 0; i < len; i++) {
			obj = arguments[i]
			if (obj === undefined) {
				throw 'Mapper.put: invalid arguments'
			}

			idx = map.objs.indexOf(obj)
			if (idx === -1) {
				// 重用
				idx = map.objs.indexOf(null)
				if (idx === -1) {
					// 新建
					idx = map.objs.length
				}
				map.objs[idx] = obj
			}
			if (map.maps[idx] === undefined) {
				map.maps[idx] = Mapper()
			}
			map = map.maps[idx]
			path.push(idx)
		}
		return path
	}

	function get(obj) {
		/**
			变参函数, 递层返回以 obj 为 key 的值
		 */
		var idx, i, map = this,
			l = arguments.length

		if (!l) return
		for (i = 0; i < l;) {
			obj = arguments[i]
			if (obj === undefined) {
				throw 'Mapper.get: invalid arguments'
			}
			idx = map.objs.indexOf(obj)
			if (idx === -1) return
			map = map.maps[idx]
			i++
		}
		return map
	}

	function use(obj) {
		/**
			变参函数, 递层返回以 obj 为 key 的值, 并回收该位置.
			变参所对应的路径会被清理回收, 如果可回收的话.		
		 */
		var idx, i, idxs = [],
			map = this,
			l = arguments.length

		if (!l) return
		for (i = 0; i < l; i++) {
			obj = arguments[i]
			if (obj === undefined) {
				throw 'Mapper.get: invalid arguments'
			}
			idx = map.objs.indexOf(obj)
			if (idx === -1) return
			idxs.push([map, idx])
			map = map.maps[idx]
		}

		// 及时清理
		while (idxs.length) {
			idx = idxs.pop()
			idx[0].objs[idx[1]] = undefined
			idx[0].maps[idx[1]] = undefined
			if (idx[0].objs.some(function(v) {
					return v !== undefined
				})) break
		}
		return map
	}

	function useOf(index) {
		/**
			index 是路径下标, 或者路径下标数组.
			递归返回 maps 数组中 index 所对应的对象, 并回收该位置.
			整个路径会被清理回收, 如果可回收的话.
		 */
		var i, l, m, maps = [],
			map = this

		if (!(index instanceof Array)) {
			index = [index]
		}

		l = index.length
		if (!l) return

		for (i = 0; i < l; i++) {
			maps.push(map)
			map = map.maps[index[i]]
			if (map === undefined) return
		}

		// 及时清理
		while (maps.length) {
			m = maps.pop()
			i = index.pop()
			m.objs[i] = undefined
			m.maps[i] = undefined
			if (m.objs.some(function(v) {
					return v !== undefined
				})) break
		}
		return map
	}
})(this)
(function(global) {
	"use strict"
	var watcher, pow = global.Pow,
		mrs = document.querySelectorAll('meta[powjs][content][name=onreadystatechange]')

	pow.extend(pow, readyState)

	if (mrs.length) {
		watcher = pow.watch(null, 'readyState')
		pow.any(mrs, function(el) {
			var on = el.getAttribute('content'),
				code = el.getAttribute('powjs')

			watcher.setters.push(function(v) {
				if (v !== on) return
				readyState(code)
			})
		})

		onReadyState()
	} else {
		mrs = false
	}
	
	function onReadyState() {
		// 一定要先 setter 后设置 timer, 防止执行过慢
		var ready = document.readyState
		if (watcher.receiver.readyState !== ready) {
			watcher.receiver.readyState = ready
		}

		if (ready === 'complete')
			mrs === true
		else
			setTimeout(onReadyState, 1) // 不要使用 0
	}

	function readyState(code) {
		/**
			如果未设置 meta readyState 自动执行, 此方法可被手动执行一次.
			code 参数为字符串, 格式为为:
				"templateSource dataSource"
			表示模板源和数据源. 可以使用 CSS 选择器或 URL 路径表示.
			缺省值为 CSS 选择器写法:
				"template x-data"
			表示模板源在 template 元素中, 数据源在 x-data 元素中.
			URL 路径表示:
				"/"  开头表示绝对路径
				"./" 开头表示相对路径
	   */
		if (mrs === true)
			return

		if (mrs === false) {
			mrs = true
		}

		console.log(code || 'PowJS support meta readyState')
	}

})(this)
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
				root   是 htmlSrc 或者 DOM Node, 提取后代.
				filter 节点过滤器 function (node), 返回处理后的节点. 缺省为 Pow.nodeFilter.
			返回值:
				如果 root.childNodes 不是 NodeList 抛出异常.
				如果 root 是 <template xjson> 返回 Pow.ISXJSON
				其他返回数组结构(该结构中称做 Tags)为:
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
			tag.$.index = tags.length // 此节点的序号

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
					val = true
				else if (val === 'false')
					val = false
				else if (val === 'null')
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