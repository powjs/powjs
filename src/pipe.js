(function(global) {
    "use strict"
    var LOOP = global.Pow.LOOP,
        BREAK = global.Pow.BREAK,
        SPACE = '    '

    global.Pow.invoke = Pipe
    Pipe.prototype = new Array()
    global.Pow.extend(Pipe.prototype, setter, setReceiver, invoke, source)

    function Pipe() {
        /**
            返回一个 Pipe 对象, 是对 compile 结果的包装, 实现 queue 执行.
            基于数组原型扩展属性/方法:
                Pow         当前的 Pow 对象.
                cursor      当前执行的 queue 在 Pipe 中的序号.
                receiver    管道返回值接收对象, 返回值赋予 receiver.result.
                result      必要时函数主动通过 cursor 和 result 返回值, 比如: 异步, repeate.
                invoke      负责管道调用. 
                setReceiver function(receiver) 设置 receiver, 返回 this.
                setter      包装 invoke 后成为 this.result 的 setter.
            函数返回值:
                函数除了直接返回值外, 还有有两种方式返回:
                    this.result = [somevalues] // setter 会自动恢复 cursor.
                    this.receiver.result = [somevalues]
                this 为 Pipe 对象实例. 第一种会继续执行后续调用链, 第二种直接返回终值.
                如果采用这两种方式, 那么通常直接 return, 不含返回值.
         */
        var inst
        if (this instanceof Pipe) {
            return
        }
        inst = new this.Pipe()
        inst.Pow = this
        inst.cursor = 0
        return this.watch(inst, 'result', inst.setter)
    }

    function setter(args) {
        var cursor = this.cursor
        this.invoke(args)
        this.cursor = cursor
    }

    function setReceiver(receiver) {
        /**
            设定 Pipe 调用链结束时, 执行结果被赋予 receiver.result.
            现实中多个 Pipe 使用一个 receiver 可共享结果.
         */
        this.receiver = receiver
        return this
    }

    function invoke(seed) {
        /**
            invoke 方法是 Pipe 执行入口.
            参数:
                seed 种子参数, 这是个数组.
            元素为 Pipe 时:
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

        args = args || []
        args[0] = pow.omit(this[0], '$')

        this.cursor = 1
        while (this.cursor < this.length) {
            it = this[this.cursor]

            // Pipe 调用
            if (it instanceof Pipe) {
                it.set(this.receiver).invoke(args)
                this.cursor++;
                continue
            }

            args = it.apply(this, args)

            if (args === undefined) {
                this.cursor = 0
                return
            }

            if (args === pow.BREAK || args instanceof Error) {
                break
            }

            this.cursor++
        }
        this.cursor = 0
        this.receiver.result = args
    }

    function source() {
        /**
            返回管道中所有元素的原代码.
         */
        var deep = arguments[0] || 0,
            space = SPACE.repeat(deep),
            indent = '\n' + space + space,
            str = space + '['

        this.forEach(function(item, i) {
            str += (i ? ',\n' : '\n')
            if (item instanceof Pipe) {
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