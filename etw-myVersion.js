/*
 *	usage:
 *
 *	js file
 *	=======
 *	$('#tableID').tableEdit({
 *		cloneProperties: [...],
 *		trimValue      : false,
 *		selectable     : false,
 *		deletable      : false,
 *		selectedMarker : 'selected',
 *		deleteMarker   : 'deleteMark',
 *		onValidate     : function(value, col, row) {
 *			if (value === '')
 *				return false
 *		},
 *		isCellEditable : function(colName, col, row) {
 *			if (col === 0)
 *				return false
 *		}
 *	})
 *
 *	css file
 *	========
 *	tr.selected { background-color: #456 }
 *	tr.deleteMark { background-color: #f00 }
 */

; !function ($) {
	'use strict'

	$.fn.tableEdit = function (options) {
		'use strict';
		return $(this).each(function () {
			var
				ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40,
				ENTER = 13, ESC = 27, TAB = 9, SPACE = 32, DELETE = 46,

				buildDefaultOptions = function () {
					var opts = {
						cloneProperties: [
							'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
							'text-align', 'font', 'font-size', 'font-family', 'font-weight',
							'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
						],
						trimValue  : true,
						selectable : true,
						deletable  : true,
						selectedMarker  : 'info',
						deleteMarker : 'danger',

						editor: $('<input>')
					}
					//opts.editor = opts.editor.clone()
					return opts;
				},
				activeOptions   = $.extend(buildDefaultOptions(), options),
				selectedFinder  = 'tbody tr.' + activeOptions.selectedMarker,
				deleteFinder = 'tbody tr.' + activeOptions.deleteMarker,

				currTable = $(this),
				editor    = activeOptions.editor.css('position', 'absolute').hide().appendTo(currTable.parent()),
				activeCell,

				showEditor = function (select) {
					activeCell = currTable.find('td:focus')
					if (activeCell.length < 1 || ($.isFunction(activeOptions.isCellEditable) && activeOptions.isCellEditable.call(activeCell,
						$.trim(currTable.find('thead tr').children().eq(activeCell.index()).text()), activeCell.index(), activeCell.parent().index()) === false)) {
						return
					}

					editor.val(activeOptions.trimValue ? $.trim(activeCell.text()) : activeCell.text())
						.removeClass('error')
						.show()
						.offset(activeCell.offset())
						.css(activeCell.css(activeOptions.cloneProperties))
						.width(activeCell.width())
						.height(activeCell.height())
						.focus()

					if (select) {
						editor.select()
					}
				},

				setActiveText = function () {
					var text = editor.val(),
						evt  = $.Event('change.etw'),
						originalContent

					if (activeCell.text() === text || editor.hasClass('error')) {
						return true
					}

					originalContent = activeCell.html()
					activeCell.text(text).trigger(evt, text)
					if (evt.result === false) { //change can be reject
						activeCell.html(originalContent)
					}
				},

				movement = function (element, keycode) {
					if (keycode === ARROW_RIGHT) {
						return element.next('td')
					} else if (keycode === ARROW_LEFT) {
						return element.prev('td')
					} else if (keycode === ARROW_UP) {
						return element.parent().prev().children().eq(element.index())
					} else if (keycode === ARROW_DOWN) {
						return element.parent().next().children().eq(element.index())
					}
					return []
				}

			//editor setting
			editor.blur(function () {
				setActiveText()
				editor.hide()
				})
				.keydown(function (e) {
					if (e.which === ENTER) {
						setActiveText()
						editor.hide()
						activeCell.focus()
						e.preventDefault()
						e.stopPropagation()

					} else if (e.which === ESC) {
						editor.val(activeCell.text())
						e.preventDefault()
						e.stopPropagation()
						editor.hide()
						activeCell.focus()

					} else if (e.which === TAB) {
						activeCell.focus()

						//if all text selected,move active cell (otherwise move cursor)
					} else if (this.selectionEnd - this.selectionStart === this.value.length) {
						var possibleMove = movement(activeCell, e.which)
						if (possibleMove.length > 0) {
							possibleMove.focus()
							e.preventDefault()
							e.stopPropagation()
						}
					}
				})
				.on('input.etw paste.etw propertychange.etw.forIE', function () {
					if ($.isFunction(activeOptions.onValidate) &&
						activeOptions.onValidate.call(activeCell,
							editor.val(),
							activeCell.index(),
							activeCell.parent().index()) === false) {
						editor.addClass('error')
					} else {
						editor.removeClass('error')
					}
				})

			//table setting
			currTable.css('cursor', 'pointer')
				.on('click.etw', 'tbody tr', function (e) {
					if (!activeOptions.selectable) {
						return
					}
					if (!e.ctrlKey) {
						currTable.find(selectedFinder).removeClass(activeOptions.selectedMarker)
						currTable.find(deleteFinder).removeClass(activeOptions.deleteMarker)
					}
					$(this).removeClass(activeOptions.deleteMarker).toggleClass(activeOptions.selectedMarker)
					e.stopPropagation()
				})
				.on('keypress.etw dblclick.etw', function () {
					showEditor(true)
				})
				.keydown(function (e) {
					var prevent = true,
						possibleMove = movement($(e.target), e.which),
						preDeleteRows

					if (possibleMove.length > 0) {
						possibleMove.focus()
					} else if (e.which === SPACE) {
						showEditor(true)
					} else if (e.which === ENTER) {
						preDeleteRows = currTable.find(deleteFinder)
						if (preDeleteRows.length) {
							preDeleteRows.remove()
						} else {
							showEditor(false)
						}
					}else if (e.which === DELETE && activeOptions.deletable) {
						currTable.find(deleteFinder).remove()
						currTable.find(selectedFinder).addClass(activeOptions.deleteMarker)
					} else if (e.which === ESC) {
						currTable.find(deleteFinder).removeClass(activeOptions.deleteMarker)
						currTable.find(selectedFinder).removeClass(activeOptions.selectedMarker)
					} else {
						prevent = false;
					}
					if (prevent) {
						e.stopPropagation()
						e.preventDefault()
					}
				})

			currTable.find('td').prop('tabindex', 1)

			$(window).on('resize.etw', function () {
				if (editor.is(':visible')) {
					editor.offset(activeCell.offset())
						.width(activeCell.width())
						.height(activeCell.height())
				}
			})
			.on('click.etw', function () {
				currTable.find(selectedFinder).removeClass(activeOptions.selectedMarker)
				currTable.find(deleteFinder).removeClass(activeOptions.deleteMarker)
			})
		})
	}

} (jQuery)
