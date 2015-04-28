(function(global) {
    "use strict"
    var LOOP = global.Pow.LOOP,
        BREAK = global.Pow.BREAK,
        SPACE = '    '

    global.Pow.Chain = Chain
    Chain.prototype = new Array()
    global.Pow.extend(Chain.prototype, set, invoke, source, add)

    function Chain(item, receiver) {
        /**
            返回一个 Chain 对象实例, 专为 PowJS 设计的有序调用行为.
            参数:
                item     参见 add 方法.
                receiver 参见 set 方法.
            Chain 对象属性:
                Pow      当前的 Pow 对象.
                receiver receiver
                set      function(receiver) 设置 receiver, 返回 this.
                cursor   当前调用在 Chain 中的序号.
                result   必要时函数主动通过 cursor 和 result 返回值, 比如: 异步, repeate.
                invoke   负责链式调用. 
                setter   包装 invoke 后成为 this.result 的 setter.
            receiver 对象属性:
                result   链式调用最终结果, 这是个数组化的返回值.
            函数返回值:
                函数除了直接返回值外, 还有有两种方式返回:
                    this.result = [somevalues] // setter 会自动恢复 cursor.
                    this.receiver.result = [somevalues]
                this 为 Chain 对象实例. 第一种会继续执行后续调用链, 第二种直接返回终值.
                如果采用这两种方式, 那么通常直接 return, 不含返回值.
         */
        var inst
        if (item instanceof Error)
            throw item
        if (this instanceof Chain) {
            return
        }

        inst = new this.Chain()
        inst.Pow = this
        inst.cursor = 0
        item && inst.add(item)
        receiver && inst.set(receiver)
        inst.setter = setter()
        return this.watch(inst, 'result', inst.setter)
    }

    function setter() {
        // ???需要每个 setter 都是独立的么
        return function(args) {
            var cursor = this.cursor
            this.invoke(args)
            this.cursor = cursor
        }
    }

    function set(receiver) {
        /**
            设定 Chain 调用链结束时, 执行结果被赋予 receiver.result.
            现实中多个 Chain 使用一个 receiver 可共享结果.
         */
        this.receiver = receiver
        return this
    }

    function add(item) {
        /**
            向 Chain 对象中添加元素.
            item 可以是 Object, Function, Chain 或三种类型组成的数组, 否则抛出异常.
            如果 item 是数组, 生成新的 Pow.Chain(item)
         */
        var type, ch
        if (item instanceof Error)
            throw item

        if (item instanceof Chain) {
            this.push(item)
            return this
        }

        if (item instanceof Array) {
            ch = this.Pow.Chain()
            item.forEach(function(item) {
                ch.add(item)
            })
            this.add(ch)
            return this
        }

        type = this.Pow.oString(item)
        if (type === 'Function' || type === 'Object') {
            this.push(item)
            return
        } else {
            throw 'Chain: unexpected ' + type
        }
        return this
    }

    function invoke(args) {
        /**
            invoke 方法顺序调用 Chain 中元素, 无返回值.
            参数 args 是个数组, 表示执行时传入的参数, args 被这样处理:
                args = arguments.length && Pow.toArray(args) || []
            元素为 Chain 时:
                item.set(receiver).invoke(args)
                continue
            元素为函数时:
                val = item.apply(this, args)
                依据 val 类型确定行为:
                undefined  cursor=0; return
                Error      cursor=0; receiver.result=val; return
                BREAK      cursor=0; receiver.result=val; return
                other      args=Pow.toArray(val);continue
            元素为其它类型时:
                args = [item].concat(args)
            其他类型均作为预置参数:

            正常完成调用链:
                cursor=0, receiver.result=args.
            所有调用链使用同一个 receiver, 监视 receiver.result 变化可得到所有结果.
         */
        var it,
            pow = this.Pow

        if (args === pow.BREAK || args instanceof Error) {
            this.cursor = 0
            this.receiver.result = args
            return
        }

        args = arguments.length && Pow.toArray(args) || []

        while (this.cursor < this.length) {
            it = this[this.cursor]

            // Chain 调用
            if (it instanceof Chain) {
                it.set(this.receiver).invoke(args)
                this.cursor++;
                continue
            }

            if (typeof it !== 'function') {
                // 在 PowJS 中, it 就是 tag 参数 '__'
                args = [it].concat(args)
                this.cursor++;
                continue
            }

            it = it.apply(this, args)

            if (it === undefined) {
                this.cursor = 0
                return
            }

            if (it === pow.BREAK || it instanceof Error) {
                args = it
                break
            }

            args = pow.toArray(it)
            this.cursor++
        }
        this.cursor = 0
        this.receiver.result = args
    }

    function source() {
        /**
            转换队列为 JavaScript 源码.
         */
        var deep = arguments[0] || 0,
            space = SPACE.repeat(deep),
            indent = '\n' + space + space,
            str = space + '['

        this.forEach(function(item, i) {
            str += (i ? ',\n' : '\n')
            if (item instanceof Chain) {
                str += item.source(deep + 1)
                return
            }
            if (typeof item === 'function') {
                i = item.toString()
                    .replace(/^function .*\(/, 'function (')
                    .replace('\n/**/', '')
                    .split('\n').slice(0, -1).join(indent + space) + indent + '}'
            } else if (typeof item === 'object') {
                i = JSON.stringify(item)
            } else {
                i = String(i)
            }
            str += space + space + i
        })
        return str + '\n' + space + ']'
    }
})(this)