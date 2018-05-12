/* jshint esversion: 6 */

if (typeof PowJS === 'undefined') {
  // For Jasmine without Karma
  PowJS = require('../powjs.js');
  JSDOM = require('jsdom').JSDOM;
  prettier = require('prettier');
  window = new JSDOM('<!doctype html><html><body></body></html>').window;
  document = window.document;
  Node = window.Node;
  HTMLElement = window.HTMLElement;
}

function format(code, ret) {
  if (typeof code != 'string')
    code = JSON.stringify(code, null, '  ');
  if (typeof prettier !== 'undefined')
    code = prettier.format(code, {semi: true});
  if (ret) return code;
  console.log('\n' + code);
}

function real(selector) {
  return document.body.querySelectorAll(selector);
}

let cases = [
  {
    src: '<b>{{v}}</b>',
    args: [1],
    html: '<b>1</b>',
  }, {
    src: '<b><i>{{v+k}}</i></b>',
    args: [1,2],
    html: '<b><i>3</i></b>',
  }, {
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
    src: '<b><i>{{v}}</i></b>',
    args: [1, 2],
    html: '<b><i>1</i></b><b><i>2</i></b>',
  }, {
    each: true,
    src: '<b param="o" end><i if="o<2">{{o}}</i></b>never',
    args: [1, 2],
    html: '<b></b>',
  }, {
    each: true,
    src: '<b param="o" break><i>{{o}}</i></b>never',
    args: [1, 2],
    html: '<b><i>1</i></b><b><i>2</i></b>',
  }, {
    src: '<p><a skip>a</a></p>',
    args: [],
    html: '<p><a></a></p>'
  }, {
    src: ' <p><a if="0"> a </a></p>',
    args: [],
    html: '<p></p>'
  }, {
    opts: 'pow-',
    src: '<b pow-param="a,b,c">{{a}} {{b}} {{c}} {{a+b+c}}<i>{{a}}</i></b>',
    args: [1, 2, 3],
    html: '<b>1 2 3 6<i>1</i></b>',
  }, {
    opts: 'pow-',
    src: '<p><b pow-end>never</b>never</p>',
    args: [],
    html: '<p><b></b></p>'
  }, {
    src: '<p><b><i end>never</i>never</b>never</p>never',
    args: [],
    html: '<p><b><i></i></b></p>'
  }, {
    src: '<p break><b>b</b>i</p>',
    args: [],
    html: '<p><b>b</b>i</p>'
  }, {
    src: '<p><b><i break>here</i>never</b>here</p>',
    args: [],
    html: '<p><b><i>here</i></b>here</p>'
  }, {
    src: '<ul each="v"><li break>{{k}}{{v}}</li>never</ul>',
    args: [['1', '2']],
    html: '<ul><li>01</li><li>12</li></ul>'
  }, {
    src: '<ul param="o" each="o"><li>{{o}}</li></ul>',
    args: [[1, 2]],
    html: '<ul><li>1</li><li>2</li></ul>'
  }, {
    src: '{{v}}\n{{k}}',
    args: [1, 2, 3, 4],
    html: '1\n2'
  }, {
    src: '<div><b if="v.b">b<i if="!v.i" break>i</i>never</b></div>',
    args: [{b: 1}],
    html: '<div><b>b<i>i</i></b></div>'
  }, {
    src: '<div><b if="!v.id"><i></i></b><b if="v.id"><i>id</i></b></div>',
    args: [{id: 1}],
    html: '<div><b><i>id</i></b></div>'
  }, {
    src: `<div text="'text'"><b>html</b></div>`,
    args: [],
    html: '<div>text</div>'
  }, {
    src: '<ul let="a=k" each="v,a"><li param="a,v,k">{{a}}{{k}}{{v}}</li></ul>',
    args: [[1, 2], 'a'],
    html: '<ul><li>a01</li><li>a12</li></ul>'
  }, {
    src: '<ul render="k,v"><li>{{k}}{{v}}</li></ul>',
    args: [1, 2],
    html: '<ul><li>12</li></ul>'
  }, {
    src: '<b class="{{v}}">{{k}}</b>',
    args: [1, 2],
    html: '<b class="1">2</b>'
  }, {
    src: '<p><b if="v" end class="{{v}}"><i>{{k}}</i></b><b>never</b></p>',
    args: ['1', '2'],
    html: '<p><b></b></p>'
  }, {
    src: '<p each="v"><b if="v" class="{{v}}" end="v===2"><i>{{k}}</i></b>once</p>',
    args: [[1, 2]],
    html: '<p><b class="1"><i>0</i></b>once<b class="2"></b></p>'
  }, {
    src: '<p each="v"><b if="v" class="{{v}}" break="v===2"><i>{{k}}</i></b>once</p>',
    args: [[1, 2]],
    html: '<p><b class="1"><i>0</i></b>once<b class="2"><i>1</i></b></p>'
  }, {
    src: '<p each="v"><b if="v" class="{{v}}" break="v===2" end="v===2"><i>{{k}}</i></b>once</p>',
    args: [[1, 2]],
    html: '<p><b class="1"><i>0</i></b>once<b class="2"></b></p>'
  }, {
    opts: {src1: function(pow, val) {
        pow.attr('data-src', val);
      }},
    src: `<img src1="1.jpg" do="this.attr('src1','2.jpg')">`,
    args: [],
    html: '<img data-src="2.jpg">'
  }, {
    src: '<b>{{v}}</b> <b>{{k}}</b>{{" "}}',
    args: [1,2],
    html: '<b>1</b><b>2</b> '
  }, {
    each: true,
    src: '<b>{{v}}</b> <b>{{k}}</b>',
    args: [1,2],
    html: '<b>1</b><b>0</b><b>2</b><b>1</b>'
  }, {
    src: `<p><a if="'b'||"> a </a></p>`,
    args: [],
    html: '<p><b>a</b></p>'
  }, {
    src: `<div
          param="a, b"
          if="a"
          let="c=a+' '+b"
          do="console.log(b)"
          class="a-class {{a}}"
          text="c"></div>`,
    args: [],
    html: ''
  }, {
    src: '<ul param="data" if="Array.isArray(data)"></ul>',
  }, {
    src: `<ul param="data" if="Array.isArray(data) && 'OL' ||"></ul>`,
  }, {
    src: `<ul param="data" if="Array.isArray(data) && '---'"></ul>`,
  }, {
    src: `<p><a if="'b'||"> a </a></p>`,
    args: [],
    html: '<p><b>a</b></p>'
  }, {
    src: `
      <nav>
        <div class="nav-wrapper">
          <div class="col s12" each="v">
            <!-- 下面的 v 是推导形参, 是上面 v 的遍历元素 -->
            <a href="#!" class="breadcrumb">{{v}}</a>
          </div>
        </div>
      </nav>`,
    args: ['First','Second','Third']
  }
];

describe('render', function() {
  cases.some((cas,i) => {
    it(`${i}:${cas.src}`, function() {
      let pow = PowJS(cas.src, cas.opts),
      args = cas.args || [];
      if (cas.echo)
        format(pow.toScript());
      if (cas.each)
        pow.each(args);
      else
        pow.render(...args);
      let html = pow.node.innerHTML;
      if (cas.html)
        expect(html).toBe(cas.html);
      else
        expect(html).not.toContain('never');
    });
  });
});

describe('DOM Manipulation', function () {
  function sandbox (){
    return PowJS('<div class="sandbox"></div>').render();
  }

  it('appendTo, renew', function () {
    let pow = sandbox();
    pow.appendTo(document.body);
    expect(pow.childNodes().length).toBe(0);
    expect(pow.query('.sandbox').length).toBe(0);
    expect(real('.sandbox').length).toBe(1);

    let box = real('.sandbox');
    pow.render().render().renew(box[0]);
    expect(real('.sandbox').length).toBe(2);
  });

  it('Expect TypeError', function () {
    let pow = sandbox();
    expect(()=> pow.render().renew()).toThrowError(/Manipulation/);
    expect(()=> pow.render().renew(real('.sandbox'))).toThrowError(/Manipulation/);
  });
});
