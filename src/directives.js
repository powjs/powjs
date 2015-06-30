(function(global) {
    "use strict"
    global.Pow.directive(
        fragment,
        func,
        If,
        on,
        repeat,
        run,
        forgo,
        Var,
        xjson
    )

    function func(funcName, params, code) {
        /**
            func 定义一个函数.
            格式:
                func[-funcName]="[,][p1[,p2[,pn]]] body"
            这对应原生 Function(p1, p2, … , pn, body).
            用例:
                func=""
                func="newParams"
                func=" code()" // 无参数要保留前导空格
                func=",x,y x=x||1;y=y||2"
                func-my-nodes="newParams code()"

            参数名以 "," 开头表示在现有参数后增加新参数. 所有参数向下传递.
         */
        var results = code.split(' ')[0]
        code = code.slice(results.length + 1)

        if (results[0] == ',') {
            params = results = [params, results]
        } else {
            params = results
        }

        // 需要在运行期保存
        return this.func(params, code, results || null, funcName)
    }

    function Var(names, params, code) {
        /**
            var 定义向后传递的参数.
            格式:
                var-v1[-vN]="initCode"
            语义:
                var v1,vN; initCode;
            示例:
                var-a="a=init()"   // 抛弃以前的参数, 返回参数只有 'a'
                var--a="a=init()"  // 保留以前的参数, 返回参数加入 'a'
                var-a="init()"     // 只有一个变量时, 补全 initCode "a=init()"
                var--a="init()"    // 补全 initCode "a=init()"
         */
        names = names.split('-')
        if (!names[0] && names.length == 2 || names.length == 1) {
            code = (name[0] || names[1]) + '=' + code
        }

        return func.call(this, '', params, names.join(',') + ' ' + code)
    }

    function run(_, params, code) {
        /**
            执行 javascript 代码.
            格式:
                run="code"
            语义:
                code
         */
        return this.func('', params, code)
    }

    function If(obj, params, express) {
        /**
            条件语句. 当表达式成立时, 执行同节点后续指令, 否则忽略同节点后续指令.
            格式:
                if="express"
                if-obj="code"
            语义:
                if (!express) return;
                if (!obj) return;
                code

            第一种格式:
                
            第二种格式:
                当后缀表示的变量对象为真时, 执行 code. 缺省 code 为 forgo("this").
         */

        return obj ?
            this.func(params, 'if (!(' + obj + ')) return;\n' + code) :
            this.func(params, 'if (!(' + express + ')) return;')
    }

    function forgo(range, params, express) {
        /**
            丢弃指定范围的节点:
            格式:
                forgo-someThings="express"
            语义:
                if(express)
                    forgo(someThings)

            缺省 express 为 'true'
            用例:
                forgo                 // 立即丢弃当前节点及子孙节点
                forgo-this            // 立即丢弃当前节点及子孙节点
                forgo-childNodes      // 标记丢弃子孙节点
                forgo-nextSiblings    // 标记丢弃后续兄弟节点
                forgo-others          // 标记保留当前节点及子孙节点, 丢弃其它后续节点
                forgo="express"       // 当 express 成立时立即丢弃当前节点及子孙节点,

            范围 this, childNodes, nextSiblings, others 可以组合且顺序无关.
            忽略不能识别的范围后缀, 您也许喜欢下面更具可读性的写法.
                forgo-childNodes-if="express"
         */

        range = range || 'this'

        range = this.parameters(range.split('-')).join(',')

        return this.func(params,
            'if (' + (express || 'true') + ')' + 'return "' + range + '";'
        )
    }

    function repeat(x, params, code) {
        /**
            遍历对象, 重复执行当前节点.
            格式:
                repeat-x-[val[-key]]="code"
            语义:
                forEach(x, function([val],[key]){
                    code
                })
            用例:
                repeat-x            // 等价
                repeat-x-val-key    // function(val, key)
                repeat-x--key       // function(key)
                repeat-x-val-       // function(val)
                repeat-x--          // function()
                repeat--x           // 保持传递原参数
            x 在执行期必定是个可访问对象.
            val 和 key 会向后传递, 如果不抛弃的话.
         */
        var results, names = x.split('-'),
            keep

        if (names[0] == '') {
            keep = true
            names = names.slice(1)
        }

        if (!names.length)
            throw Error('repeat: invalid suffix: ' + x)

        x = names[0]
        names = names.slice(1)

        results = keep && [params] || []

        keep = this.parameters(names).join(',') || 'val,key'

        results.push(keep)

        results = this.parameters(results)

        code = 'var __ship=this.ownership();\n' +
            'this.Pow.any(' + x + ', function(' + keep + ') {\n' +
            code + ';\n' +
            '__ship(' + results.join(',') + ')\n}, null, ' +
            (!names[0] && names.length == 2) + ')\nreturn "this"'

        return this.func(params, code, results)
    }

    function fragment(_, params) {
        /**
            fragment 为标签指令, 表示该节点是透明的, 子孙被上提. 示例:

                <fragment something>Hi <b>Girl</b></fragment>

            子孙 "Hi <b>Girl</b>" 被上提, 而 fragment 本身是透明的.
         */
        return this.func(params, 'this.attrs.nodeName="#document-fragment";')
    }

    function xjson(_, params, varName) {
        /**
            提供模板支持 xjson, 保存转换后的 js 对象到 Pow.Pool.
            该指令总是丢弃当前节点.
            格式:
                xjson="varName"
            语义:
                Pow.Pool.put('varName', Pow.xjson(this.node));
                forgo("this")
            提示:
                通常可以找到比在模板中使用 xjson 更好的方法.
         */

        varName = 'this.Pow.Pool.put(' + varName + ',this.Pow.xjson(this.node));' +
            ';return "this"'

        return this.func([], varName)
    }


    function on(typeName, params, code) {
        /**
            绑定当前节点事件.
            格式:
                on-eventType="code"
                on-eventType-eventName="code"
            对应代码:
                Pow(this.node).on("type", function(eName){
                    code
                })
            缺省 eventType 为 click, eventName 为 event
            on="code" 等价 on-click-event="code"
         */
        typeName = typeName.split('-')

        code = 'this.Pow(this.node).on("' + (typeName[0] || 'click') +
            '",function(' + typeName[1] || 'event' + '){' + code + '})'

        return this.func(params, code)
    }

})(this)