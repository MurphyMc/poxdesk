/**
 * Combination effect "Zoom"
 *
 * (Based on combination effect "Grow")
 *
 * Resizes and moves an element from given initial dimensions to given final dimensions.
 */
qx.Class.define("poxdesk.fx.effect.combination.Zoom",
{

  extend : qx.fx.Base,


  /*
    *****************************************************************************
       CONSTRUCTOR
    *****************************************************************************
  */

  /**
   * @param element {Object} The DOM element
   */
  construct : function(element, source, target)
  {
    this.base(arguments, element);

    this.__moveEffect = new qx.fx.effect.core.Move(element);
    this.__scaleEffect = new poxdesk.fx.effect.core.ZoomScale(element);
    this.__mainEffect = new qx.fx.effect.core.Parallel(this.__moveEffect, this.__scaleEffect);

    this.__source = source;
    this.__target = target;
  },

  /*
   *****************************************************************************
      PROPERTIES
   *****************************************************************************
   */

  properties :
  {
    /**
     * Transition function to modify the scaling process.
     */
    scaleTransition :
    {
      init : "sinodial",

      // keep this in sync with qx.fx.Transition!
      check  : ["linear", "easeInQuad", "easeOutQuad", "sinodial", "reverse", "flicker", "wobble", "pulse", "spring", "none", "full"]
    },

    /**
     * Transition function to modify the movement process.
     */
    moveTransition :
    {
      init : "sinodial",

      // keep this in sync with qx.fx.Transition!
      check  : ["linear", "easeInQuad", "easeOutQuad", "sinodial", "reverse", "flicker", "wobble", "pulse", "spring", "none", "full"]
    }

  },


  /*
   *****************************************************************************
      MEMBERS
   *****************************************************************************
   */

   members :
   {

     __scaleEffect : null,
     __moveEffect : null,
     __mainEffect : null,

    setup : function()
    {
      this.base(arguments);
    },

    start : function()
    {
      if (!this.base(arguments)) {
        return;
      }
      
      var target = this.__target;
      var element = this._getElement();

      // Element must be visible for move effect
      qx.bom.element.Style.set(element, "display", "block");
      qx.bom.element.Style.set(element, "overflow", "hidden");

      var initialMoveX = 0, initialMoveY = 0;
      var moveX = target.left, moveY = target.top;

      var oldStyle = {
        top    : qx.bom.element.Location.getTop(element),
        left   : qx.bom.element.Location.getLeft(element),
        width  : qx.bom.element.Dimension.getContentWidth(element),
        height : qx.bom.element.Dimension.getContentHeight(element),
        overflow : "visible"
      };

      this.__scaleEffect.afterFinishInternal = function()
      {
        var value;
        var element = this._getElement();

        for (var property in oldStyle)
        {
          value = oldStyle[property];
          if (property != "overflow") {
            value += "px";
          }
          qx.bom.element.Style.set(element, property, value);
        }
      };

      this.__moveEffect.set({
        x          : moveX,
        y          : moveY,
        sync       : true,
        transition : this.getMoveTransition(),
        mode       : "absolute"
      });


      this.__scaleEffect.set({        
        scaleFromCenter : false,
        scaleToX              : this.__target.width,
        scaleToY              : this.__target.height,
        sync                 : true,
        transition           : this.getScaleTransition(),
        alternateDimensions  : [this.__source.width, this.__source.height]
      });

      //qx.bom.element.Style.set(element, "top", (oldStyle.top + initialMoveY) + "px");
      //qx.bom.element.Style.set(element, "left", (oldStyle.left + initialMoveX) + "px");

      this.__mainEffect.setDuration(this.getDuration());
      this.__mainEffect.start();
    }


   },


   /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function()
   {
     this._disposeObjects("__moveEffect", "__scaleEffect", "__mainEffect");
   }

});

