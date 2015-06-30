(function(global) {
    "use strict"
    global.Pow.extend(global.Pow.Config, {
        delimiterLeft: '{{',
        delimiterRight: '}}'
    })

    global.Pow.extend(global.Pow,
        build, compile, express, func, source
    )

    function build(tags) {
        /**
            遍历 tags 元素, 根据 tag 间的关系调用 Pow.compile 并传递参数.
            参数:
                tags     数组 [tag ...],  及 Pow.toTags 的结果.
            返回:
                数组 [[tag, function ...] ...], 每个元素都是 Pow.compile 结果.
                为方便起见, 该结果在 PowJS 中称作 xTags.
        */
        var queue, params = [],
            all = [],
            results = []
        if (typeof tags == 'string') {
            tags = this.toTags(tags)
        }
        return tags.some(function(tag, i) {
            // 上级的返回参数和下级的参数一致, 顶级无参数
            params = all[tag.parentIndex]
            queue = this.compile(tag, params)
            if (queue instanceof Error) {
                return true
            }

            results.push(queue)

            // 缓存返回的参数, 如果没有函数, 参数不会发生变化.
            all[i] = queue.length === 1 ? params : queue[queue.length - 1]()[0];
        }, this) && queue || results
    }

    function compile(tag, params) {
        /**
            编译 tag 中的指令.
            参数:
                tag    一个 PowJS 标签对象.
                params 字符串数组, 参数名列表.
            返回:
                函数数组 [tag, function ...]
            细节:
                过程中产生的错误会被 throw.
                指令编译函数返回类型影响:
                    undefined 忽略
                    Function  push 进结果中.
                    String    属性字面值
                    Error     终止编译, 返回错误
                    其它      终止编译, 返回未预期错误
         */
        var clone, pow = this,
            cfg = pow.Config,
            dirs = pow.Directives,
            keys = [],
            results = []

        if (!tag || tag instanceof Error) return tag
        clone = pow.pick(tag, 'index,parentIndex')
        clone.attrs = Object.create(null)
        params = pow.parameters(params)
        results.push(clone)

        pow.any(tag.attrs, function(text, key) {
            var cc, config, code

            // 匹配编译指令, 位置只有两种情况
            // dirs 或者 dirs[prefix], 贪心匹配
            // nodeName 的值也被当做指令进行匹配

            if (!results.length) {
                if (key != 'nodeName')
                    throw Error('compile: first key of tag must be nodeName: ' + key)
                config = text.toLowerCase()
            } else {
                config = key.toLowerCase()
            }

            // 指令前缀只能有一级
            code = config.length
            while (code != -1) {
                cc = dirs[config.slice(0, code)]
                if (cc) break
                code = config.lastIndexOf('-', code)
            }

            if (pow.isFunction(cc)) {
                code = cc.call(pow, config.slice(code + 1), params, key == 'nodeName' ? '' : text)
            } else if (key == 'nodeName') {
                // nodeName 没有对应的函数
                code = text
            } else {
                // 求值表达式
                code = pow.express(key, params, text)
            }

            switch (pow.oString(code)) {
                case 'String':
                    // 字面值
                    clone.attrs[key] = code
                    return
                case 'Function':
                    params = code()[0]
                    results.push(code)

                    // 有 nodeName 处理函数, 加入标记
                    if (key == 'nodeName') {
                        clone.nodeNameDI = true
                    }
                    break
                case 'Undefined':
                    return
                case 'Error':
                    throw code
                default:
                    throw Error('compile: unexpected ' + pow.oString(code))
            }
        })

        return results
    }

    function express(propName, params, text) {
        /**
            express 把属性求值表达式函数化. express 格式符合指令编译器.
            工作期:
                tag           非 textBinding 时直接赋值
                node          用于初始化 Node 属性.
                owTextChanged 事件触发用于绑定更新.
            参数:
                propName 对求值结果进行 Pow(this.node).attr(propName,value)
            返回:
                String   text 不是表达式, 原值返回 text.
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
            throw Error('unclosed expression: ' + JSON.stringify(code))
        }

        code = code.join('+')

        // 非 textBinding 只工作于 tag, 直接赋值
        if (!bind) {
            // return this.func(params, '__.' + propName + '=' + code)
        }

        if (propName == 'textContent')
            return this.func(params, 'this.node.textContent=' + code)

        // 设置属性
        return this.func(params,
            'this.Pow(this.node).attr(' + JSON.stringify(propName) + ',' + code + ')'
        )
    }

    function func(params, code, results, name) {
        /**
            生成符合 PowJS 内部机制的指令执行函数.
            参数:
                params  Array/String 输入参数名数组.
                code    执行体代码.
                results 输出参数名数组, 缺省等于 params.
                name    给函数命名.
            返回:
                Error | 符合 PowJS 内部机制的函数对象.
            提示:
                调用者可在 code 中自己控制输出, 请参阅源码了解细节.
                保存功能由其他方法实现, 这里只是存储此参数.
                无参数调用返回的函数可返回:
                    [params,results,name]
                其中 params,results 都是字符串数组.
        */
        params = this.parameters(params)

        if (results == null) {
            results = params.slice(0)
        } else {
            results = this.parameters(results)
        }

        // 保存 [results,name]
        name = name ? [results, name] : [results]

        code = 'if(!arguments.length) return ' + JSON.stringify(name) + ";\n" +
            (code && code + ';\n' || '') +
            (results.length ? ('return [' + results.join(',') + ']') : '')

        try {
            code = Function(params.join(','), code)
        } catch (err) {
            return err
        }

        return code
    }

    function source(tags) {
        /**
            转换 build 结果 tags 为 JavaScript 源码.
         */
        var space = '    ',
            indent = '\n' + space + space,
            str = '['

        tags.forEach(function(items, i) {
            str += (i && ',' || '') + '\n' + space + '['
            items.forEach(function(item, i) {
                if (i) {
                    str += ','
                }
                if (typeof item === 'function') {
                    i = item.toString()
                        .replace(/^function[^\(]*/, 'function ')
                        .split('\n').join(indent)
                } else {
                    i = JSON.stringify(item)
                }
                str += indent + i
            })
            str += '\n' + space + "]"
        })
        return str + '\n' + ']'
    }

})(this)