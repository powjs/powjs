var pow = Pow.New()

module('PowJS')
test("loading", function() {
    ok(pow, 'pow')

    'PowJS,compile,toTags,load'.split(',')
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

test("parameters", function() {
    deepEqual(pow.parameters(), [], 'none arguments')
    deepEqual(pow.parameters(''), [], '""')
    deepEqual(pow.parameters([]), [], '""')
    deepEqual(pow.parameters(',a,a'), ['a'], '[a]')
    deepEqual(pow.parameters(['', 'a,b']), ['a', 'b'], '[a,b]')
    deepEqual(pow.parameters(['', ['a,b', 'c', 'a']]), ['a', 'b', 'c'], '[a,b,c]')
})

test("Promise", function(assert) {
    var p1, p2, done = assert.async(),
        c = []

    // 用 setTimeout 模拟异步, 偶尔会不靠谱
    setTimeout(function() {
        assert.equal(JSON.stringify(c), '[{"a":1,"b":1},1,2,4,3]');
        done()
    }, 400)

    p1 = pow.Promise(function(f, r) {
        var v = {}
        c.push(v)
        setTimeout(function() {
            f(v);
        }, 200)
    }, 1)

    p2 = p1.then(function(v) {
        v.a = 1
        c.push(1)
        return v
    })

    p1.then(function(v) {
        c.push(2);
        return {}
    })

    p2.then(function(v) {
        c.push(3)
        return 3
    })

    p1.then(function(v) {
        v.b = 1;
        c.push(4)
    })

})

module('building & load')
test("building", function(assert) {
    var html = '<div class="well" func="object">\
    <h3>Hello {{object.name}}</h3>\
    <input type="text" />\
    </div>',
        tags = pow.toTags(html)

    equal(pow.oString(tags), 'Array', 'Tags test')
    equal(tags.length, 4, "tags.length")

    tags = pow.build(tags)

    console.log(pow.source(tags))

    equal(
        pow(pow.load(tags)([{
            name: "PowJS"
        }])).html(),
        '<div class="well"><h3>Hello PowJS</h3><input type="text"></div>',
        'html')
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