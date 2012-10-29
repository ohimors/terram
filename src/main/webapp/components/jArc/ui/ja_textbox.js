/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />

(function($)
{
    $.jaTextbox = function(sHolderId, sTxtbxId, sExampleText)
    {
        this.sHolderId = sHolderId;
        this.sTxtbxId = sTxtbxId;
        this.sHintId = sTxtbxId + '_hint';

        sExampleText = $.valOrDef(sExampleText, '');
        var sCurrText = this.getValue();

        var $el = $(this.sHolderId).css({ position: 'relative' });

        this.get_Textbox()
        .$bind($.On.KeyPress, this.evt_Textbox_onkeypress, this)
        .$bind($.On.KeyUp, this.evt_Textbox_onkeyup, this)
        .$bind($.On.Input, this.evt_Textbox_oninput, this)
        .$bind($.On.ContextMenu, this.evt_Textbox_oncontextmenu, this)  /* Attempt to re-show the placeholder after the context-menu is visible */
        .data('prev', sCurrText);

        var $hintHolder = $('<div>').css({ position: 'absolute', top: '0px', left: '0px', zIndex: 5, width: '100%' }).appendTo($el);

        var sElId = this.sHintId;
        while(sElId.startsWith('#'))
            sElId = sElId.substring(1);
        this.sHintId = '#' + sElId;
        var $example = $('<div>', { class: 'placeholder', id: sElId })
                    .html(sExampleText)
                    .css({ cursor: 'text' })
                    .appendTo($hintHolder)

        if ($.isStrVal(sCurrText))
            $example.hide();
        else
            $example.show();

        $hintHolder.$bind($.On.Click, this.evt_Hint_onclick, this) /* Send focus to the textbox when the example is clicked */
            .$bind($.On.MouseDown, this.evt_Hint_onmousedown, this);  /* Hide example on right-click to allow right-click to move to the textbox */
    }
    $.jaTextbox.prototype =
    {
        get_Textbox: function() { return $(this.sTxtbxId) },
        get_Hint: function() { return $(this.sHintId) },
        getValue: function() { return this.get_Textbox().val() },
        evt_Hint_onmousedown: function(oEvt)
        {
            if (oEvt.which == 3)
                this.hideEx();
        },
        evt_Hint_onclick: function(oEvt) 
        { 
            this.get_Textbox().trigger($.Event($.On.Focus)) 
        },
        evt_Textbox_oncontextmenu: function(oEvt) { this.updateEx(oEvt) },
        evt_Textbox_oninput: function(oEvt) { this.updateEx(oEvt) },
        evt_Textbox_onkeypress: function(oEvt) { this.updateEx(oEvt) },
        evt_Textbox_onkeyup: function(oEvt) { this.updateEx(oEvt) },
        evt_Textbox_onpaste: function(oEvt) { $.runAfter(this.updateEx, this, [oEvt]) },
        updateEx: function(oEvt)
        {
            var $txtbx = this.get_Textbox();
            if (!$.isStrVal($txtbx.val()))
                this.showEx();
            else
                this.hideEx();

            if ($txtbx.val() !== $txtbx.data('prev'))
                $(this).customEvent($.On.Input, oEvt).trigger();

            $txtbx.data('prev', $txtbx.val());
        },
        hideEx: function() { this.get_Hint().hide() },
        showEx: function() { this.get_Hint().show() }
    }
})(jQuery);