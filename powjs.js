/* jshint esversion: 6 */
(function(global) {
  'use strict';

  /*! PowJS Template engine https://github.com/powjs/powjs */
  /*! MIT License https://github.com/powjs/powjs/blob/master/LICENSE */

  const
    TEXT_NODE = 3,
    COMMENT_NODE = 8,
    DOCUMENT_FRAGMENT_NODE = 11,
    BREAK = 1,
    SKIP = 2,
    END = 4,
    TAG = 0,
    ATTRS = 1,
    FN = 2,
    CHILDS = 3,
    slice = Array.prototype.slice,
    toString = Object.prototype.toString,
    TMPL = /{{|}}/m;

  let counter = 0, directives = Object.create(null);

  directives.param = function(args) {
    return args;
  };

  directives.if = function(exp, tag) {
    if (exp.includes('---')) {
      exp = exp.replace(/---/g, tag);
      return `return ${exp};`;
    }

    if (exp.endsWith('||'))
      return `return ${exp} '${tag}';`;
    return `return ${exp} && '${tag}';`;
  };

  directives.let = function(exp) {
    return exp && 'let ' + exp + ';' || ';';
  };
  directives.do = function(exp) {
    return exp + ';';
  };
  directives.text = function(exp) {
    return 'this.text(' + exp + ');';
  };
  directives.html = function(exp) {
    return 'this.html(' + exp + ');';
  };

  directives.skip = function(exp) {
    return !exp && 'return this.skip();' ||
     'if(' + exp + ') return this.skip();';
  };
  directives.break = function(exp) {
    return !exp && 'this.break();' ||
     'if(' + exp + ') this.break();';
  };
  directives.end = function(exp) {
    return !exp && 'return this.end();' ||
     'if(' + exp + ') return this.end();';
  };
  directives.render = function(args) {
    return 'this.render(' + args + ');';
  };
  directives.each = function(args) {
    return 'this.each(' + args + ');';
  };

  function Pow(source, option) {
    let view;

    if (source === undefined) return PowJS.prototype;

    if (typeof source === 'string')
      source = slice.call(childNodes(source));
    else if (source instanceof Node)
      source = [source];
    else if (Array.isArray(source) && Array.isArray(source[0]))
      view = source;
    else {
      let array = slice.call(source);
      if (array[0] instanceof Node)
        source = array;
      else
        throw new TypeError(
          'Unsupported source ' + toString.call(source)
        );
    }

    if (!view) {
      let prefix = typeof option === 'string' && option || '';
      view = source.reduce((view, node) => {
        node.normalize();
        let v = compile(node, prefix, 'v,k');
        if (v) view.push(v);
        return view;
      }, []);
    }

    let
      pow = new PowJS(
        document.createDocumentFragment().appendChild(
        document.createElement('BODY')),
        view,
        isObject(option) && option || {}
      );
    pow.node = pow.parent;
    return pow;
  }

  function isObject(v) {
    return toString.call(v) === '[object Object]';
  }

  function childNodes(source) {
    let b = document.createDocumentFragment()
     .appendChild(document.createElement('BODY'));

    b.innerHTML = source.trim();
    return b.childNodes;
  }

  function funcScript(fn) {
    return fn.toString()
      .replace(/^function anonymous\(/, 'function \(')
      .replace('\n/*``*/', '');
  }

  function toScript(sum, view) {
    let len = view.length;

    return sum + '[' +
      (typeof view[0] === 'string' && `'${view[0]}'` || funcScript(view[0])) +
      (len > 1 && ',' + JSON.stringify(view[1]) || '') +
      (len > 2 && ',' + funcScript(view[2]) || '') +
      (len > 3 && view[3].reduce(toScript, ',[') + ']' || '') +
    '],';
  }

  function assert(node) {
    if(node instanceof Node) return;
    throw new TypeError(
      'Failed execute DOM Manipulation on '+toString(node) +
      ': parameter is not instanceof type Node'
    );
  }

  class PowJS {
    constructor(parent, view, plugin) {
      this.parent = parent;
      this.view = view;
      this.node = null;
      this.flag = 0;
      this.$ = plugin;
    }

    text(text) {
      if (!arguments.length) return this.node.textContent;
      this.node.textContent = text + '';
    }

    html(html) {
      if (!arguments.length)
       return this.node.innerHTML || this.node.textContent;
      if (this.node.nodeType === TEXT_NODE)
       this.node.textContent = html + '';
      else
       this.node.innerHTML = html + '';
    }

    create(view, ...args) {
      let
        tag = view[TAG],
        attrs = view[ATTRS],
        fn = view[FN];

      if (typeof tag === 'function') {
        tag = tag.apply(this, args);
        if (typeof tag !== 'string') return this;
        tag = tag.trim();
      }

      if (!tag) return this;
      this.node = this.parent.appendChild(
        tag[0] === '#' && document.createTextNode(tag.slice(1)) ||
        document.createElement(tag)
      );

      for (let key in attrs)
        this.attr(key, attrs[key]);

      if (fn)
        fn.apply(this, args);
      else
        this.render(...args);
      return this;
    }

    render(...args) {
      let
        root = this.isRoot(),
        view = root && this.view || this.view[CHILDS];

      if (!view || this.flag & END && !root) return this;

      if (!(this.flag & SKIP)) view.some((view) => {
        let flag = new PowJS(this.node, view, this.$)
          .create(view, ...args).flag;
        if (flag & END) this.flag |= flag;
        return flag & (END | BREAK) && true;
      });

      return this;
    }

    each(x, ...args) {
      let i = args.length;

      if (this.flag & END && !this.isRoot()) return this;
      this.flag = 0;
      args.push(null, null);
      if (isObject(x)) {
        for (let k in x) {
          args[i] = x[k];
          args[i + 1] = k;
          this.render(...args);
          if (this.flag & END) break;
        }
      } else if (typeof x === 'object') {
        if (!Array.isArray(x)) x = slice.call(x);
        x.some((v,k) => {
          args[i] = x[k];
          args[i + 1] = k;
          this.render(...args);
          return this.flag & END && true;
        });
      }
      return this;
    }

    isRoot() {
      return !this.node.parentElement;
    }

    appendTo(parentNode) {
      assert(parentNode);
      if(!this.isRoot())
        parentNode.appendChild(this.node);
      else
        this.node.childNodes.forEach((item) => {
          parentNode.appendChild(item);
        });
    }

    renew(node) {
      assert(node);
      let parent = node.parentNode;
      if(!this.isRoot())
        parent.replaceChild(this.node, node);
      else {
        let last = this.node.lastChild;
        parent.replaceChild(last, node);
        this.node.childNodes.forEach((item) => {
          parent.insertBefore(item, last);
        });
      }
    }

    insertBefore(node){
      assert(node);
      let parent = node.parentNode;
      if(!this.isRoot())
        parent.insertBefore(this.node, node);
      else
        this.node.childNodes.forEach((item) => {
          parent.insertBefore(item, node);
        });
    }

    insertAfter(node) {
      assert(node);
      if(node.nextSibling)
        this.insertBefore(node.nextSibling);
      else
        this.appendTo(node.parentNode);
    }

    exports(target) {
      target = target || 'module.exports';
      return `/*! Generated by PowJS. Do not edit */\n${target} = ` +
       this.toScript() + ';';
    }

    toScript() {
      return this.view.reduce((sum, view)=> {
        return toScript(sum, view);
      }, '[') + ']';
    }

    attr(key, val) {
      if (arguments.length < 2)
       return this.node.hasAttribute(key) ?
        this.node.getAttribute(key) :
        this.node[key];
      if (this.flag & END) return this;

      let fn = this.$[key];
      if (typeof fn !== 'function')
        this.node.setAttribute(key, val);
      else {
        this.$[key] = null;
        fn(this, val, key);
        this.$[key] = fn;
      }
      return this;
    }

    prop(property, val) {
      let
        node = this.node,
        real = node[property];

      if (arguments.length < 2)
        return real === undefined?
          node.getAttribute(key):
          real;

      if (real === undefined ||
        toString.call(val) !== toString.call(real))
        return this.attr(property, val);

      let fn = this.$[property];
      if (typeof fn !== 'function')
        node[property] = val;
      else {
        this.$[property] = null;
        fn(this, val, property);
        this.$[property] = fn;
      }
      return this;
    }

    lastChild() {
      return this.parent.lastChild;
    }

    childNodes() {
      return this.parent.childNodes;
    }

    firstChild() {
      return this.parent.firstChild;
    }

    query(selector) {
      return this.parent.querySelectorAll(selector);
    }

    end() {
      this.flag |= END;
      return this;
    }
    break() {
      this.flag |= BREAK;
      return this;
    }
    skip() {
      this.flag |= SKIP;
      return this;
    }

    slice(array, start, end) {
      return slice.call(array, start, end);
    }

    inc() {
      return ++counter;
    }

    pow(inc) {
      if (inc) counter++;
      return '-pow-' + counter;
    }
  }

  function compile(node, prefix, param) {

    let cond = '', body = '', render = '', view = [], end = false;

    if (node.nodeType === TEXT_NODE) {
      body = node.textContent.trim();
      if (!body) return null;

      if (body.indexOf('{{') === -1)
        view.push('#' + body);
      else
        view.push('#', 0, new Function(  // jshint ignore:line
          param,
          directives.text(parseTemplate(body))
        ));
      return view;
    }

    view[TAG] = node.nodeName;
    let attrs = node.attributes;
    for (let i = 0; i < attrs.length; i++) {
      let
        name = attrs[i].name,
        val = attrs[i].value.trim(),
        di = directives[
          prefix && name.startsWith(prefix) ?
          name.slice(prefix.length) : name];

      if (!di) {

        if (val.indexOf('{{') !== -1)
          body += !end ? 'this.attr("' + name + '",' +
            parseTemplate(val) + ');' : '';
        else {
          view[ATTRS] = view[ATTRS] || Object.create(null);
          view[ATTRS][name] = val;
        }
        continue;
      }

      if (prefix) name = name.slice(prefix.length);

      if (name === 'param') {
        param = val;
        continue;
      }

      if (val.indexOf('{{') !== -1)
        val = parseTemplate(val);

      if (name === 'if') {
        if (!val) throw new Error(
          'Missing condition on if directive'
        );

        cond = val;
        continue;
      }

      if (render || end) continue;

      body += di(val);
      if (['render', 'each', 'text', 'html'].indexOf(name) >= 0)
        render = name;
      else if (!val || name === 'end')
        end = true;
    }

    if (cond)
      view[TAG] = new Function( // jshint ignore:line
        param,
        directives.if(cond, view[TAG])
      );

    if (body) {
      if (!render) body += directives.render(param);
      if (!view[ATTRS]) view[ATTRS] = 0;
      view[FN] = new Function(param, body);  // jshint ignore:line
    }

    let childs = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      let child = node.childNodes[i];
      if (child.nodeType == COMMENT_NODE) continue;

      let v = compile(child, prefix, param);
      if (v) childs.push(v);
    }
    if (childs.length) {
      if (!view[ATTRS]) view[ATTRS] = 0;
      if (!view[FN]) view[FN] = 0;
      view[CHILDS] = childs;
    }
    return view;
  }

  function parseTemplate(txt) {
    let a = txt.split(TMPL);
    if (a.length & 1 == 0)
      throw new SyntaxError('The symbols "{{}}" unpaired: ' + txt);
    txt = '';
    for (let i = 0; i < a.length; i++) {
      let s = a[i];
      if (!s) continue;
      if (i & 1)
        txt += '${' + s + '}';
      else
        txt += s.split(/(^`|[^\\]`)/).join('\\');
    }

    return '`' + txt + '`';
  }

  if (toString.call(global) === '[object global]')
    module.exports = Pow;
  else
    global.PowJS = Pow;
}(typeof global !== "undefined" && global || this));
