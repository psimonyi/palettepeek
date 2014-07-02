/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* PalettePeek extension: This provides a way to use the things that show up in
 * the palette without having to give them all their own space in the toolbar
 * or menu panel. */
/* main.js: This file is run only from startup() in bootstrap.js. */

'use strict';

const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const A = CustomizableUI; // A for Australis, because it's short.
const ppWidgetId = 'palettepeek-widget';
const ppViewId = 'palettepeek-view';
const ppAreaId = 'palettepeek-area';

// The docs seem to suggest creating the view panel in onBeforeCreate, but
// there's no good way to undo that when the extension is removed.  So we do it
// once per window, where it's easy, though we don't get to take advantage of
// the lazy-create nature of the menu panel.  TODO: find a better way.
eachWindow(createPanelView, destroyPanelView);

function createPanelView(aWin) {
    let document = aWin.document;

    let view = document.createElementNS(NS_XUL, 'panelview');
    view.setAttribute('id', ppViewId);
    view.setAttribute('flex', '1');
    view.setAttribute('class', 'PanelUI-subView');

    let label = document.createElementNS(NS_XUL, 'label');
    label.setAttribute('value', text('panel.title'));
    label.setAttribute('class', 'panel-subview-header');

    let vbox = document.createElementNS(NS_XUL, 'vbox');
    vbox.setAttribute('id', ppAreaId);
    vbox.setAttribute('class', 'panel-subview-body');
    vbox.customizationTarget = vbox;
    vbox.toolbox = aWin.gNavToolbox;

    view.appendChild(label);
    view.appendChild(vbox);
    document.getElementById('PanelUI-multiView').appendChild(view);
}

function destroyPanelView(aWin) {
    let view = aWin.document.getElementById(ppViewId);
    if (view) {
        view.parentNode.removeChild(view);
    }
}


let PalettePeek = {
    id: ppWidgetId,
    type: 'view',
    viewId: ppViewId,
    tooltiptext: text('widget.tooltip'),
    label: text('widget.label'),
    defaultArea: A.AREA_PANEL,
    onViewShowing: onViewShowing,
    onViewHiding: onViewHiding,
};

A.createWidget(PalettePeek);
toUndo(_=> CustomizableUI.destroyWidget(PalettePeek.id));

function onViewShowing(event) {
    let document = event.target.ownerDocument;
    let window = document.defaultView;
    let palette = window.gNavToolbox.palette;
    let palettepeekArea = document.getElementById(ppAreaId);

    A.registerArea(ppAreaId, {
        type: A.TYPE_MENU_PANEL,
        anchor: palettepeekArea,
    });
    A.registerToolbarNode(palettepeekArea, []);

    orderWidgets(window, A.getUnusedWidgets(palette)).forEach(widget => {
        A.addWidgetToArea(widget.id, ppAreaId);
    });

    let inPanel =
        A.getPlacementOfWidget(ppWidgetId).area == A.AREA_PANEL;
    palettepeekArea.classList.toggle('panelUI-grid', inPanel);
    palettepeekArea.classList.toggle('widget-overflow-list', !inPanel);
}

/* Wide widgets go at the top. Returns a new array. */
function orderWidgets(window, widgets) {
    let sorted = [];
    widgets.forEach(w => {
        if (w.forWindow(window).node.classList.contains('panel-wide-item')) {
            sorted.unshift(w);
        } else {
            sorted.push(w);
        }
    });
    return sorted;
}

function onViewHiding(event) {
    // This also removes all widgets from the area, so it's as if they never
    // left the palette.
    A.unregisterArea(ppAreaId, true);
}

