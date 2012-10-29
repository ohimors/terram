/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />

(function($)
{
    $.INPUT = {};

    $.INPUT.Base = function(id, sTag, oRequired)
    {
        this.id = id;
        this.tag = sTag;
        this.req = $.valOrDef(oRequired, {});
    }
    $.INPUT.Base.prototype =
    {
        // abstract methods - these must be overridden
        getValue: function()
        {
            if (this.exists())
                return this.get().val();
            return null;
        },
        setValue: function(oValue)
        {
            if (this.exists())
                this.get().val(oValue);
            return this;
        },
        clearValue: function()
        {
            this.setValue("");
            return this;
        },
        getName: function()
        {
            if (this.exists())
                return this.get().attr('name');
            return null
        },

        // virtual methods - these should work for most cases, but
        // should be overridden when needed
        setFocus: function(fSelect)
        {
            this.get().focus();
            if (fSelect)
                this.get().select();
            return this;
        },
        isValidEvent: function(sEvt) { return true },
        handleInvalidEvent: function(oEvtInfo) { return this },

        // common methods - these shouldn't be overriden
        "get": function() { return $(this.id) },
        exists: function()
        {
            var fValid = false;
            var $el = this.get();
            if ($.isElement($el, this.tag))
            {
                fValid = true;
                $.each(this.req, 
                    function(prop, val)
                    {
                        if ($.isFunction(val))
                            fValid = val($el.attr(prop));
                        else if ($el.attr(prop) !== val)
                            fValid = false;
                        return fValid;
                    }
                );
            }
            return fValid;
        },
        attachEvents: function(arrEvts)
        {
            if (this.exists())
            {
                var el = this.get();
                for (var i = 0; i < arrEvts.length; i++)
                {
                    if (this.isValidEvent(arrEvts[i].name))
                        el.$bind(arrEvts[i].name, arrEvts[i].handler, arrEvts[i].context);
                    else
                        this.handleInvalidEvent(arrEvts[i]);
                }
            }
        }
    }

    $.INPUT.jaTextbox = function(oTxtbx, id)
    {
        $.INPUT.Base.apply(this, [id, 'input', { type: $.isTextboxType}]);
        this.m_jaTxtbx = oTxtbx;
    }
    $.INPUT.jaTextbox.prototype =
    {
        // $.INPUT.Base overrides
        getValue: function()
        {
            if (this.exists())
            {
                var sText = this.get_Object().getValue();
                return $.InputType.Password.equals(sText, true) ? sText : $.trim(sText);
            }
            return null;
        },
        setValue: function(oValue)
        {
            if (this.exists())
            {
                var $Txtbx = this.get();
                $Txtbx.data('prev', $Txtbx.val())
                      .val(oValue);
                if (!$.isStrVal(oValue))
                    this.get_Object().showEx();
                else
                    this.get_Object().hideEx();
            }
        },
        isValidEvent: function(sEvt) { return !sEvt.equals($.On.Input, true) },
        "get": function()
        {
            var jaTxtbx = this.get_Object();
            if (exists(jaTxtbx))
                return jaTxtbx.get_Textbox();
            return null
        },
        handleInvalidEvent: function(oEvtInfo)
        {
            $(this.get_Object()).$bind(oEvtInfo.name, oEvtInfo.handler, oEvtInfo.context);
        },

        get_Object: function() { return this.m_jaTxtbx }
    }
    $.INPUT.jaTextbox.derivesFrom($.INPUT.Base);

    $.INPUT.Selectable = function(id, sTag)
    {
        $.INPUT.Base.apply(this, [id, sTag]);
        var el = this.get();
        this.get()
        .$bind($.On.Focus, this.evt_element_onfocus, this)
        .$bind($.On.Blur, this.evt_element_onblur, this);
    }
    $.INPUT.Selectable.prototype =
    {
        isValidEvent: function(sEvt)
        {
            return ($.isStrVal(sEvt) && !sEvt.equals($.On.Change) && !sEvt.equals($.On.Input))
        },
        handleInvalidEvent: function(oEvtInfo)
        {
            if (oEvtInfo.name === $.On.Input)
                this.get().$bind($.On.Change, oEvtInfo.handler, oEvtInfo.context);
            else if (oEvtInfo.name === $.On.Change)
                $(this).$bind($.On.Change, oEvtInfo.handler, oEvtInfo.context);
        },
        evt_element_onfocus: function(oEvt)
        {
            this.orig = this.getValue()
        },
        evt_element_onblur: function(oEvt)
        {
            if (this.getValue() !== this.orig)
                $(this).customEvent($.On.Change, oEvt).trigger();
            this.orig = this.getValue();
        }
    }
    $.INPUT.Selectable.derivesFrom($.INPUT.Base);

    $.INPUT.Check = function(id)
    {
        $.INPUT.Selectable.apply(this, [id, 'input', { type: $.InputType.Checkbox}]);
    }
    $.INPUT.Check.prototype =
    {
        getValue: function()
        {
            if (this.exists())
                return this.get().prop('checked');
            return null;
        },
        setValue: function(fChecked)
        {
            if (this.exists())
            {
                var el = this.get();
                el.attr('checked') = el.prop('defaultChecked') = fChecked;
            }
        },
        clearValue: function() { this.setValue(false) }
    }
    $.INPUT.Check.derivesFrom($.INPUT.Selectable);

    $.INPUT.Select = function(id)
    {
        $.INPUT.Selectable.apply(this, [id, 'select']);
    }
    $.INPUT.Select.prototype =
    {
        clearValue: function()
        {
            if (this.exists())
                this.get().prop('selectedIndex') = 0;
        },
        // Custom Methods
        getOption: function()
        {
            if (this.exists())
                return this.get().prop('options')[this.getSelectedIndex()];
            return null;
        },
        getSelectedIndex: function()
        {
            if (this.exists())
                return this.get().prop('selectedIndex');
            return null;
        }
    }
    $.INPUT.Select.derivesFrom($.INPUT.Selectable);
})(jQuery);