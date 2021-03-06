/* jshint esversion: 6 */
(function(global) {
  'use strict';

  /*! PowJS Template engine https://github.com/powjs/powjs */
  /*! MIT License https://github.com/powjs/powjs/blob/master/LICENSE */

  const
    TEXT_NODE = Node.TEXT_NODE,
    COMMENT_NODE = Node.COMMENT_NODE,
    ELEMENT_NODE = Node.ELEMENT_NODE,
    DOCUMENT_NODE = Node.DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE,
    // BREAK = 1, SKIP = 2, END = 4,
    // TAG = 0, ATTRS = 1, FN = 2, CHILDS = 3, FUNC = 4,
    slice = Array.prototype.slice,
    toString = Object.prototype.toString,
    RENDERINFERENCE = /(([a-z]\w*),|([a-z]\w*)$)/ig,
    EACHINFERENCE = /(key-|val-|len-|num-)?[a-z]\w*(,|$)/ig,
    TMPL = /({{|}})/m;

  let counter = 0, directives = {

    func: function(exp) {
      if (!exp || exp[0] <= '9') {
        exp = JSON.stringify(exp);
        throw new SyntaxError(
          `Invalid function ${exp} on func directive`
        );
      }
      return exp;
    },
    param: function(exp) {
      return exp;
    },
    if: function(exp, tag, param) {
      if (!exp) throw new SyntaxError(
        'Missing condition on if directive'
      );

      if (exp.includes('---'))
        exp = exp.replace(/---/g, tag) + ';';
      else if (!exp.endsWith(';'))
        exp = `${exp} && '${tag}';`;

      return new Function(param,'return ' + exp); // jshint ignore:line
    },
    let: function(exp) {
      if (!exp) throw new SyntaxError(
        'Missing assignment statement on let directive'
      );
      return `let ${exp};`;
    },
    do: function(exp) {
      return exp + ';';
    },
    text: function(exp) {
      return 'this.text(' + exp + ');';
    },
    html: function(exp) {
      return 'this.html(' + exp + ');';
    },
    skip: function(exp) {
      return !exp && 'return this.skip();' ||
       `if(${exp}) return this.skip();`;
    },
    break: function(exp) {
      return !exp && 'this.break();' ||
       `if(${exp}) this.break();`;
    },
    end: function(exp) {
      return !exp && 'return this.end();' ||
       `if(${exp}) return this.end();`;
    },
    render: function(exp) {
      return `this.render(${exp});`;
    },
    each: function(exp) {
      return `this.each(${exp});`;
    }
  };

  function Pow(source, option) {
    let view;

    if (source === undefined) return PowJS.prototype;

    if (typeof source === 'string')
      source = childNodes(source);
    else if (source instanceof Node) {
      if (source.nodeType === DOCUMENT_FRAGMENT_NODE)
        source = source.childNodes;
      else if (source.nodeName === 'TEMPLATE')
        source = source.content.childNodes;
      else
        source = [source];
    } else if (Array.isArray(source) && Array.isArray(source[0]))
      view = source;
    else if (toString.call(source) !== '[object NodeList]') {
      let array = Array.from(source);
      if (array.length && array.every(node=> node instanceof Node))
        source = array;
      else
        throw new TypeError(
          'Unsupported source ' + toString.call(source)
        );
    }

    if (!view) {
      let prefix = typeof option === 'string' && option || '';
      view = [];
      source.forEach((node) => {
        node.normalize();
        let v = compile(node, prefix, 'v,k');
        if (v) view.push(v);
      });
    }

    let
      pow = new PowJS(
        document.createElement('template').content,
        view,
        option,
        null
      );
    pow.node = pow.parent;
    return pow;
  }

  function isObject(v) {
    return toString.call(v) === '[object Object]';
  }

  function childNodes(source) {
    let box = document.createElement('template');

    box.innerHTML = source;
    return box.content.childNodes;
  }

  function funcScript(fn) {
    return !fn && '0' || fn.toString()
      .replace(/^function( (anonymous)?)?\(/, 'function \(')
      .replace('\n/*``*/', '');
  }

  function toScript(sum, view, i) {
    let len = view.length;

    return sum + (i && ',[' || '[') +
      (typeof view[0] === 'string' && `'${view[0]}'` || funcScript(view[0])) +
      (len > 1 && ',' + JSON.stringify(view[1] || 0) || '') +
      (len > 2 && ',' + funcScript(view[2]) || '') +
      (len > 3 && (view[3] || []).reduce(toScript, ',[') + ']' || '') +
      (len > 4 && ',' + JSON.stringify(view[4] || 0) || '') +
    ']';
  }

  function find(name, childs) {
    if (childs) for (let i = 0; i < childs.length; i++) {
      let
        view = childs[i],
        got = view[name] || view[4] === name && view || find(name, view[3]);
      if (got) return got;
    }
    return null;
  }

  function innerHtml(node) {
    if (node.nodeType === ELEMENT_NODE)
      return node.innerHTML;
    if (node.nodeType === TEXT_NODE)
      return node.textContent;
    if (node.nodeType === COMMENT_NODE)
      return '<!--' + node.textContent + '-->';
    if (isConnected(node))
      return node.innerHTML;
    return null;
  }

  function isConnected(node) {
    let real = node && node.isConnected;
    if (real !== undefined) return real;
    if (!node) return false;
    real = node;
    while (real.parentNode) real = real.parentNode;
    return real.nodeType === DOCUMENT_NODE;
  }

  class PowJS {
    constructor(parent, view, addon, root) {
      this.parent = parent;
      this.view = view;
      this.node = null;
      this.flag = 0;
      this.x = isObject(addon) && addon || {};
      this.root = root;
    }

    addon(addon) {
      this.x = isObject(addon) && addon || {};
      return this;
    }

    text(text) {
      if (!arguments.length) return this.node.textContent;
      this.node.textContent = text + '';
    }

    html(html) {
      if (!arguments.length) {
        html = innerHtml(this.node);
        if (html === null) {
          let box = document.createElement('template')
              .content.appendChild(document.createElement('html'));
          while (this.node.firstChild)
            box.appendChild(this.node.firstChild);

          html = box.innerHTML;

          while (box.firstChild)
            this.node.appendChild(box.firstChild);
        }
        return html;
      }

      if (this.node.nodeType === ELEMENT_NODE)
        this.node.innerHTML = html + '';
      else if (this.node.nodeType === TEXT_NODE ||
        this.node.nodeType === COMMENT_NODE)
        this.node.textContent = html + '';
      else {
        while (this.node.firstChild)
          this.node.removeChild(this.node.firstChild);
        childNodes(html).forEach((item) => {
          this.node.appendChild(item);
        });
      }
    }

    create(view, ...args) {
      let
        tag = view[0],
        fn = view[2];

      if (typeof tag === 'function') {
        tag = tag.apply(this, args);
        if (typeof tag !== 'string') return this;
      }

      if (!tag) return this;

      let c = tag.charCodeAt(0);
      if (c < 0x41) {    // A
        if (c === 0x23) { // #
          this.node = this.parent.appendChild(
            document.createTextNode(tag.slice(1))
          );
          if (!fn) return this;
        } else if (c === 0x40) // @
          return this.call(tag.substring(1), ...args);
        else if (c === 0x3D) { // =
          this.parent.textContent = tag.substring(1);
          return this;
        } else if (c === 0x21) { // !
          this.node = this.parent.appendChild(
            document.createComment(tag.slice(1))
          );
          return this;
        } else if (c === 0x3A) // :
          this.node = this.parent;
      } else if (c <= 0x5A || c >= 0x61 && c <= 0x7A) { // Z, a-z
        this.node = this.parent.appendChild(
          document.createElement(tag)
        );
        let attrs = view[1];
        for (let key in attrs)
          this.attr(key, attrs[key]);
      }

      if (fn)
        fn.apply(this, args);
      else
        this.render(...args);
      return this;
    }

    call(name, ...args) {
      let
        childs = this.root || this.view,
        view = find(name, childs);
      if (!view)
        throw new Error(`ReferenceError: func ${name} is not defined`);

      if (childs[4] !== name && !childs[name]) childs[name] = view;

      return new PowJS(
        this.node || this.parent, view, this.x, this.root || this.view
      ).create(view, ...args);
    }

    render(...args) {
      let
        root = this.isRoot(),
        view = root && this.view || this.view[3];

      if (!view || this.flag & 4 && !root) return this;

      if (!(this.flag & 2)) view.some((view) => {
        let flag = new PowJS(this.node, view, this.x, this.root || this.view)
          .create(view, ...args).flag;
        if (flag & 4) this.flag |= flag;
        return flag & 5 && true;
      });

      return this;
    }

    each(x, ...args) {
      let i = args.length;

      if (this.flag & 4 && !this.isRoot()) return this;
      this.flag = 0;
      args.push(null, null);
      if (isObject(x)) {
        x = Object.entries(x);
        args.push(x.length, null);
        x.some((v, k) => {
          args[i] = v[1];
          args[i + 1] = v[0];
          args[i + 3] = k + 1;
          this.render(...args);
          return this.flag & 4 && true;
        });
      } else if (typeof x === 'object') {
        if (!Array.isArray(x)) x = Array.from(x);
        args.push(x.length);
        x.some((v, k) => {
          args[i] = x[k];
          args[i + 1] = k;
          args[i + 3] = k + 1;
          this.render(...args);
          return this.flag & 4 && true;
        });
      }
      return this;
    }

    isRoot() {
      return !this.root;
    }

    isReal() {
      return isConnected(this.node);
    }

    appendTo(parent) {
      let doc = parent.ownerDocument;
      if (this.isRoot()) while (this.node.firstChild)
        parent.appendChild(doc.adoptNode(this.node.firstChild));
      else if (this.node)
        parent.appendChild(doc.adoptNode(this.node));
    }

    removeChilds() {
      let parent = this.node;
      while (parent && parent.lastChild)
        parent.removeChild(parent.lastChild);
    }

    renew(node) {
      let doc = node.ownerDocument,
        parent = node.parentNode;
      if (this.isRoot()) {
        let last = this.node.lastChild;
        if (last) {
          parent.replaceChild(doc.adoptNode(last), node);
          while (this.node.firstChild)
            parent.insertBefore(doc.adoptNode(this.node.firstChild), last);
        }
      } else if (this.node)
        parent.replaceChild(doc.adoptNode(this.node), node);
    }

    insertBefore(node) {
      let doc = node.ownerDocument,
        parent = node.parentNode;
      if (this.isRoot()) while (this.node.firstChild)
        parent.insertBefore(doc.adoptNode(this.node.firstChild), node);
      else if (this.node)
        parent.insertBefore(doc.adoptNode(this.node), node);
    }

    insertAfter(node) {
      if (node.nextSibling)
        this.insertBefore(node.nextSibling);
      else
        this.appendTo(node.parentNode);
    }

    exports(target) {
      target = target || 'module.exports';
      return target + ' = ' + this.toScript() + ';';
    }

    toScript() {
      return this.view.reduce(
        (sum, view, i) => toScript(sum, view, i), '['
      ) + ']';
    }

    attr(key, val) {
      if (arguments.length < 2)
       return this.node.hasAttribute(key) ?
        this.node.getAttribute(key) :
        this.node[key];
      if (this.flag & 4) return this;

      let fn = this.x[key];
      if (typeof fn !== 'function')
        this.node.setAttribute(key, val);
      else {
        this.x[key] = null;
        fn(this, val, key);
        this.x[key] = fn;
      }
      return this;
    }

    prop(property, val) {
      let
        node = this.node,
        real = node[property];

      if (arguments.length < 2)
        return real === undefined ?
          node.getAttribute(key) :
          real;

      if (real === undefined ||
        toString.call(val) !== toString.call(real))
        return this.attr(property, val);

      let fn = this.x[property];
      if (typeof fn !== 'function')
        node[property] = val;
      else {
        this.x[property] = null;
        fn(this, val, property);
        this.x[property] = fn;
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
      this.flag |= 4;
      return this;
    }
    break() {
      this.flag |= 1;
      return this;
    }
    skip() {
      this.flag |= 2;
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

  function isPaired(s) {
    let
      b = s.indexOf('{{'),
      e = b < 0 && b || s.indexOf('}}');
    return e > 0 && e > b;
  }

  function compile(node, prefix, param) {

    let body = '', render = '', next = '', view = [], end = '';

    if (node.nodeType === TEXT_NODE) {
      body = node.textContent.trim();
      if (!body) return null;

      if (body.startsWith('{{@') && body.endsWith('}}'))
        view.push(body.slice(2, -2));
      else if (isPaired(body))
        view.push('#', 0, new Function(  // jshint ignore:line
          param,
          directives.text(parseTemplate(body))
        ));
      else
        view.push('#' + body);
      return view;
    }

    if (node.nodeType == COMMENT_NODE) {
      view.push('!' + node.textContent);
      return view;
    }

    if (node.nodeType !== ELEMENT_NODE)
      return null;

    view[0] = node.nodeName;
    let attrs = node.attributes;
    for (let i = 0; i < attrs.length; i++) {
      let
        val = attrs[i].name,
        name = prefix && val.startsWith(prefix) ? val.slice(prefix.length) : val,
        di = directives.hasOwnProperty(name) && directives[name];

      val = attrs[i].value.trim();

      if (!di) {
        if (val.indexOf('{{') !== -1)
          body += !end ? 'this.attr("' + name + '",' +
            parseTemplate(val) + ');' : '';
        else {
          view[1] = view[1] || Object.create(null);
          view[1][name] = val;
        }
        continue;
      }

      if (isPaired(val))
        throw new SyntaxError('Invalid interpolation');

      if ('func' === name) {
        view[4] = di(val);
        continue;
      }

      if ('param' === name) {
        param = di(val);
        continue;
      }

      if ('if' === name) {
        view[0] = di(val, view[0], param);
        continue;
      }

      if ('render' === name) {
        if (val[0] === ':')
          [val, next] = renderInference(val.slice(1));
        render = name;
      } else if ('each' === name) {
        [val, next] = eachInference(val);
        render = name;
      }else if (['text', 'html'].indexOf(name) >= 0)
        render = name;
      else if (['skip', 'break', 'end'].indexOf(name) >= 0)
        end = !val && name || end;

      if (render && end && 'break' !== end)
        throw new Error(conflict(name, end));

      body += di(val);
    }

    if (body) {
      if (!render) body += directives.render(param);
      if (!view[1]) view[1] = 0;
      view[2] = new Function(param, body);  // jshint ignore:line
    }

    let childs = [];
    if ('SCRIPT' === node.nodeName || 'STYLE' === node.nodeName) {
      next = node.textContent;
      if (next) childs.push(['=' + next]);
    }else {
      next = next || param;
      node.childNodes.forEach((child) => {
        let v = compile(child, prefix, next);
        if (v) childs.push(v);
      });
    }

    if (childs.length || view[4]) {
      if (!view[1]) view[1] = 0;
      if (!view[2]) view[2] = 0;
      view[3] = childs.length && childs || 0;
    }
    return view;
  }

  function conflict(name, end) {
    return `Logic conflict, before ${name} has ${end}`;
  }

  function renderInference(clean) {
    // result [parameter-clean, parameter-next]
    let params = clean.match(RENDERINFERENCE);
    if (!params) throw new Error('Illegal expression on render');
    return [clean, params.join('')];
  }

  function eachInference(parameter) {
    // result [parameter-clean, parameter-next]
    let
      next = ['','v','k','$l','$n'],
      force = parameter[0] === ':',
      clean = force ? parameter.substring(1) : parameter,
      params = clean.match(EACHINFERENCE);

    if (!params) {
      if (!force && clean) return [clean, '']; // complex
      throw new Error('Illegal expression on each');
    }

    params = params.reduce((sum, s)=> {
      let c = s.endsWith(',') ? s.slice(0, -1) : s;
      if (c[3] === '-' && s.match(/^(key|val|len|num)/)) {
        clean = clean.replace(s, '');
        s = s[0];
        next[0] = ',';
        next[
          s === 'v' && 1 || s === 'k' && 2 || s === 'l' && 3 || 4
        ] = c.substring(4);
        return sum;
      }
      if (sum === ',') return '';
      return !sum && c || sum + ',' + c;
    }, ',');

    if (!clean)
      throw new Error('Illegal expression on each');
    if (!next[0] && !force) return [clean, ''];

    if (params)
      next[0] = params;
    else
      next.shift();

    return [clean, next.join(',')];
  }

  function parseTemplate(txt) {
    let
      i = 0,
      a = txt.split(TMPL),
      t = a.shift();
    if (a.length & 3) a[0] = '';
    while (i < a.length) {
      let b = a[i++], exp = a[i++].trim(), e = a[i++];

      if (b !== '{{' || e !== '}}' || !exp)
        throw new SyntaxError(
          'The symbols "{{}}" unpaired: ' + txt
        );

      t += '${' + exp + '}' + a[i++];
    }

    return '`' + t + '`';
  }

  if (global)
    global.PowJS = Pow;
  else
    module.exports = Pow;
}(this && this.window === this && this));
