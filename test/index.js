let test = require('tape'),
	JSDOM = require('jsdom').JSDOM,
	PowJS = require('../powjs.js'),
	prettier = require("prettier"),
	win = new JSDOM('<!doctype html><html><head></head><body></body></html>').window;

global.document = win.document;
global.Node = win.Node;
global.HTMLElement = win.HTMLElement;

function format(code, ret) {
	if (typeof code != 'string')
		code = '!' + JSON.stringify(code);
	code = prettier.format(code, { semi: true });
	if (ret) return code;
	console.log(code);
}

let cases = [
	{
		src: '<b class="class" style="color:#333 " param="a,b,c">{{JSON.stringify(this.slice(arguments))}}</b>',
		args: ['e', 'f', 'g'],
		html: '<b class="class" style="color:#333">["e","f","g"]</b>',
	}, {
		src: '<b param="a,b,c">{{a}} {{b}} {{c}} {{a+b+c}}<i>{{a}}</i></b>',
		args: [1, 2, 3],
		html: '<b>1 2 3 6<i>1</i></b>',
	}, {
		src: '<input/>',
		args: [],
		html: '<input>',
	}, {
		each: true,
		src: '<b param="o" end><i>{{o}}</i></b>never',
		args: [1, 2],
		html: '<b><i>1</i><i>2</i></b>',
	}, {
		each: true,
		src: '<b param="o" end><i if="o<2">{{o}}</i></b>never',
		args: [1, 2],
		html: '<b><i>1</i></b>',
	}, {
		each: true,
		src: '<b param="o" break><i if="o<2">{{o}}</i></b>never',
		args: [1, 2],
		html: '<b><i>1</i></b>',
	}, {
		src: '<p><a skip>a</a></p>',
		args: [],
		html: '<p><a></a></p>'
	}, {
		src: ' <p><a if> a </a></p>',
		args: [],
		html: '<p></p>'
	}, {
		opts: { prefix: 'pow-' },
		src: '<b pow-param="a,b,c">{{a}} {{b}} {{c}} {{a+b+c}}<i>{{a}}</i></b>',
		args: [1, 2, 3],
		html: '<b>1 2 3 6<i>1</i></b>',
	}, {
		opts: { prefix: 'pow-' },
		src: '<p><b pow-end>b</b>i</p>',
		args: [],
		html: '<p><b>b</b></p>'
	}, {
		src: '<p end><b>b</b>i</p>',
		args: [],
		html: '<p><b>b</b>i</p>'
	}, {
		src: '<p><b><i end>i</i>k</b>j</p>',
		args: [],
		html: '<p><b><i>i</i></b></p>'
	}, {
		src: '<p break><b>b</b>i</p>',
		args: [],
		html: '<p><b>b</b>i</p>'
	}, {
		src: '<p><b><i break>here</i>never</b>here</p>',
		args: [],
		html: '<p><b><i>here</i></b>here</p>'
	}, {
		opts: { prefix: 'pow-', end: true, error: 'error' },
		src: '<p pow-if><b>b</b></p>',
		args: [],
		html: ''
	}, {
		src: '<ul each="v"><li break>{{k}}{{v}}</li>never</ul>',
		args: [['1', '2']],
		html: '<ul><li>01</li><li>12</li></ul>'
	}, {
		src: '<ul param="o" each="o"><li>{{v}}</li></ul>',
		args: [[1, 2]],
		html: '<ul><li>1</li><li>2</li></ul>'
	}, {
		src: '{{v}}\n{{k}}',
		args: [1, 2, 3, 4],
		html: "1\n2"
	}, {
		src: '<div><b if="v.b">b<i if="!v.i">i</i></b></div>',
		args: [{ b: 1 }],
		html: "<div><b>b<i>i</i></b></div>"
	}, {
		src: '<div><b if="!v.id"><i></i></b><b if="v.id"><i>id</i></b></div>',
		args: [{ id: 1 }],
		html: "<div><b><i>id</i></b></div>"
	}, {
		src: `<div text="'text'"><b>html</b></div>`,
		args: [],
		html: "<div>text</div>"
	}, {
		src: '<ul let="a=k" each="v,a"><li>{{a}}{{k}}{{v}}</li></ul>',
		args: [[1, 2], 'a'],
		html: '<ul><li>a01</li><li>a12</li></ul>'
	}, {
		src: '<ul render="k,v"><li>{{k}}{{v}}</li></ul>',
		args: ['1', '2'],
		html: '<ul><li>21</li></ul>'
	}, {
		src: '<b class="{{v}}">{{k}}</b>',
		args: ['1', '2'],
		html: '<b class="1">2</b>'
	}, {
		src: '<p><b if="v" end class="{{v}}"><i>{{k}}</i></b><b>never</b></p>',
		args: ['1', '2'],
		html: '<p><b class="1"><i>2</i></b></p>'
	}
];

test("PowJS", function(assert) {
	for (var i = 0; i < (0 || cases.length); i++) {
		let t = cases[i],
			pow = PowJS(t.src, t.opts);
		t.export && format(pow.export());
		if (t.each) {
			pow.each(t.args);
		} else {
			pow.render(...t.args);
		}
		assert.equal(pow.parent.innerHTML, t.html, i + ': ' + t.src);
	}
	assert.end();
});
