(function(global) {
	"use strict"
	var pow = global.Pow

	pow.extend(pow,
		load
	)


	function load(xTags) {
		/**
			返回由 xTags 生成 DOM 树的函数.

			参数:
				xTags  Pow.build 的结果.

			返回:
				function(args[, callback])
				参数:
				    args     为数组, 表示传入的参数 [arg1,arg2 ...].
				    callback 回调函数 function(node, index)
				    	node  为顶级节点, #document-fragment 下的节点可能会被提升到顶级.
				    	index 为该节点对应的 tag 在 xTags 中的序号.

				返回值:
					如果设置了 callback, 无返回值.
					否则返回所有生成的顶级节点数组.

			指令执行期 this 属性:
				Pow         当前的 PowJS 对象
				attrs       当前节点模板中设置的属性. 这是个普通 Object 对象.
				node        当前 Node 对象
				ownership() 该函数内部调用 pure 返回新的执行函数.
				下列属性用于内部计算
				index       xTags 开始索引
				pos         节点中要执行的指令索引, 指令中调用 ownership() 时不为 0
				parentIndex 结束节点判定

			指令执行:
			    1. PowJS 保障当前节点被建立并设置已知属性, 如果有父节点, 添加到其子节点.
			    2. 指令被执行, 指令获得节点操作权, 但不包括删除, 移动操作, 那将产生未知后果.
				3. 指令结束, PowJS 依据返回值对节点进行操作并确定下一个节点.

			指令返回值:
				1. null,undefined 对当前节点树不进行任何处理, 立即执行后续节点.
				2. 数组           传递参数, 继续按顺序执行.
				3. 字符串         标记丢弃范围, 不区分大小写, 以 "," 号分隔可组合:
					"this"          立即丢弃当前节点树, 执行后续节点.
					"others"        标记丢弃其它后续节点, 执行完当前节点树后结束. 简写 "other"
					"childNodes"    标记丢弃后代, 继续按顺序执行. 简写 "child"
					"nextSiblings"  标记丢弃后续兄弟节点, 继续按顺序执行父节点的后续兄弟节点. 简写 "next"
				4. 其它值 抛出异常

				返回值决定 PowJS 对节点的操作行为以及节点执行范围.
				标记丢弃并不会立即执行, 而是等到该节点指令(属性)执行完才处理.
				这意味着, 可多次标记, 最后一次标记值是生效的丢弃范围.
				在内部, PowJS 使用 ownership 来处理丢弃范围.

			ownership:
				以 PowJS 指令 each/repeate 的执行顺序为例:

				1. 指令内部就调用了 __ship = ownership().
				2. 指令继续执行, 开始循环调用 __ship(args...), 这会生成后代节点.
				3. 循环结束, 指令结束且无返回值
				4. PowJS 发现返回值是 undefined, 不做节点操作, 执行后续兄弟节点.

				语义上这表示指令要自己负责某个节点树的操作.
				事实上 PowJS 无法预测操作行为, 即便是异步操作也需要被支持.
				所以对 PowJS 来说 ownership 是透明的, PowJS 依然依据指令返回值决定节点操作.
				若指令调用了 ownership 要返回合适的值.
		 */
		var range


		if (typeof xTags == 'string') {
			xTags = this.build(this.toTags(xTags))
		}

		if (!this.isArray(xTags) || xTags[0] && !this.isArray(xTags[0]))
			throw Error('link: invalid arguments ')

		return ownership(this, xTags, [], [], {
			index: 0, // 开始节点序号
			pos: 0, // 开始指令序号
			parentIndex: -2, // 父节点序号可, 决定结束位置, -2 可允许所有
			attrs: null
		})
	}

	function ownership(pow, xTags, initNodes, initArgs, range) {
		var scope = Object.create(null),
			doc = pow.document

		scope.Pow = pow

		return function(args, topNodeReceiver) {
			// 函数可能被重复调用, 要保障 range 以及其它初始值 
			var offset = range.index,
				pos = range.pos,
				parentIndex = range.parentIndex,
				nodes = initNodes.slice(0),
				Args = initArgs.slice(0),
				//
				topNodes, index, next, tag, nodeNameDI,

				// 保存每一个生成的 scope.node
				storeNode = function() {
					var node, _ = tag.index

					// 非顶级节点, 追溯 #document-fragment 情况下的真正父节点
					// 如果当前节点是 #document-fragment 直接返回, 等待子节点追溯
					// 这意味着 topNodeReceiver 接收到的节点不可能是 #document-fragment 节点,
					// #document-fragment 子节点被提升.
					if (scope.node.nodeType == 11) return

					do {
						_ = xTags[_][0].parentIndex
						node = nodes[_]

						// 提升到顶级
						if (!node || _ <= parentIndex) {
							topNodeReceiver(scope.node, tag.index)
							return
						}

					} while (node && node.nodeType == 11)
				},
				appendNode = function() {
					// 追溯父节点并添加
					var node, _ = tag.index
					nodes[_] = scope.node
					if (scope.node.nodeType == 11) return
					do {
						_ = xTags[_][0].parentIndex
						node = nodes[_]
						if (!node || _ <= parentIndex) {
							return
						}

					} while (node && node.nodeType == 11)

					node.appendChild(scope.node)
				}

			if (arguments.length && !pow.isArray(args)) {
				throw Error('runtime: args must be an Array')
			}

			if (!topNodeReceiver) {
				topNodes = []
				topNodeReceiver = function(node) {
					topNodes.push(node)
				}
			}

			scope.ownership = function() {
				var range = {
					index: index,
					pos: pos + 1,
					parentIndex: tag.parentIndex,
					attrs: scope.attrs
				}

				return ownership(pow, xTags, nodes, Args, range)
			}

			xTags.slice(offset).some(function(tags, i) {
				next = null
				tag = tags[0]
				nodeNameDI = tag.nodeNameDI // 标签指令
				index = tag.index

				args = Args[tag.parentIndex] || args || [] // 计算参数

				// 范围, 第一个总是通过, 再次出现相同 parentIndex 就终止
				if (i && tag.parentIndex <= parentIndex) {
					return true
				}


				scope.attrs = pow.pick(tag.attrs)
				tags = pos && tags.slice(pos) || tags
				scope.node = null

				// ownership 模式 pos 仅用于第一个 tags
				tags.some(function(x, _) {
					pos = pos + _ // 后面有 pos 清零技巧

					// 支持指令中调用 ownership 和标签指令
					if (!pos && !nodeNameDI || nodeNameDI && pos == 2) {
						if (!scope.node) {
							switch (scope.attrs.nodeName) {
								case '#text':
									scope.node = doc.createTextNode(scope.attrs.textContent || '')
									break
								case '#comment':
									scope.node = doc.createComment(scope.attrs.textContent || '')
									break
								case '#document-fragment':
									scope.node = doc.createDocumentFragment()
									break
								default:
									scope.node = doc.createElement(scope.attrs.nodeName)
									pow(scope.node).attr(scope.attrs)
									break
							}
						}
						_ = tag.index

						// 仅仅保存新节点, 先不调用 storeNode, 因为可能被删除
						appendNode()
					}

					if (!pos) return

					// 执行
					_ = args.length ? x.apply(scope, args) : x.apply(scope, [null])

					// 继续
					if (pow.isArray(_)) {
						args = _
						return
					}

					if (_ == null) {
						return true
					}

					if (typeof _ != 'string') {
						throw Error('runtime: invalid results: ' + JSON.stringify(_))
					}

					_ = pow.parameters(_.toLowerCase())


					if (_.indexOf('child') != -1) { // childNodes
						next = 'nextSibling'
					}

					if (_.indexOf('next') != -1) { // nextSiblings
						next = 'parentNextSibling'
					}

					// 组合 others 和 this

					if (_.indexOf('other') != -1) { // others
						if (_.indexOf('this') != -1) {
							next = 'none' // stop
						} else {
							next = 'childNodes only'
						}
					}

					if (_.indexOf('this') != -1) {
						nodes[index] && nodes[index].parentNode &&
							nodes[index].parentNode.removeChild(nodes[index])

						scope.node = null
						next = next || 'nextSibling'

						// 立即执行
						return true
					}


					if (next == null) {
						throw Error('runtime: invalid results: ' + JSON.stringify(_.join(',')))
					}
				})

				// 如果节点没有被删除, 那么保存
				if (scope.node) storeNode()

				Args[index] = args

				// 限定范围需要新的 ownership, 以便嵌套使用
				if (next) return true

				// 清零
				pos = 0
				scope.node = null
			})

			if (!next || next == 'none') return topNodes

			// 丢弃模式下嵌套 ownership
			range.pos = 0
			range.index = xTags.length // 置空范围
			range.parentIndex = parentIndex // 不能超过原限定范围
			switch (next) {
				case 'nextSibling':
					pos = xTags[index][0].parentIndex
					while (true) {
						next = xTags[++index][0]
						if (next.parentIndex <= parentIndex) break
						if (next.parentIndex == pos) {
							range.index = index
							break
						}
					}
					break
				case 'parentNextSibling':
					pos = xTags[index][0].parentIndex
					if (pos <= parentIndex) break
					pos = xTags[pos][0].parentIndex
					while (true) {
						next = xTags[++index][0]
						if (next.parentIndex <= parentIndex) break
						if (next.parentIndex == pos) {
							range.index = index
							break
						}
					}
					break
				case 'childNodes only':
					next = xTags[index + 1]
					if (!next || next[0].parentIndex != index) {
						break
					}
					range.parentIndex = xTags[index][0].parentIndex
					range.index = index + 1
					break
			}

			if (range.index != xTags.length) {
				ownership(pow, xTags, nodes, Args, range)(args, topNodeReceiver)
			}

			return topNodes
		}
	}
})(this)