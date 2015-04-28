(function(global) {
    "use strict"
    var watcher,
        pow = global.Pow,
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