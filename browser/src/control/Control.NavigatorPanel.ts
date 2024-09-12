/* -*- js-indent-level: 8 -*- */
/*
 * Copyright the Collabora Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*
 * JSDialog.NavigatorPanel
 */

/* global app */
class NavigatorPanel {
	map: any;
	container: HTMLDivElement;
	builder: any;

	constructor(map: any) {
		this.onAdd(map);
	}

	onAdd(map: ReturnType<typeof L.map>) {
		this.map = map;

		app.events.on('resize', this.onResize.bind(this));

		this.builder = new L.control.jsDialogBuilder({
			mobileWizard: this,
			map: map,
			cssClass: 'jsdialog sidebar', // keep sidebar styling for now, change later
		});
		this.container = L.DomUtil.create(
			'div',
			'navigator-container',
			$('#navigator-panel').get(0),
		);

		this.map.on('navigator', this.onNavigator, this);
		this.map.on('jsdialogupdate', this.onJSUpdate, this);
		this.map.on('jsdialogaction', this.onJSAction, this);
	}

	onRemove() {
		this.map.off('navigator');
		this.map.off('jsdialogupdate', this.onJSUpdate, this);
		this.map.off('jsdialogaction', this.onJSAction, this);
	}

	isVisible(): boolean {
		return $('#navigator-dock-wrapper').is(':visible');
	}

	onJSUpdate(e: FireEvent) {
		var data = e.data;

		if (data.jsontype !== 'navigator') return;

		if (!this.container) return;

		if (!this.builder) return;

		// reduce unwanted warnings in console
		if (data.control.id === 'addonimage') {
			window.app.console.log('Ignored update for control: ' + data.control.id);
			return;
		}

		this.builder.updateWidget(this.container, data.control);
	}

	onJSAction(e: FireEvent) {
		var data = e.data;

		if (data.jsontype !== 'navigator') return;

		if (!this.builder) return;

		if (!this.container) return;

		var innerData = data.data;
		if (!innerData) return;

		var controlId = innerData.control_id;

		// Panels share the same name for main containers, do not execute actions for them
		// if panel has to be shown or hidden, full update will appear
		if (
			controlId === 'contents' ||
			controlId === 'Panel' ||
			controlId === 'titlebar' ||
			controlId === 'addonimage'
		) {
			window.app.console.log(
				'Ignored action: ' +
					innerData.action_type +
					' for control: ' +
					controlId,
			);
			return;
		}

		this.builder.executeAction(this.container, innerData);
	}

	onResize() {
		var wrapper = document.getElementById('navigator-dock-wrapper');
		wrapper.style.maxHeight =
			document.getElementById('document-container').getBoundingClientRect()
				.height + 'px';
	}

	closeNavigator() {
		$('#navigator-dock-wrapper').hide();
		this.map._onResize();

		if (!this.map.editorHasFocus()) {
			this.map.fire('editorgotfocus');
			this.map.focus();
		}

		//this.map.uiManager.setDocTypePref('ShowSidebar', false);
	}

	onNavigator(data: FireEvent) {
		var navigatorData = data.data;
		this.builder.setWindowId(navigatorData.id);
		$(this.container).empty();

		if (
			navigatorData.action === 'close' || // todo: i dont know if we ever actually get this call
			window.app.file.disableSidebar ||
			this.map.isReadOnlyMode()
		) {
			this.closeNavigator();
		} else if (navigatorData.children) {
			// for (var i = navigatorData.children.length - 1; i >= 0; i--) {
			//     if (
			//         navigatorData.children[i].type !== 'deck' ||
			//         navigatorData.children[i].visible === false
			//     )
			//         navigatorData.children.splice(i, 1);
			// }

			if (navigatorData.children.length) {
				this.onResize();

				// if (
				//     navigatorData.children &&
				//     navigatorData.children[0] &&
				//     navigatorData.children[0].id
				// ) {
				// this.unsetSelectedSidebar();
				// var currentDeck = sidebarData.children[0].id;
				// this.map.uiManager.setDocTypePref(currentDeck, true);
				// if (this.targetDeckCommand) {
				//     var stateHandler = this.map['stateChangeHandler'];
				//     var isCurrent = stateHandler
				//         ? stateHandler.getItemValue(this.targetDeckCommand)
				//         : false;
				//     // just to be sure chack with other method
				//     if (isCurrent === 'false' || !isCurrent)
				//         isCurrent =
				//             this.targetDeckCommand === this.commandForDeck(currentDeck);
				//     if (this.targetDeckCommand && (isCurrent === 'false' || !isCurrent))
				//         this.changeDeck(this.targetDeckCommand);
				// } else {
				//     this.changeDeck(this.targetDeckCommand);
				// }
			}

			this.builder.build(this.container, [navigatorData]);
			if (!this.isVisible()) $('#sidebar-dock-wrapper').show(200);

			//this.map.uiManager.setDocTypePref('ShowSidebar', true);
		} else {
			this.closeNavigator();
		}
	}
}

JSDialog.NavigatorPanel = function (map: any) {
	return new NavigatorPanel(map);
};
