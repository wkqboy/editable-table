/*
 *	usage:
 *	$('#tableID').editableTableWidget({
 *		cloneProperties: [],
 *		onValidate     : function(value, col, row) {
 *			//code
 *		},
 *		isCellEditable : function(colName, col, row) {
 *			//code
 *		},
 *		trimValue      : false
 *	})
 */

; !function ($) {
	'use strict'

	$.fn.editableTableWidget = function (options) {
		'use strict';
		return $(this).each(function () {
			var
				ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40,
				ENTER = 13, ESC = 27, TAB = 9, SPACE = 32,

				buildDefaultOptions = function () {
					var opts = {
						cloneProperties: [
							'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
							'text-align', 'font', 'font-size', 'font-family', 'font-weight',
							'border', 'border-top', 'border-bottom', 'border-left', 'border-right'
						],
						trimValue: true,
						editor: $('<input>')
					}
					//opts.editor = opts.editor.clone()
					return opts;
				},
				activeOptions = $.extend(buildDefaultOptions(), options),

				currTable = $(this),
				editor = activeOptions.editor.css('position', 'absolute').hide().appendTo(currTable.parent()),
				activeCell,

				showEditor = function (select) {
					activeCell = currTable.find('td:focus')
					if (activeCell.length < 1 || ($.isFunction(activeOptions.isCellEditable) && activeOptions.isCellEditable.call(
						activeCell, $.trim(currTable.find('thead tr').children().eq(activeCell.index()).text()), activeCell.index(), activeCell.parent().index()) === false)) {
						return
					}

					editor.val(activeOptions.trimValue ? $.trim(activeCell.text()) : activeCell.text()) //trim ?
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
						evt = $.Event('change'),
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
				.on('input.etw paste.etw', function () {
					if ($.isFunction(activeOptions.onValidate) &&
						activeOptions.onValidate.call(
							activeCell,
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
				.on('click.etw keypress.etw dblclick.etw', function () {
					showEditor(true)
				})
				.keydown(function (e) {
					var prevent = true,
						possibleMove = movement($(e.target), e.which);
					if (possibleMove.length > 0) {
						possibleMove.focus();
					} else if (e.which === ENTER || e.which === SPACE) {
						showEditor(false);
					} else {
						prevent = false;
					}
					if (prevent) {
						e.stopPropagation();
						e.preventDefault();
					}
				})

			currTable.find('td').prop('tabindex', 1);

			$(window).on('resize.etw', function () {
				if (editor.is(':visible')) {
					editor.offset(activeCell.offset())
						.width(activeCell.width())
						.height(activeCell.height());
				}
			})
		})
	}

} (jQuery)
