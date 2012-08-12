/**
 * Effect "ZoomScale"
 *
 * (Based on Scale effect.)
 *
 * This effect scales an element from one size to another size
 *
 * TODO: Automatic start size; more consistent arguments; better defaults;
 *       either check or remove the "from center" option
 */
qx.Class.define("poxdesk.fx.effect.core.ZoomScale",
{

  extend : qx.fx.Base,

  construct : function(element)
  {
    this.base(arguments, element);

    this.__originalStyle = qx.fx.effect.core.Scale.originalStyle;
  },

  /*
   *****************************************************************************
      PROPERTIES
   *****************************************************************************
   */

  properties :
  {

    /**
     * Flag indicating if element should be scaled
     * from center (upper left corner otherwise).
     */
    scaleFromCenter :
    {
      init : false,
      check : "Boolean"
    },

    /**
     * Percentage the elements dimensions should be scaled to.
     */
    scaleToY :
    {
      init : 100,
      check : "Number"
    },
    
    /**
     * Percentage the elements dimensions should be scaled to.
     */
    scaleToX :
    {
      init : 100,
      check : "Number"
    },

    /**
     * Flag indicating if element's original dimensions should be restored
     * after effect's runtime.
     */
    restoreAfterFinish :
    {
      init : false,
      check : "Boolean"
    },

    /**
     * Array containing sizes which will instead of element's dimensions, if filled.
     */
    alternateDimensions : {
      init : [],
      check : "Array"
    }

  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {

    /**
     * Storage for original style definitions (dimension and position).
     *
     * @internal
     */
    originalStyle : {
      //'top'      : null,
      //'left'     : null,
      'width'    : null,
      'height'   : null
    }

  },

  /*
   *****************************************************************************
      MEMBERS
   *****************************************************************************
   */

   members :
   {

    __elementPositioning : null,
    __originalTop : null,
    __originalLeft : null,
    __dims : null,
    __originalStyle : null,

    setup : function()
    {
      this.base(arguments);
      var element = this._getElement();

      this.__elementPositioning = qx.bom.element.Style.get(element, "position");

      for (var property in this.__originalStyle) {
        this.__originalStyle[property] = element.style[property];
      }

      this.__originalTop = qx.bom.element.Location.getTop(element);
      this.__originalLeft = qx.bom.element.Location.getLeft(element);
    
      var dims = this.getAlternateDimensions();

      if (dims.length == 0) {
        this.__dims = [element.offsetWidth, element.offsetHeight];
      } else {
        this.__dims = dims;
      }

    },


    update : function(position)
    {
      var element = this._getElement();
      this.base(arguments);

      var currentScaleX = (this.getScaleToX() - this.__dims[0]) * position + this.__dims[0];
      var currentScaleY = (this.getScaleToY() - this.__dims[1]) * position + this.__dims[1];

      this._setDimensions(currentScaleX, currentScaleY);
    },

   finish : function()
   {
     this.base(arguments);
     var element = this._getElement();

     if (this.getRestoreAfterFinish())
     {
       for(var property in this.__originalStyle)
       {
         var value = this.__originalStyle[property];
         qx.bom.element.Style.set(element, property, value);
       }
     }
   },

   /**
    * Internal helper function which sets element's
    * dimensions to the given values and (optionally)
    * moves it to scale centered.
    * @param width {Number} Width in pixels
    * @param height {Number} Height in pixels
    */
   _setDimensions : function(width, height)
   {

     var d = { };
     var element = this._getElement();

     d.width = Math.round(width) + 'px';

     d.height = Math.round(height) + 'px';

     if (this.getScaleFromCenter())
     {

       var leftd = (width  - this.__dims[0]) / 2;
       var topd  = (height - this.__dims[1]) / 2;

       if (this.__elementPositioning == "absolute")
       {

         //d.top = this.__originalTop-topd + 'px';
         //d.left = this.__originalLeft-leftd + 'px';

       }
       else
       {
         //d.top = -topd + 'px';
         //d.left = -leftd + 'px';
       }
     }

     for(var property in d) {
       qx.bom.element.Style.set(element, property, d[property])
     }

   }

   },


   /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

   destruct : function() {
     this.__dims = this.__originalStyle = null;
   }

});

