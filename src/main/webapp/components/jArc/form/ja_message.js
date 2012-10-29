/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />

(function($)
{
    $.MSG =
    {
        Type:
        {
            Error: 0,
            Help: 1
        },
        On:
        {
            Display: 'display',
            Displayed: 'displayed',
            Dismiss: 'dismiss',
            Dismissed: 'dismissed'
        }
    }

    $.MSG.Base = function(eType, iIndex, oData, sHolderId, sMsgId)
    {
        this.type = eType;
        this.index = iIndex;
        this.id = $.valOrDef(sHolderId, '');
        this.msgId = $.valOrDef(sMsgId, '');
        this.data = oData;
        this.hidden = false;
    }
    $.MSG.Base.prototype =
    {
        'get': function() { return $(this.id) },
        getMsg: function() { return $(this.msgId) },
        display: function(oEvt)
        {
            var $msg = this.getMsg().empty();
            var $el = this.get();
            if (this.hasData())
            {
                if (exists(this.data.text))
                {
                    if ($.is$(this.data.text))
                        $msg.empty().append(this.data.text);
                    else
                        $msg.empty().html(this.data.text);
                }
                $el.show();
                $(this).customEvent($.MSG.On.Displayed, oEvt).trigger();
            }
            else
            {
                $el.hide();
                $(this).customEvent($.MSG.On.Dismissed, oEvt).trigger();
            }
            return this;
        },
        dismiss: function(oEvt)
        {
            this.getMsg().empty();
            this.get().hide();
            $(this).customEvent($.MSG.On.Dismissed, oEvt).trigger();

            return this;
        },
        show: function()
        {
            /// <summary>If message has info, makes part or all of the message visible. Otherwise, hides the message.</summary>
            // If attached to a Message Handler, do not display directly
            this.hidden = false;
            $(this).customEvent($.MSG.On.Display).trigger();
            return this;
        },
        hide: function()
        {
            /// <summary>Hides the message</summary>
            this.hidden = true;
            $(this).customEvent($.MSG.On.Dismiss).trigger();
            return this;
        },
        clear: function()
        {
            ///<summary>Clears the message data and hides the message</summary>
            if (exists(this.data))
            {
                this.data = null;
                this.hidden = false;
                this.hide();
            }
            return this;
        },
        "set": function(oData)
        {
            ///<summary>Sets the message data, and updates the message visibility based on the existance of that data</summary>
            ///<param name="oData">(Object) Message Data</param>
            this.data = oData;
            this.hidden = false;
            return this.show();
        },
        hasData: function() { return exists(this.data) }
    }

    $.MSG.Data = function(sText, aFields)
    {
        this.text = $.valOrDef(sText, null);
        this.fields = $.valOrDef(aFields, []);
    }

    $.MSG.Data.Error = function(iErrCode, sText, aFields)
    {
        $.MSG.Data.apply(this, [sText, aFields]);
        this.error = iErrCode;
    }
    $.MSG.Data.Error.derivesFrom($.MSG.Data);

    /*************** 'Inline-Style' Message Handling ****************************/

    $.MSG.Inline = function(eType, iIndex, sHolderId, sMsgId)
    {
        $.MSG.Base.apply(this, [eType, iIndex, null, sHolderId, sMsgId]);

        $.MSG.InlineHandler.Instance().attach(this);
    }
    $.MSG.Inline.derivesFrom($.MSG.Base);

    $.MSG.InlineHandler = function()
    {
        this.childNodes = [];
        this.m_oMsg = null;
    }
    $.MSG.InlineHandler.prototype =
    {
        attach: function(oMessage)
        {
            $(oMessage).$bind($.MSG.On.Display + '.try', this.evt_msg_ontrydisplay, this)
                .$bind($.MSG.On.Displayed, this.evt_msg_ondisplayed, this)
                .$bind($.MSG.On.Dismissed, this.evt_msg_ondismissed, this)
                .$appendTo($(this));
            this.childNodes.sort(this.msgSort);
            return this;
        },
        msgSort: function(o1, o2)
        {
            if (o1.type == o2.type)
                return o1.index - o2.index;
            return o1.type - o2.type;
        },
        findDisplayMsg: function()
        {
            var oTarget = null;
            $.each(this.childNodes,
            function(idx, oMsg)
            {
                if (oMsg.hasData() && !oMsg.hidden)
                {
                    oTarget = oMsg;
                    return false;
                }
            });
            return oTarget;
        },
        clearType: function(eType, oException)
        {
            $.each(this.childNodes,
            function(idx, oMsg)
            {
                if (oMsg.type === eType &&
                    (!exists(oException) || oMsg !== oException))
                    oMsg.clear();
            });
            return this;
        },
        evt_msg_ondisplayed: function(oEvt)
        {
            this.m_oMsg = oEvt.target;
        },
        evt_msg_ontrydisplay: function(oEvt)
        {
            // Only one help message can have data at a time
            // This prevents other help from appearing as soon as one is hidden
            if (oEvt.target.type === $.MSG.Type.Help)
                this.clearType($.MSG.Type.Help, oEvt.target);

            var oToShow = this.findDisplayMsg();

            // First, figure out if the current message needs to be hidden
            if (exists(this.m_oMsg) && this.m_oMsg !== oToShow)
            {
                // Hide current messsage, which will trigger another to be shown
                this.m_oMsg.hide();
            }
            else if (exists(oToShow))
            {
                // Show the correct message
                oToShow.display();
            }

            return false;
        },
        evt_msg_ondismissed: function(oEvt)
        {
            // If currently displayed message is being hidden, see if another one should be displayed
            if (this.m_oMsg === oEvt.target)
            {
                this.m_oMsg = null;
                var oToShow = this.findDisplayMsg();
                // Attempt to actually show the message
                if (exists(oToShow))
                    $(oToShow).customEvent($.MSG.On.Display, oEvt).trigger();
            }
        }
    }
    $.MSG.InlineHandler.Instance = function()
    {
        if (!exists($.MSG.InlineHandler._instance))
            $.MSG.InlineHandler._instance = new $.MSG.InlineHandler();
        return $.MSG.InlineHandler._instance;
    }
})(jQuery);