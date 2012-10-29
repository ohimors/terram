/// <reference path="..\ja_core.js" />
/// <reference path="..\ja_events.js" />
/// <reference path="..\ja_ajax.js" />
/// <reference path="ja_input.js" />
/// <reference path="ja_message.js" />
/// <reference path="ja_fields.js" />

$.Form = function(idForm, urlTarget, iTimeout)
{
    this.fields = [];
    this.id = idForm;
    this.m_fSubmitting = false;

    this.m_oAJAX = $.jajax({
        url: urlTarget,
        maxtime: iTimeout
    }).$bind($.AJAX.On.Success, this.evt_AJAX_onsuccess, this)
      .$bind($.AJAX.On.Error, this.evt_AJAX_onerror, this)
      .$bind($.AJAX.On.Timeout, this.evt_AJAX_ontimeout, this)
      .$bind($.AJAX.On.Complete, this.evt_AJAX_oncomplete, this);

    $(this.id).$bind($.On.Submit, this.evt_Form_onsubmit, this);
}
$.Form.prototype =
{
    // abstract methods
    getErrorData: function(iErrorCode) { return null },
    getHelpData: function(iFieldIndex) { return null },
    getDefaultField: function() { return null },
    onStatusChange: function() { },
    // common methods - these should be used and not overriden. if for some
    // unforseen reason different functionality is needed re-consider why.
    // if it's impossible to use these methods as is, consider adding a case
    // into these functions rather than overriding them in a derived class
    //
    submit: function(oEvt)
    {
        if (!this.m_fSubmitting && this.validate())
        {
            this.m_fSubmitting = true;
            this.onStatusChange();
            this.m_oAJAX = this.m_oAJAX.send(this.writeToObject(), oEvt);
        }
    },
    writeToObject: function()
    {
        var oData = {};
        // for (var i = 0; i < this.m_aFields.length; i++)
        $.each(this.fields,
        function(idx, oField)
        {
            if (oField.isEnabled())
            {
                var sName = oField.getName();
                var oVal = oField.getFullValue();
                if (exists(sName) && exists(oVal))
                    oData[sName] = oVal;
            }
        });
        return oData;
    },
    validate: function()
    {
        var isValid = true;
        // for (var i = 0; i < this.m_aFields.length; i++)
        for (var i = 0; i < this.fields.length; i++)
        {
            var oField = this.fields[i];
            if (oField.isEnabled())
            {
                this.updateField(oField);
                if (oField.hasMessage($.MSG.Type.Error))
                    isValid = false;
            }
        }
        return isValid;
    },
    handleError: function(error)
    {
        if ($.isArray(error))
        {
            for (var i = 0; i < error.length; i++)
                this.handleError(error[i]);
        }
        else
        {
            var oData = this.getErrorData(error);
            $.each(oData.fields,
            function(idx, oField)
            {
                oField.setMessage($.MSG.Type.Error, oData);
            });
        }
    },
    setFocus: function(fSelect)
    {
        var oDefaultField = this.getDefaultField();
        $.each(this.fields,
        function(idx, oField)
        {
            if (oField.isEnabled() && oField.isFocusAllowed())
            {
                if (oField.hasMessage($.MSG.Type.Error))
                {
                    oDefaultField = oField;
                    return false;
                }
                else if (!exists(oDefaultField))
                    oDefaultField = oField;
            }
        });
        if (exists(oDefaultField))
            oDefaultField.setFocus(fSelect);
    },
    updateField: function(oField)
    {
        if (exists(oField) && oField.isEnabled())
        {
            try
            {
                oField.tryValidateValue().clearMessage($.MSG.Type.Error);
            }
            catch (oError)
            {
                oField.setMessage($.MSG.Type.Error, this.getErrorData(oError.hr));
            }
        }
        return this;
    },

    // Events
    evt_Form_onsubmit: function(oEvt)
    {
        $(this).customEvent($.On.Submit, oEvt).trigger();
        return false;
    },
    evt_Field_onvaluechange: function(oEvt)
    {
        oEvt.target.hideMessage($.MSG.Type.Error);
    },
    evt_Field_onblur: function(oEvt)
    {
        var oField = oEvt.target;
        if (oField.hasMessage($.MSG.Type.Error))
            oField.showMessage($.MSG.Type.Error);
    },
    evt_Field_onfocus: function(oEvt)
    {
        oEvt.target.setMessage($.MSG.Type.Help, this.getHelpData(oEvt.target.index));
    },
    evt_Field_onchange: function(oEvt)
    {
        this.updateField(oEvt.target);
    },

    // AJAX Events
    evt_AJAX_onsuccess: function(oEvt)
    {
        var oJSON = new $.JSON(oEvt.target.getJSON());
        if (!oJSON.fromJSON())
            $.log('Register FAILED')
        else
            $.log('Register SUCCEEDED');
    },
    evt_AJAX_onerror: function(oEvt)
    {
        $.log('Register ERROR');
    },
    evt_AJAX_ontimeout: function(oEvt)
    {
        $.log('Register TIMEOUT');
    },
    evt_AJAX_oncomplete: function(oEvt)
    {
        this.m_fSubmitting = false;
        this.onStatusChange();
    }
}