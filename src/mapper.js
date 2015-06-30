(function(global) {
    "use strict"

    global.Pow.extend(Mapper.prototype,
        post
    )

    global.Pow.Mapper = Mapper
    global.Pow.mapper = Mapper()

    function Mapper() {
        var map

        /**
        	返回一个对象映射容器 Mapper, 维护两个数组 objs, maps 并通过下标关联元素.
            objs, maps 中的元素都是唯一的.
        	一个 objs 元素和一个 maps 元素对应, 每个 maps 元素都是一个 Mapper 对象.
            事实上一个 objs 元素对应的关联对象是 maps 中的 objs.
        	Pow.mapper 是缺省的 Mapper 实例.
            由于通过下标进行关联, 如果进行删除, 应该删除同一个下标的 objs, maps 元素.
         */
        if (!(this instanceof Mapper)) {
            map = new Mapper()
            map.objs = []
            map.maps = []
            return map
        }
    }

    function post(x) {
        /**
        	变参函数, 递归关联保存传入的参数. 返回第一个参数保存的下标.
            参数中不能有 undefined 或者 null, 返回 -1 或者中断递归.
         */
        var idx, pow = this.Pow

        if (x == null)
            return -1

        idx = this.objs.indexOf(x)
        if (idx === -1) {
            // 重用
            idx = this.objs.indexOf(undefined)
            if (idx === -1) {
                // 新建
                idx = this.objs.length
            }
            this.objs[idx] = x
        }

        if (arguments.length > 1) {
            x = this.maps[idx] = this.maps[idx] || Mapper()
            x.post.apply(x, pow.slice(arguments, 1))
        }

        return idx
    }

    function getMapper(x) {
        /**
        	返回 x 对应的 Mapper 对象.
         */
        return this.maps[this.objs.indexOf(x)]
    }

    function get(x) {
        /**
            返回 x 对应的 Mapper.objs.
         */
        var map = this.maps[this.objs.indexOf(x)]
        if (map) return map.objs
    }

    function clear(x) {
        /**
            置空 x 对应的 objs, maps 下标元素为 undefined.
         */
        var idx = this.objs.indexOf(x)
        if (idx == -1) return
        this.objs[idx] = this.maps[idx] undefined
    }

})(this)