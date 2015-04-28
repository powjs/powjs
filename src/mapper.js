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
        var i, l,
            map = this

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
        var i, l,
            map = this

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
        var idx, i,
            map = this,
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
        var idx, i,
            idxs = [],
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
        var i, l, m,
            maps = [],
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