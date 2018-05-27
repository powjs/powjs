/* jshint esversion: 6 */

if (typeof PowJS === 'undefined') {
  // For Jasmine without Karma
  let JSDOM = require('jsdom').JSDOM;
  window = new JSDOM('<!doctype html><html><head><style>b{}/*{{}}*/</style></head><body></body></html>').window;
  window.Object = Object;
  window.Math = Math;
  document = window.document;
  Node = window.Node;
  NodeList = window.NodeList;
  prettier = require('prettier');
  PowJS = require('../powjs.js');
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

function sandbox() {
  return PowJS('<div class="sandbox"></div>').render();
}

let cases = [
  {
    src: '<b text="`User: ${v}`"></b>',
    args: ['<i>Tom</i>'],
    html: '<b>User: &lt;i&gt;Tom&lt;/i&gt;</b>',
  }, {
    src: '<b html="`User: ${v}`"></b>',
    args: ['<i>Tom</i>'],
    html: '<b>User: <i>Tom</i></b>',
  }, {
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
    src: '<p each="v"><b if="v" class="{{v}}" break="v===2" end="v===2" render="v,k"><i>{{k}}</i></b>once</p>',
    args: [[1, 2]],
    html: '<p><b class="1"><i>0</i></b>once<b class="2"></b></p>'
  }, {
    opts: {src: function(pow, val) {
        pow.attr('data-src', val);
      }},
    src: `<img src="1.jpg" do="this.attr('src','2.jpg')">`,
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
    src: `<p><a if="'b';"> a </a></p>`,
    args: [],
    html: '<p><b>a</b></p>'
  }, {
    src: `<div
          param="a"
          if="a"
          do="console.log(never)">
          </div>`,
    args: [],
    html: ''
  }, {
    src: `<div param="a" each="a" do="this.text('yes')">{{a}}</div>`,
    args: [1,2],
    html: '<div>yes</div>'
  }, {
    src: `<div param="a" each="a" each="a">{{a}}</div>`,
    args: [[1,2]],
    html: '<div>12</div>'
  }, {
    src: '<ul param="data" if="Array.isArray(data)"></ul>',
  }, {
    src: `<ul param="data" if="Array.isArray(data) && 'OL'||'UL';"></ul>`,
  }, {
    src: `<ul param="data" if="Array.isArray(data) && '---'"></ul>`,
  }, {
    src: `<p><a if="'b';"> a </a></p>`,
    args: [],
    html: '<p><b>a</b></p>'
  }, {
    src: `
      <nav func="breadcrumb" param="paths">
        <div class="nav-wrapper">
          <div class="col s12" each="paths, val-path">
            <a href="#!" class="breadcrumb">
            {{path}}
            </a>
          </div>
        </div>
      </nav>`,
    args: ['First','Second','Third']
  }, {
    src: `<b if="v===1&&'---'||'#never'">yes</b>`,
    args: [1],
    html: '<b>yes</b>'
  }, {
    src: `<b if="v===1&&'---'||'#yes'">never</b>`,
    args: [2],
    html: 'yes'
  }, {
    src: '<ul render=":k,v"><li>{{k}}\n{{v}}</li></ul>',
    args: [1, 2],
    html: '<ul><li>2\n1</li></ul>'
  }, {
    src: '<ul render="k"><li>{{v}}</li></ul>',
    args: [1, 2],
    html: '<ul><li>2</li></ul>'
  }, {
    src: '<b param="a,b" each="a,b,key-key,val-val">{{b}},{{key}},{{val}}</b>',
    args: [[1, 2],3],
    html: '<b>3,0,13,1,2</b>'
  }, {
    src: '<b param="a,b" each="a,b,val-val,key-key">{{b}},{{key}},{{val}}</b>',
    args: [[1, 2],3],
    html: '<b>3,0,13,1,2</b>'
  }, {
    src: '<b param="a,b" each=":a,b">{{b}},{{k}},{{v}}</b>',
    args: [[1, 2],3],
    html: '<b>3,0,13,1,2</b>'
  }, {
    src: '<b param="p,b" each="p.children,val-child">{{child}},{{k}},{{$l}},{{$n}}{{$l!==$n&&"/"||""}}</b>',
    args: [{children: [1,2]},3],
    html: '<b>1,0,2,1/2,1,2,2</b>'
  }, {
    src: '<b param="p,b" each="p.children,key-key,val-child,num-row">{{child}},{{key}},{{$l}},{{row}}{{$l!==row&&"/"||""}}</b>',
    args: [{children: [1,2]},3],
    html: '<b>1,0,2,1/2,1,2,2</b>'
  }, {
    src: '<head><style>body{background: {{v}};}</style></head>',
    args: ['red'],
    html: '<style>body{background: {{v}};}</style>'
  }, {
    src: '<head><style></style></head>',
    args: [],
    html: '<style></style>'
  }, {
    src: '<body>x</body>',
    args: [],
    html: 'x'
  }, {
    src: document.createElement('body'),
    args: [],
    html: '<body></body>'
  }, {
    src: document.createElement('head'),
    args: [],
    html: '<head></head>'
  }, {
    src: document.createElement('html'),
    args: [],
    html: '<html></html>'
  }, {
    src: '<!--- {{v}} --->',
    args: [1],
    html: '<!--- {{v}} --->'
  }, {
    // 需要同时兼容测试时的浏览器内容
    src: document.querySelector('head').childNodes,
    args: [],
    html: document.querySelector('head').innerHTML.trim().replace(/(\n *)/mg, '')
  }, {
    src:`<div param="array" if="':';" each="array,val-name"><b>{{name}}</b></div>`,
    args: [[1,2,3]],
    html: '<b>1</b><b>2</b><b>3</b>'
  }, {
    src: '{{',
    args: [],
    html: '{{'
  }, {
    src: '}}',
    args: [],
    html: '}}'
  }, {
    src: '}}{{',
    args: [],
    html: '}}{{'
  }, {
    src: '<b>}}</b>',
    args: [],
    html: '<b>}}</b>'
  }, {
    src: '<b>{{</b>',
    args: [],
    html: '<b>{{</b>'
  }, {
    src: '<b text="`{{`"></b>',
    args: [],
    html: '<b>{{</b>'
  }, {
    src: '<b text="`}}`"></b>',
    args: [],
    html: '<b>}}</b>'
  }
];

describe('render', function() {
  cases.some((cas,i) => {
    it(`${i}:${cas.src}`, function() {
      let
        html,
        pow = PowJS(cas.src, cas.opts),
        args = cas.args || [],
        src = pow.toScript(),
        fn = Function('','return '+src); // jshint ignore: line

      if (cas.echo)
        format(src);
      if (cas.each)
        pow.each(args);
      else
        pow.render(...args);
      html = pow.html();
      if (cas.html)
        expect(html).toBe(cas.html);
      else
        expect(html).not.toContain('never');

      pow = PowJS(fn()).addon(cas.opts);
      if (cas.each)
        pow.each(args);
      else
        pow.render(...args);
      html = pow.html();
      if (cas.html)
        expect(html).toBe(cas.html);
      else
        expect(html).not.toContain('never');
    });
  });
});

describe('DOM Manipulation', function() {
  it('appendTo, renew', function() {
    let pow = sandbox();
    pow.appendTo(document.body);
    expect(pow.childNodes().length).toBe(0);
    expect(pow.query('.sandbox').length).toBe(0);
    expect(real('.sandbox').length).toBe(1);

    let box = real('.sandbox');
    pow.render().render().renew(box[0]);
    expect(real('.sandbox').length).toBe(2);
  });

  it('Expect TypeError', function() {
    let pow = sandbox();
    expect(()=> pow.render().renew()).toThrowError();
    expect(()=> pow.render().renew(real('.sandbox'))).toThrowError();
  });
});

describe('Transfer', function() {
  it('text tranfer', function() {
    let
      pow = PowJS(`
        {{@name}}<span func="name">yes</span>
      `),
    html = pow.render().html();
    expect(html).toBe('<span>yes</span><span>yes</span>');
  });
  it('top transfer', function() {
    let
      pow = PowJS(`
      <i if="'@name';">never</i>
      <span func="name">yes</span>
    `),
    html = pow.render().html();
    expect(html).toBe('<span>yes</span><span>yes</span>');
  });

  it('sub transfer', function() {
    let
      pow = PowJS(`
      <b><i if="'@name';">never</i></b>
      <span func="name">yes</span>
    `),
    html = pow.render().html();
    expect(html).toBe('<b><span>yes</span></b><span>yes</span>');
  });
});

describe('call', function() {
  it('top call', function() {
    let
      pow = PowJS(`
      <i do="return this.call('name')">never</i>
      <span func="name">yes</span>
    `),
    html = pow.render().html();
    expect(html).toBe('<i><span>yes</span></i><span>yes</span>');
  });

  it('sub call', function() {
    let
      pow = PowJS(`
      <b><i do="return this.call('name')">never</i></b>
      <span func="name">yes</span>
    `),
    html = pow.render().html();
    expect(html).toBe('<b><i><span>yes</span></i></b><span>yes</span>');
  });
});

describe('Expect some error', function() {
  let message, cases = [
    ['<b skip text=""></b>', /Logic conflict/],
    ['<b skip html=""></b>'],
    ['<b skip render="dd"></b>'],
    ['<b skip each="dd"></b>'],
    ['<b end text=""></b>'],
    ['<b end html=""></b>'],
    ['<b end render="dd"></b>'],
    ['<b end each="dd"></b>'],
    ['<b text="" skip ></b>'],
    ['<b html="" skip ></b>'],
    ['<b render="dd" skip ></b>'],
    ['<b each="dd" skip ></b>'],

    ['<b text="{{v}}"></b>', /interpolation/],

    ['<b>{{v}}{{</b>', /unpaired/],
    ['<b>{{}}</b>'],

    ['<b render=":"></b>', /render/],
    ['<b each=""></b>', /each/],
    ['<b each=":"></b>', /each/],
    ['<b each="key-k"></b>', /each/],
  ];

  it('expect ...', function() {
    cases.forEach((a) =>{
      message = a[1] || message;
      expect(()=> PowJS(a[0])).toThrowError(message);
    });
  });

});

describe('Case-Folders', function() {
  let tmpl = `
   <ul param="model, open" render="open, model">
    <li func="folders" param="open, model, idx, len, num">
      <div class="{{open&&'bold'||''}}">
        {{model.name}}<span if="model.children">[-]</span>
      </div>
      <ul if="model.children"
        each="model.children, open"
      >
        {{@folders}}
        <li if="len===num" class="add">+</li>
      </ul>
    </li>
  </ul>
  `,
  data = {
    name: 'My Tree',
    children: [
      {name: 'hello'},
      {name: 'wat'},
      {
        name: 'child folder1',
        children: [
          {
            name: 'child folder2',
            children: [
              {name: 'hello'},
              {name: 'wat'}
            ]
          },
          {name: 'hello'},
          {name: 'wat'},
          {
            name: 'child folder3',
            children: [
              {name: 'hello'},
              {name: 'wat'}
            ]
          }
        ]
      }
    ]
  },
  pow = PowJS(tmpl).render(data);

  it('to be equal', function() {
    expect(pow.query('ul').length).toBe(5);
    expect(pow.query('li').length).toBe(16);
    expect(pow.query('div').length).toBe(12);
    expect(pow.query('span').length).toBe(4);
  });
});

describe('exports', function() {
  it('exports', function() {
    let pow = PowJS('text'),
      want = "[['#text']]";
    expect(pow.toScript()).toBe(want);
    expect(pow.exports()).toBe(`module.exports = ${want};`);
    expect(pow.exports('a')).toBe(`a = ${want};`);
  });
});

describe('Shadow DOM', function(){
  if (!window.customElements) return;
  const html = `
    <h1>Test h1</h1>
    <div>
      <p>Test p</p>
    </div>
    <slot></slot>
  `;
  class CEWithChildren extends HTMLElement {
    constructor(self) {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = html;
    }
  }

  customElements.define('ce-with-children', CEWithChildren);

  const elm = document.createElement('ce-with-children');
  it('should to be orgin html', () => {
    let
      pow = PowJS(elm),
      len = pow.render().childNodes().length,
      child = pow.firstChild();
    console.log(pow.toScript());
    expect(len).toBe(1);
    expect(child.shadowRoot).not.toBeNull();
    expect(child.shadowRoot.innerHTML).toBe(html);
    expect(pow.html()).toBe('<ce-with-children></ce-with-children>');
  });
});

