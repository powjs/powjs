(function(global) {
    "use strict"
    global.Pow.extend(global.Pow.Config, {
        delimiterLeft: '{{',
        delimiterRight: '}}'
    })

    global.Pow.extend(global.Pow,
        compile, compileTag, express, func
    )

    function compile(tags, receiver) {
        /**
            调用 compileTag 编译 tags.
            compile 主要负责计算 compileTag 的 params 参数.
            参数:
                Tags     完整的 Tag 数组, 意味着第一个元素执行时不需要参数.
                receiver Pipe 中的 receiver 参数, 如果有返回值为 Pipe 对象.
            返回:
                错误或者编译后的队列数组或者 Pipe 对象, 每个元素都是一个 queue.
        */
        var queue, params,
            all = [],
            result = receiver ? this.Pipe().setReceiver(receiver) : []

        for (var i = 0; i < tags.length; i++) {
            // 先编译, 上级的返回参数和下级的参数一致, 顶级不需要参数即 []
            params = all[tags[i].$.parentIndex] || []
            queue = this.compileTag(tags[i], params)
            if (queue instanceof Error) {
                return queue
            }
            // 缓存返回的参数, 如果没有函数参数不会发生变化.
            all[i] = queue.length === 1 ? params : queue[queue.length - 1]()[2];
            result.push(queue)
        }

        return result
    }

    function compileTag(tag, params) {
        /**
            调用指令编译函数编译一个 tag, 指令编译函数执行时 this 对象为 Pow.
            参数:
                tag    完整标签对象, 即 Tags 的一个元素.
                params 字符串数组, 参数名列表.
            返回:
                错误或者称作队列(queue)的数组, 第一元素由 tag 固定值组成的对象, 后续元素为指令编译后的函数.
                第一元素属性中的 $ 数组
                    [index, parentIndex, params]
            细节:
                指令编译函数返回类型影响:
                    undefined 忽略
                    Function  push 进结果中.
                    String    属性字面值
                    Error     终止编译, 返回错误
                    其它      终止编译, 返回未预期错误
                参数继承:
                    初始 params 可能继承自上级节点, 此时应剔除第一参数名 "__".
                    当 tag 包含指令时, 会产生新的参数, 此时应添加第一参数名 "__".
                    返回值的第一元素事实上无需考虑参数影响.
                    所以使用者应该总是置 params 第一参数名为 "__", 这样可以简化代码.
         */
        var err,
            cfg = this.Config,
            dirs = this.Directives,
            keys = [],
            clone = Object.create(null),
            result = [clone]

        if (tag instanceof Error) return tag
        clone.$ = [tag.$.index, tag.$.parentIndex, params.slice()]
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
                    result.push(code)
                break
                default:
                    return Error('compile: unexpected ' + this.oString(code))
            }
        }, this)

        if (err) return err
        return result
    }

    function express(propName, params, text) {
        /**
            express 把属性求值表达式函数化. express 格式符合指令编译器.
            工作期:
                tag           非 textBinding 时直接赋值
                node          用于初始化 Node 属性.
                owTextChanged 事件触发用于绑定更新.
            参数:
                propName 对求值结果进行 Pow(__).attr(propName,value)
            返回:
                String   text 不是表达式, 原值返回 text.
                Error    非法表达式
                Function 编译后的属性设置函数
        */
        var a, code,
            bind = '',
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
                if (a[1])
                    bind = true
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
                params  输入参数名数组.
                code    执行体代码.
                results 输出参数名数组, 缺省等于 params.
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
        params = ('__,' + (params || '')).split(',')
        params = params.map(nameTrim).filter(nameIfy)

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
        } catch (err) {
            return err
        }

        return code
    }

})(this)