'use strict';

// PowJS Template engine https://github.com/powjs/powjs
// MIT License https://github.com/powjs/powjs/blob/master/LICENSE

const TEXT_NODE = 3,
	COMMENT_NODE = 8,
	// 因 toScript 有硬依赖, 该次序不能变
	TAG = 0,
	ATTRS = 1,
	CHILDS = 2,
	FN = 3,
	toString = Object.prototype.toString,
	TMPL = /{{|}}/m,
	directives = Object.create(null);

directives.args = function(args) {
	throw new Error('never used');
}

directives.if = function(exp) {
	throw new Error('never used');
}

directives.let = function(exp) {
	return exp && 'var ' + exp + ';' || ';';
}
directives.do = function(exp) {
	return exp + ';';
}
directives.text = function(exp) {
	return 'return this.text(' + exp + ');'
}
directives.html = function(exp) {
	return 'return this.html(' + exp + ');'
}

directives.skip = function(exp) {
	return !exp && 'return;' ||
		'if(' + exp + ') return;';
}
directives.end = function(exp) {
	return !exp && 'return this.end();' ||
		'if(' + exp + ') return this.end();';
}
directives.render = function(args) {
	return 'return this.render(' + args + ')';
}
directives.each = function(args) {
	return 'return this.each(' + args + ')';
}

module.exports = function Pow(source, mixed, renderArgs) {
	let view = [],
		prefix = '',
		discard = [];

	if (typeof mixed === 'object') {
		prefix = mixed.prefix || '';
		discard = !mixed.discard ? discard :
			(typeof mixed.discard === 'string' && [mixed.discard] ||
			Array.isArray(mixed.discard) && mixed.discard || []);
	}

	if (typeof source === 'string')
		source = firstChild(source);

	if (source instanceof Node)
		compile(view, source, prefix, discard, 'v,k');
	else if (Array.isArray(source))
		view = source;
	let pow = new PowJS(
		document.createDocumentFragment()
			.appendChild(document.createElement('BODY')),
		view,
		typeof mixed === 'object' && mixed || Object.create(null)
	);

	if (Array.isArray(renderArgs) || mixed instanceof Node) {
		pow.render.apply(pow, renderArgs);
		if (mixed instanceof Node &&
			typeof mixed.replaceWith === 'function')
			mixed.replaceWith(pow.firstChild());
	}
	return pow;
}

function firstChild(source) {
	let b = document.createDocumentFragment()
		.appendChild(document.createElement('BODY'));

	b.innerHTML = source.trim();
	return b.firstChild;
}

function PowJS(parent, view, context) {
	context.node = null;
	this.parent = parent;
	this.view = view;
	this.$ = context;
}

