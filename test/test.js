var pow = Pow

module('PowJS')
test("loading", function() {
    ok(pow, 'pow')

    'watch,Chain,PowJS,compile,toTags'.split(',')
        .forEach(function(key) {
            ok(pow[key], 'Pow.' + key)
        })
})

module('base')
test("pick", function() {
    var clone, obj = {
        a: 1,
        b: 2
    }
    deepEqual({
        a: 1
    }, pow.pick(obj, 'a'), 'String')

    deepEqual(obj, pow.pick(obj, ['a', 'b']), '*String')

    deepEqual(obj, clone = pow.pick(obj), 'Clone')

    deepEqual({
        a: 1
    }, pow.pick(obj, {
        a: 'c'
    }), 'Object keys')
})

test("omit", function(assert) {
    var clone, obj = {
        a: 1,
        b: 2
    }

    deepEqual({
        b: 2
    }, pow.omit(obj, 'a'), 'String')

    deepEqual({}, pow.omit(obj, ['a', 'b']), '*String')

    deepEqual({
        b: 2
    }, pow.omit(obj, {
        a: 'c'
    }), 'object')

    deepEqual({}, clone = pow.omit(obj), 'omit all')

    assert.throws(function() {
        pow.omit(obj, 1)
    }, 'throw')
})

test('watcher', function(assert) {
    var w, o, c = 0

    ok(w = pow.watch(null, "name"), 'defined')

    ok(pow.has(w, 'receiver'), 'has receiver')
    ok(w.get && w.set, 'has get and set')
    equal(w.name, 'name', 'named name')
    ok(w.setters && w.setters.length === 0, 'setters is empty')

    equal(w.get.constructor.name, 'watcherGet', 'watcherGet')
    equal(w.set.constructor.name, 'watcherSet', 'watcherSet')


    ok(o = pow.watch(null, "name", function() {}), 'set')

    ok(pow.has(o, 'name'), 'has name')
    equal(Object.keys(o), 0, 'enumerable is false')

    w = Object.getOwnPropertyDescriptor(o, 'name')
    ok(w, 'getOwnPropertyDescriptor')
    equal(w.get.constructor.name, 'watcherGet', 'watcherGet')
    equal(w.set.constructor.name, 'watcherSet', 'watcherSet')

    o = Object.create(null)
    ok(w = pow.watch(o, "name"), 'get watcher')
    ok(w.name === 'name', 'named name')
    ok(w.receiver === o, 'receiver eq origin')
    equal(w.get.constructor.name, 'watcherGet', 'watcherGet')
    equal(w.set.constructor.name, 'watcherSet', 'watcherSet')
    ok(w.setters, 'has setters')
    equal(w.setters.length, 0, 'setters is empty')
    w.setters.push(function() {
        c++
    })

    o.name = 1
    equal(w.value, o.name, 'equal')
    equal(c, o.name, 'counter')
    equal(c, w.get(), 'watcher.get()')
    o.name++
        equal(c, o.name, 'counter again')
})

test('watch setter only', function() {
    var w, c = 0,
        o = Object.create(null)

    Object.defineProperty(o, 'c', {
        configurable: true,
        get: function() {
            return ++c
        }
    })

    equal(o.c, c, 'same')
    equal(c, 1, 'is 1')

    w = pow.watch(o, 'c')
    ok(w && w.setters, 'watcher')

    w.setters.push(function() {
        ++c
    })
    equal(c, 1, 'no changed')
    o.c = 888
    equal(c, 2, 'changed')
    equal(o.c, c, 'must be write fail')
    equal(c, 3, '3')
    w.value = 999
    equal(o.c, 4, '4')
})

module('building')
test("building", function(assert) {
    var html = '<div class="well" func="object">\
    <label>Name:</label>\
    <input type="text" valueTo="object.name" />\
    <h3>Hello {{name}}!</h3></div>',
        chs = pow.Chain(),
        tags = pow.toTags(html)

    equal(pow.oString(tags), 'Array', 'Tags test')
    ok(!tags.some(function(tag) {
        var params
        if (tag.$.parentIndex === -1) {
            params = []
        } else {
            params = this[tag.$.parentIndex]
            params = params[params.length - 1]
            if (typeof params === 'function') {
                params = params()[2]
            } else {
                // 需要递归求 params
                params = []
            }
        }

        tag = pow.compile(tag, params)
        if (pow.isError(tag)) {
            return true
        }
        this.add(tag)
    }, chs), 'compile')

    console.log(chs)
})

module('xjson')

test("xjson", function(assert) {
    var html = '<div array>\
    <div>\
        <param name="id" value="24525592">\
        <h1 name="name">pow.js</h1>\
        <p name="full_name">powjs/pow.js</p>\
        <div name="owner">\
            <p name="login">powjs</p>\
            <img name="avatar_url" src="https://avatars.githubusercontent.com/u/8936527?v=3">\
            <a name="url" href="https://api.github.com/users/powjs"></a>\
        </div>\
    </div></div>',
        ret = [
            [{
                "id": 24525592,
                "name": "pow.js",
                "full_name": "powjs/pow.js",
                "owner": {
                    "login": "powjs",
                    "avatar_url": "https://avatars.githubusercontent.com/u/8936527?v=3",
                    "url": "https://api.github.com/users/powjs"
                }
            }]
        ]

    deepEqual(pow.xjson(html), ret, 'github')
})