(function(global) {
    "use strict"
    global.Pow.directive(
        '',
        bind,
        Break,
        breakIf,
        call,
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
            chainname 是执行函数的命名, 事实上是由整个节点和后代组成.
            细节:
                参数可由外部传入, 或者定义者内部进行赋值.
         */
        var results = code.split(' ')[0]
        code = code.slice(results.length + 1)

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

    function call(chainname, params, code) {
        /**
            call 指令调用 func 指令命名的函数(Pipe).
            格式:
               ow-child-chainname="[,]params1[,paramsN][ code]"
            提取 chainname 对应的 Pipe 对象 __pipe__, 执行 code,然后调用:
                __pipe__.set(this.receiver).invoke(args)
            这里的 args 是 paramsN 与 params 合并(如果首字符为",")的结果.
         */
        var args = code.split(' ')[0]
        code = code.slice(args.length)

        params += ',' + args

        if (args[0] == ',') {
            args = params
        }

        args = ('__,' + args).split(',').map(nameTrim).filter(nameIfy).join(',')

        code = 'var __pipe__=this.Pow.getChain("' + chainname + '");\n' + code + ';\n' +
        '__pipe__.set(this.receiver).invoke([' + args + '])'

        return this.func(params, code)
    }

    function Var(cfg, params, code) {
        /**
            var 指令格式与 func 指令格式一致, 只是不产生可被调用的函数.
         */
        var results = code.split(' ')[0]
        code = code.slice(results.length + 1)

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
        var results,
            names = ''

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
            三种格式:
                "object.propName"
                "object 'propName'"
                "object"
            第二种格式 'propName'事实上是属性名求值表达式.
            第三种格式提取 Pow(__).attr('name') 为属性名
            提示:
                value 指令和 bind 指令配合使用, 可实现表单元素数据绑定.
         */

        var object = code.split(' ', 1)[0]

        if (!object) {
            return Error('invalided code value=' + JSON.stringify(code))
        }

        cfg = code.slice(object.length + 1) // propName

        if (!cfg) {
            if (object.indexOf('.') === -1) {
                cfg = 'var __pow__=this.Pow;'
                code = object + '[__pow__(this).attr("name")]=this.value'
            } else {
                code = object + '=this.value'
            }
        } else {
            // __k__ 保证表达式只被计算一次
            cfg = 'var __k__=' + cfg + ';'
            code = object + '[__k__]=this.value'
        }

        return this.func(params,
            cfg + 'this.Pow(__).on("change",function(){' + code + '})',
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