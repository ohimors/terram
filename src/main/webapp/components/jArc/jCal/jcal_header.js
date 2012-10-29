/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_ui.js" />
/// <reference path="..\ja_datetime.js" />

$.jaCalHeader = function(options, props)
{
    props = $.extend(true, props || {}, { class: 'header', css: { width: '100%'} });
    return $.UI.Hybrid.apply(this, [$.jaCalHeader, 'table', props, arguments]);
}
$.jaCalHeader.prototype =
{
    objConstructor: function(options)
    {
        $('<tr>').appendTo($('<tbody>')
            .appendTo($(this)))
        .append($('<td>', { class: 'header-left', css: { width: '25%', 'text-align': 'left'} }))
        .append($('<td>', { class: 'header-center', css: { 'text-align': 'center'} }))
        .append($('<td>', { class: 'header-right', css: { width: '25%', 'text-align': 'right'} }));
    },
    getLeft: function() { return $(this).find('td.header-left') },
    getCenter: function() { return $(this).find('td.header-center') },
    getRight: function() { return $(this).find('header-right') },
    refresh: function()
    {
        var $left = this.getLeft().empty();
        $('<span>', { class: 'ui-state-default ui-corner-left', css: { position: 'relative', display: 'inline-block', cursor: 'pointer', 'margin-bottom': '1em', 'vertical-align': 'top', 'margin-right': '-1px'} })
            .append($('<span>', { class: 'button-inner', css: { position: 'relative', float: 'left', overflow: 'hidden'} })
                .append($('<span>', { class: 'button-content' })
                    .append($('<span>', { class: 'button-icon-wrap', css: { position: 'relative', float: 'left', top: '50%'} })
                        .append($('<span>', { class: 'ui-icon ui-icon-carat-1-w' })))))
            .append($('<span>', { class: 'button-effect' })
                .append($('<span>')))
            .appendTo($left)
            .$bind($.On.MouseDown, this.evt_button_onmousedown)
            .$bind($.On.MouseUp, this.evt_button_onmouseup)
            .$bind($.On.MouseEnter, this.evt_button_onmouseenter)
            .$bind($.On.MouseLeave, this.evt_button_onmouseleave)
            .$bind($.On.Click, this.evt_prev_onclick, this);
        $('<span>', { class: 'ui-state-default ui-corner-right', css: { position: 'relative', display: 'inline-block', cursor: 'pointer', 'margin-bottom': '1em', 'vertical-align': 'top', 'margin-right': '-1px'} })
            .append($('<span>', { class: 'button-inner', css: { position: 'relative', float: 'left', overflow: 'hidden'} })
                .append($('<span>', { class: 'button-content' })
                    .append($('<span>', { class: 'button-icon-wrap', css: { position: 'relative', float: 'left', top: '50%'} })
                        .append($('<span>', { class: 'ui-icon ui-icon-carat-1-e' })))))
            .append($('<span>', { class: 'button-effect' })
                .append($('<span>')))
            .appendTo($left)
            .$bind($.On.MouseDown, this.evt_button_onmousedown)
            .$bind($.On.MouseUp, this.evt_button_onmouseup)
            .$bind($.On.MouseEnter, this.evt_button_onmouseenter)
            .$bind($.On.MouseLeave, this.evt_button_onmouseleave)
            .$bind($.On.Click, this.evt_next_onclick, this);
        // $center.append($('<span>', { class: 'header-space' }));
        $('<span>', { class: 'header-title', css: { display: 'inline-block', 'vertical-align': 'top'} })
            .append($('<h2>', { css: { 'margin-top': '0px', 'white-space': 'nowrap'} }).html('Title'))
            .appendTo(this.getCenter().empty());
        // $center.append($('<span>', { class: 'header-space' }));
        return this;
    },
    setTitle: function(text)
    {
        $(this).find('h2').html(text);
    },
    evt_prev_onclick: function(oEvt)
    {
        $(this).customEvent($.jaCalHeader.On.Prev, oEvt).trigger();
    },
    evt_next_onclick: function(oEvt)
    {
        $(this).customEvent($.jaCalHeader.On.Next, oEvt).trigger();
    },
    evt_button_onmousedown: function(oEvt)
    {
        $(this).not('.ui-state-active')
            .not('.ui-state-disabled')
            .addClass('ui-state-down')
    },
    evt_button_onmouseup: function(oEvt)
    {
        $(this).removeClass('ui-state-down')
    },
    evt_button_onmouseenter: function(oEvt)
    {
        $(this).not('.ui-state-active')
            .not('.ui-state-disabled')
            .addClass('ui-state-hover')
    },
    evt_button_onmouseleave: function(oEvt)
    {
        $(this).removeClass('ui-state-hover')
            .removeClass('ui-state-down')
    }
}
$.jaCalHeader.derivesFrom($.UI.Hybrid);

$.jaCalHeader.On =
{
    Next: 'jCal_next',
    Prev: 'jCal_prev'
}