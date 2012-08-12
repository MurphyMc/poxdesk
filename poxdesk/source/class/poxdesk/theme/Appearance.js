/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

qx.Theme.define("poxdesk.theme.Appearance",
{
  extend : qx.theme.modern.Appearance,
  title : "Extended Modern Appearance",

  appearances :
  {
    "taskbar-button" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator;
        if (
          states.pressed ||
          (states.checked) ||
          (states.checked && states.disabled))
        {
          decorator = "toolbar-button-checked";
        } else {
          decorator = "toolbar-button-hovered";
        }

        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.borderradius");
        if (useCSS && decorator) {
          decorator += "-css";
        }

        return {
          marginTop : 2,
          marginBottom : 2,
          padding : 3,/*(states.pressed || states.checked || states.hovered) && !states.disabled
                    || (states.disabled && states.checked) ? 3 : 5,*/
          decorator : decorator
        };
      }
    }
  }
});