function toScript(_, view) {
	// 固定次序 [TAG,ATTRS,CHILDS,FN]
	return '["' + view[TAG] + '",' +

		JSON.stringify(view[ATTRS]) +

		(view[CHILDS] && view[CHILDS].length &&
		',[' + view[CHILDS].reduce(toScript, '') + '],' || ',null,') +

		(view[FN] && view[FN].toString()
			.replace(/^function anonymous\(/, 'function (')
			.replace("\n/*``*/", '')) + ']' || 'null';
}

PowJS.prototype.export = function() {
	return (this.view && this.view.length) &&
		toScript('', this.view) || '[]';
}

PowJS.prototype.childNodes = function() {
	return this.parent.childNodes;
}

PowJS.prototype.firstChild = function() {
	return this.parent.firstChild;
}

PowJS.prototype.node = function() {
	return this.$.node
}

PowJS.prototype.create = function() {
	let tag = this.view[TAG],
		attrs = this.view[ATTRS];

	this.$.node = this.parent.appendChild(
		tag == '#text' &&
		document.createTextNode('') ||
		document.createElement(tag)
	);

	for (let key in attrs)
		this.$.node.setAttribute(key, attrs[key]);
}

PowJS.prototype.render = function(...args) {
	let node = this.$.node;
	// 根调用, 自创建
	if (!node)
		return this.view[FN].apply(this, args);
	// 渲染子节点
	for (let view of this.view[CHILDS] || []) {
		if (this.$.flag) break;
		new PowJS(node, view, this.$).render(...args);
	}
	// 恢复
	this.$.node = node;
	if (this.$.flag != -1)
		this.$.flag = 0;
}

PowJS.prototype.each = function(iterator, ...args) {
	let k = 0,
		i = args.length;

	// 根调用
	if (!this.$.node) {
		this.$.flag = 1;
		this.view[FN].apply(this, args);
	}

	args = args.concat([null, null]);

	if (toString.call(iterator) == '[object Object]') {
		for (k in iterator) {
			if (this.$.flag) break;
			args[i] = iterator[k];
			args[i + 1] = k;
			this.render.apply(this, args);
		}
	} else {
		for (let v of iterator) {
			if (this.$.flag) break;
			args[i] = v;
			args[i + 1] = k++;
			this.render.apply(this, args);
		}
	}
	if (this.$.flag != 1)
		this.$.flag = 0;
}

PowJS.prototype.text = function(text) {
	if (text == null)
		return this.$.node.textContent;
	this.$.node.textContent = text + '';
}

PowJS.prototype.html = function(html) {
	let node = this.node();
	if (html == null)
		return node.innerHTML || node.textContent;

	if (node.nodeType == TEXT_NODE)
		this.$.node.textContent = html + '';
	else
		this.$.node.innerHTML = html + '';
}

PowJS.prototype.end = function() {
	this.$.flag = -1
}

PowJS.prototype.attr = function(key, val) {
	if (typeof key !== 'string') return;
	if (val === undefined)
		return this.$.node.hasAttribute(key)
			? this.$.node.getAttribute(key)
			: this.$.node[key];
	this.$.node.setAttribute(key, val);
}

PowJS.prototype.slice = function(array, start, end) {
	return Array.prototype.slice.call(array, start, end)
}

function compile(view, node, prefix, discard, args) {
	let body = '',
		render = '',
		each = '';

	if (node.nodeType === TEXT_NODE) {
		body = parseTemplate(node.textContent.trim());
		if (body) {
			view[TAG] = '#text';
			view[ATTRS] = view[CHILDS] = null;
			view[FN] = Function(
				args,
				'this.create();' + body);
		}
		return;
	}

	view[TAG] = node.nodeName;
	view[ATTRS] = view[CHILDS] = null;
	if (node.hasAttribute(prefix + 'args')) {
		args = (node.getAttribute(prefix + 'args') || '').trim();
	}

	if (node.hasAttribute(prefix + 'if')) {
		body = (node.getAttribute(prefix + 'if') || '').trim();

		body = 'if(!(' + (body || '0') + ')) return;';
	}
	body += 'this.create();';

	for (let i = 0; i < node.attributes.length; i++) {
		let attr = node.attributes[i],
			di = directives[
				prefix && attr.name.startsWith(prefix) ?
					attr.name.slice(prefix.length) : attr.name],

			name = !di && attr.name || attr.name.slice(prefix.length),
			val = attr.value.trim();

		if (!di) {
			if (discard && discard.indexOf(name) == -1) {
				view[ATTRS] = view[ATTRS] || Object.create(null);
				view[ATTRS][name] = val;
			}
			continue;
		}
		if (name == 'if' || name == 'args') continue;

		if (!each && !render) {
			render = name == 'render' && val || '';
			each = name == 'each' && val || '';
		}

		body += di(val);
	}

	if (!render && !each)
		body += directives.render(args);
	view[FN] = new Function(args, body);
	for (let i = 0; i < node.childNodes.length; i++) {
		if (node.childNodes[i].nodeType == COMMENT_NODE)
			continue;

		let v = [];
		compile(v, node.childNodes[i], prefix, discard, args);
		if (v.length) {
			view[CHILDS] = view[CHILDS] || [];
			view[CHILDS].push(v);
		}
	}
}

function parseTemplate(txt) {
	if (!txt) return '';

	if (txt.indexOf('{{') == -1)
		return directives.text(JSON.stringify(txt));
	let a = txt.split(TMPL);
	if (a.length & 1 == 0)
		throw new Error('The symbols "{{}}" unpaired: ' + txt);
	txt = '';
	for (let i = 0; i < a.length; i++) {
		if (!a[i]) continue;
		txt += '+' + (i & 1 ? '(' + a[i] + ')' : JSON.stringify(a[i]));
	}

	return directives.text(txt.slice(1));
}
