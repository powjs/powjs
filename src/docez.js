(function(pow) {
    "use strict"
    var EZ = /^function .+\((.*)\)\s*{\s*\/\*+([\S\s]*)\*+\//,
        isMini = !docez.toString().match(EZ)

    pow.docez = docez

    function docez(x) {
        /**
            返回 PowJS API 文档数据.
         */
        var comment, space,
            api = Object.create(null),
            object = Object.create(null),
            property = Object.create(null),
            method = Object.create(null),
            proto = Object.create(null)

        x = x || this
        Object.keys(x).sort().forEach(function(name, val) {
            val = x[name]
            switch (typeof val) {
                case 'function':
                    comment = (val.toString().match(EZ) || '')[2] || name
                    space = (comment.match(/[\t ]+/) || [''])[0].length
                    comment = comment.split("\n").map(function(line) {
                        return line.slice(space) || "\n"
                    })
                    method[name] = comment.join("\n").trim()

                    if (val.prototype && Object.keys(val.prototype).length) {
                        proto[name] = docez(val.prototype).method
                    }
                    break
                case 'object':
                    object[name] = docez(val)
                    break
                case 'string':
                case 'number':
                case 'boolean':
                    property[name] = val
                    break
                default:
                    property[name] = name + ' is an ' + Object.prototype.toString.call(val)
            }
        })

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

})(this.Pow || this)