/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

   ======================================================================

   This class contains code based on the following work:

   * script.aculo.us
       http://script.aculo.us/
       Version 1.8.1

     Copyright:
       (c) 2008 Thomas Fuchs

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Author:
       Thomas Fuchs

************************************************************************ */

/**
 * Basic class for all core and combination effects.
 * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
 */
qx.Class.define("qx.fx.Base",
{

  extend : qx.core.Object,

  /*
    *****************************************************************************
       CONSTRUCTOR
    *****************************************************************************
  */

  /**
   * @param element {Object} The DOM element
   * @deprecated since 2.0
   */
  construct : function(element)
  {
    this.base(arguments);

    qx.log.Logger.deprecatedClassWarning(this.constructor,
      "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
    );

    this.setQueue( qx.fx.queue.Manager.getInstance().getDefaultQueue() );
    this.__state = qx.fx.Base.EffectState.IDLE;

    this.__element = element;
  },


  /*
   *****************************************************************************
      EVENTS
   *****************************************************************************
   */

   events:
   {
     /**
      * This event is fired when effect starts.
      * @deprecated since 2.0
      */
     "setup"  : "qx.event.type.Event",

     /**
      * This event is fired every time a frame is rendered.
      * @deprecated since 2.0
      */
     "update" : "qx.event.type.Event",

     /**
      * This event is fired when effect ends.
      * @deprecated since 2.0
      */
      "finish" : "qx.event.type.Event"
   },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
     /**
      * Number of seconds the effect should run.
      * @deprecated since 2.0
      */
     duration :
     {
       init   : 0.5,
       check  : "Number",
       apply : "_applyDuration"
     },

     /**
      * Number frames per seconds the effect should be rendered with.
      * @deprecated since 2.0
      */
     fps :
     {
       init   : 100,
       check  : "Number"
     },

     /**
      * Flag indicating if effect should run parallel with others.
      * @deprecated since 2.0
      */
     sync :
     {
       init   : false,
       check  : "Boolean"
     },

     /**
      * Initial value of effect-specific property (color, opacity, position, etc.).
      * @deprecated since 2.0
      */
     from :
     {
       init   : 0,
       check  : "Number"
     },

     /**
      * End value of effect-specific property. When this value is reached, the effect will end.
      * @deprecated since 2.0
      */
     to :
     {
       init   : 1,
       check  : "Number"
     },

     /**
      * Number of seconds the effect should wait before start.
      * @deprecated since 2.0
      */
     delay :
     {
       init   : 0.0,
       check  : "Number"
     },

     /**
      * Name of queue the effect should run in.
      * @deprecated since 2.0
      */
     queue :
     {
       check : "Object",
       dereference : true
     },

     /**
      * Function which modifies the effect-specific property during the transition
      * between "from" and "to" value.
      * @deprecated since 2.0
      */
     transition :
     {
       init   : "linear",

       // keep this in sync with qx.fx.Transition!
       check  : ["linear", "easeInQuad", "easeOutQuad", "sinodial", "reverse", "flicker", "wobble", "pulse", "spring", "none", "full"]
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
     * State in which each effect can be
     * @deprecated since 2.0
     */
    EffectState :
    {
      IDLE      : 'idle',
      PREPARING : 'preparing',
      RUNNING   : 'running'
    }

  },


  /*
   *****************************************************************************
      MEMBERS
   *****************************************************************************
   */

  members :
  {

    __state : null,
    __currentFrame : null,
    __startOn : null,
    __finishOn : null,
    __fromToDelta : null,
    __totalTime : null,
    __totalFrames : null,
    __position : null,
    __element : null,

    /**
     * Returns the effect's DOM element
     * @return {Object} the element
     * @deprecated since 2.0
     */
    _getElement : function() {
      return this.__element;
    },

    /**
     * Sets the element to be animated.
     * @param element {Object} the element
     * @deprecated since 2.0
     */
    _setElement : function(element) {
      this.__element = element;
    },

    /**
     * Apply method for duration. Should be overwritten if needed.
     * @param value {Number} Current value
     * @param old {Number} Previous value
     * @deprecated since 2.0
     **/
    _applyDuration : function(value, old){},

    /**
     * This internal function is used to update
     * properties before the effect starts.
     * @deprecated since 2.0
     */
    init : function()
    {
      this.__state        = qx.fx.Base.EffectState.PREPARING;
      this.__currentFrame = 0;
      this.__startOn      = this.getDelay() * 1000 + (new Date().getTime());
      this.__finishOn     = this.__startOn + (this.getDuration() * 1000);
      this.__fromToDelta  = this.getTo() - this.getFrom();
      this.__totalTime    = this.__finishOn - this.__startOn;
      this.__totalFrames  = this.getFps() * this.getDuration();
    },

    /**
     * This internal function is called before
     * "beforeFinished" and before the effect
     * actually ends.
     * @deprecated since 2.0
     */
    beforeFinishInternal : function(){},

    /**
     * This internal function is called before
     * the effect actually ends.
     * @deprecated since 2.0
     */
    beforeFinish : function(){},

    /**
     * This internal function is called before
     * "afterFinished" and after the effect
     * actually has ended.
     * @deprecated since 2.0
     */
    afterFinishInternal : function(){},

    /**
     * This internal function is called after
     * the effect actually has ended.
     * @deprecated since 2.0
     */
    afterFinish : function(){},

    /**
     * This internal function is called before
     * "beforeSetup" and before the effect's
     * "setup" method gets called.
     * @deprecated since 2.0
     */
    beforeSetupInternal : function(){},

    /**
     * This internal function is called before
     * the effect's "setup" method gets called.
     * @deprecated since 2.0
     */
    beforeSetup : function(){},

    /**
     * This internal function is called before
     * "afterSetup" and after the effect's
     * "setup" method has been called.
     * @deprecated since 2.0
     */
    afterSetupInternal : function(){},

    /**
     * This internal function is called after
     * the effect's "setup" method has been called.
     * @deprecated since 2.0
     */
    afterSetup : function(){},


    /**
     * This internal function is called before
     * "beforeUpdateInternal" and each time before
     * the effect's "update" method is called.
     * @deprecated since 2.0
     */
    beforeUpdateInternal : function(){},

    /**
     * This internal function is each time before
     * the effect's "update" method is called.
     * @deprecated since 2.0
     */
    beforeUpdate : function(){},

    /**
     * This internal function is called before
     * "afterUpdate" and each time after
     * the effect's "update" method is called.
     * @deprecated since 2.0
     */
    afterUpdateInternal : function(){},

    /**
     * This internal function is called
     * each time after the effect's "update" method is called.
     * @deprecated since 2.0
     */
    afterUpdate : function(){},

    /**
     * This internal function is called before
     * "beforeStartInternal" and before the effect
     * actually starts.
     * @deprecated since 2.0
     */
    beforeStartInternal : function(){},

    /**
     * This internal function is called
     * before the effect actually starts.
     * @deprecated since 2.0
     */
     beforeStart : function(){},


   /**
    * This internal function is called
    * before the effect starts to configure
    * the element or prepare other effects.
    *
    * Fires "setup" event.
    *
    * @deprecated since 2.0
    */
    setup : function() {
      this.fireEvent("setup");
    },


    /**
     * This internal function is called
     * each time the effect performs an
     * step of the animation.
     *
     * Sub classes will overwrite this to
     * perform the actual changes on element
     * properties.
     *
     * @param position {Number} Animation setup
     * as Number between 0 and 1.
     *
     * @deprecated since 2.0
     */
    update : function(position)
    {
    },


    /**
     * This internal function is called
     * when the effect has finished.
     *
     * Fires "finish" event.
     *
     * @deprecated since 2.0
     */
    finish : function()
    {
      this.fireEvent("finish");
    },


    /**
     * Starts the effect
     * @deprecated since 2.0
     */
    start : function()
    {

      if (this.__state != qx.fx.Base.EffectState.IDLE) {
        // Return a value to use this in overwritten start() methods
        return false;
      }

      this.init();

      this.beforeStartInternal();
      this.beforeStart();

      if (!this.getSync()) {
        this.getQueue().add(this);
      }

      return true;
    },


    /**
     * Ends the effect
     * @deprecated since 2.0
     */
    end : function()
    {

      // render with "1.0" to have an intended finish state
      this.render(1.0);
      this.cancel();

      this.beforeFinishInternal();
      this.beforeFinish();

      this.finish();

      this.afterFinishInternal();
      this.afterFinish();
    },

    /**
     * Calls update(), or invokes the effect, if not running.
     *
     * @param pos {Number} Effect's step on duration between
     * 0 (just started) and 1 (finished). The longer the duration
     * is, the lower is each step.
     *
     * Fires "update" event.
     * @deprecated since 2.0
     */
    render : function(pos)
    {

      if(this.__state == qx.fx.Base.EffectState.PREPARING)
      {
        this.__state = qx.fx.Base.EffectState.RUNNING;

        this.beforeSetupInternal();
        this.beforeSetup();

        this.setup();

        this.afterSetupInternal();
        this.afterSetup();
      }

      if(this.__state == qx.fx.Base.EffectState.RUNNING)
      {

        // adjust position depending on transition function
        this.__position = qx.fx.Transition.get(this.getTransition())(pos) * this.__fromToDelta + this.getFrom();

        this.beforeUpdateInternal();
        this.beforeUpdate();

        this.update(this.__position);

        this.afterUpdateInternal();
        this.afterUpdate();

        if (this.hasListener("update")) {
          this.fireEvent("update");
        }
      }
    },


    /**
     * Invokes update() if effect's remaining duration is
     * bigger than zero, or ends the effect otherwise.
     *
     * @param timePos {Number} Effect's step on duration between
     * 0 (just started) and 1 (finished). The longer the duration
     * is, the lower is each step.
     * @deprecated since 2.0
     */
    loop : function(timePos)
    {
      // check if effect should be rendered now
      if (timePos >= this.__startOn)
      {

        // check if effect effect finish
        if (timePos >= this.__finishOn) {
          this.end();
        }

        var pos   = (timePos - this.__startOn) / this.__totalTime;
        var frame = Math.round(pos * this.__totalFrames);

        // check if effect has to be drawn in this frame
        if (frame > this.__currentFrame)
        {
          this.render(pos);
          this.__currentFrame = frame;
        }

      }
    },


    /**
    * Removes effect from queue and sets state to finished.
    * @deprecated since 2.0
    */
    cancel : function()
    {
      if (!this.getSync()) {
        this.getQueue().remove(this);
      }

      this.__state = qx.fx.Base.EffectState.IDLE;
    },

    /**
    * Resets the state to default.
    * @deprecated since 2.0
    */
    resetState : function() {
      this.__state = qx.fx.Base.EffectState.IDLE;
    },


    /**
     * Returns whether the effect is active
     *
     * @return {Boolean} Whether the effect is active.
     * @deprecated since 2.0
     */
    isActive : function() {
      return this.__state === qx.fx.Base.EffectState.RUNNING ||
             this.__state === qx.fx.Base.EffectState.PREPARING;
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__element = this.__state = null;
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

   ======================================================================

   This class contains code based on the following work:

   * script.aculo.us
       http://script.aculo.us/
       Version 1.8.1

     Copyright:
       (c) 2008 Thomas Fuchs

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Author:
       Thomas Fuchs

************************************************************************ */

/**
 * Manager for access to effect queues.
 * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
 */
qx.Class.define("qx.fx.queue.Manager",
{
  extend : qx.core.Object,
  type : "singleton",

  construct : function()
  {
    qx.log.Logger.deprecatedClassWarning(this.constructor,
      "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
    );

    this.base(arguments);
    this.__instances = {};
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __instances : null,

    /**
     * Returns existing queue by name or creates a new queue object and returns it.
     * @param queueName {String} Name of queue.
     * @return {Class} The queue object.
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    getQueue : function(queueName)
    {
     if(typeof(this.__instances[queueName]) == "object") {
       return this.__instances[queueName];
     } else {
       return this.__instances[queueName] = new qx.fx.queue.Queue;
     }
    },

    /**
     * Returns existing default queue or creates a new queue object and returns it.
     * @return {Class} The queue object.
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    getDefaultQueue : function() {
      return this.getQueue("__default");
    }

  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._disposeMap("__instances");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

   ======================================================================

   This class contains code based on the following work:

   * script.aculo.us
       http://script.aculo.us/
       Version 1.8.1

     Copyright:
       (c) 2008 Thomas Fuchs

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Author:
       Thomas Fuchs

************************************************************************ */

/**
 * This queue manages ordering and rendering of effects.
 * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
 */
qx.Class.define("qx.fx.queue.Queue",
{

  extend : qx.core.Object,


  /*
    *****************************************************************************
       CONSTRUCTOR
    *****************************************************************************
  */


  construct : function()
  {
    this.base(arguments);
    qx.log.Logger.deprecatedClassWarning(this.constructor,
      "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
    );

    this.__effects = [];
  },


  /*
   *****************************************************************************
      PROPERTIES
   *****************************************************************************
   */

   properties :
   {
      /**
       * Maximal number of effects that can run simultaneously.
       * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
       */
      limit :
      {
        init   : Infinity,
        check  : "Number"
      }

   },

  /*
   *****************************************************************************
      MEMBERS
   *****************************************************************************
   */


   members :
   {

     __interval : null,
     __effects  : null,

    /**
     * This method adds the given effect to the queue and starts the timer (if necessary).
     * @param effect {Object} The effect.
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    add : function(effect)
    {
      var timestamp = new Date().getTime();

      effect._startOn  += timestamp;
      effect._finishOn += timestamp;

      if (this.__effects.length < this.getLimit()) {
        this.__effects.push(effect)
      } else {
        effect.resetState();
      }

      if (!this.__interval) {
        this.__interval = qx.lang.Function.periodical(this.loop, 15, this);
      }
    },

    /**
     * This method removes the given effect from the queue.
     * @param effect {Object} The effect.
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    remove : function(effect)
    {
      qx.lang.Array.remove(this.__effects, effect);

      if (this.__effects.length == 0)
      {
        window.clearInterval(this.__interval);
        delete this.__interval;
      }
    },

    /**
     * This method executes all effects in queue.
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    loop: function()
    {
      var timePos = new Date().getTime();

      for (var i=0, len=this.__effects.length; i<len; i++) {
        this.__effects[i] && this.__effects[i].loop(timePos);
      }
    }

  },


  /*
  *****************************************************************************
    DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__effects = null;
  }

});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Jonathan Weiß (jonathan_rass)

   ======================================================================

   This class contains code based on the following work:

   * script.aculo.us
       http://script.aculo.us/
       Version 1.8.1

     Copyright:
       2008 Thomas Fuchs

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Author:
       Thomas Fuchs

   ----------------------------------------------------------------------

     Copyright (c) 2005-2007 Thomas Fuchs
       (http://script.aculo.us, http://mir.aculo.us)

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without restriction,
     including without limitation the rights to use, copy, modify, merge,
     publish, distribute, sublicense, and/or sell copies of the Software,
     and to permit persons to whom the Software is furnished to do so,
     subject to the following conditions:

     The above copyright notice and this permission notice shall be
     included in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.

   ======================================================================

   This class contains code based on the following work:

   * Easing equations
       http://www.robertpenner.com/easing/

     Copyright:
       2001 Robert Penner

     License:
       BSD: http://www.opensource.org/licenses/bsd-license.php

     Author:
       Robert Penner

   ----------------------------------------------------------------------

     http://www.robertpenner.com/easing_terms_of_use.html

     Copyright © 2001 Robert Penner

     All rights reserved.

     Redistribution and use in source and binary forms, with or without
     modification, are permitted provided that the following conditions
     are met:

     * Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in
       the documentation and/or other materials provided with the
       distribution.
     * Neither the name of the author nor the names of contributors may
       be used to endorse or promote products derived from this software
       without specific prior written permission.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
     INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     OF THE POSSIBILITY OF SUCH DAMAGE.

************************************************************************ */

/**
 * Static class containing all transition functions.
 * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
 */
qx.Class.define("qx.fx.Transition",
{
  type : "static",

  statics :
  {
    __warned : false,

    /**
     * Maps function name to function.
     *
     * @param functionName {String} Name off the function.
     * @return {Function|Boolean} Function belonging to the name or false,
     * function does not exist
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    get : function(functionName)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return qx.fx.Transition[functionName] || false;
    },

    /**
     * Returns the given effect position without
     * changing it. This is the default transition
     * function for most effects.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    linear : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return pos;
    },

    /**
     * Using this function will accelerate the effect's
     * impact exponentially.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    easeInQuad : function (pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return Math.pow(2, 10 * (pos - 1));
    },

    /**
     * Using this function will slow down the
     * effect's impact exponentially.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    easeOutQuad : function (pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return (-Math.pow(2, -10 * pos) + 1);
    },

    /**
     * Using this function will accelerate the
     * effect's impact sinusoidal.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    sinodial : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return ( -Math.cos(pos * Math.PI) / 2 ) + 0.5;
    },

    /**
     * Using this function will reverse the
     * effect's impact.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    reverse: function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return 1 - pos;
    },

    /**
     * Using this function will alternate the
     * effect's impact between start end value.
     *
     * Looks only nice on color effects.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    flicker : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      var pos = ( (-Math.cos(pos * Math.PI) / 4) + 0.75) + Math.random() / 4;
      return pos > 1 ? 1 : pos;
    },

    /**
     * Using this function will bounce the
     * effect's impact forwards and backwards
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    wobble : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return ( -Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
    },

    /**
     * Using this function will alternate rapidly the
     * effect's impact between start end value.
     *
     * Looks only nice on color effects.
     *
     * @param pos {Number} Effect position in duration
     * @param pulses {Number} Amount of pulses
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    pulse : function(pos, pulses)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      pulses = (typeof(pulses) == "Number") ? pulses : 5;

      return (
        Math.round((pos % (1/pulses)) * pulses) == 0 ?
              Math.floor((pos * pulses * 2) - (pos * pulses * 2)) :
          1 - Math.floor((pos * pulses * 2) - (pos * pulses * 2))
        );
    },

    /**
     * Using this function will overshoot the
     * target value and then move back the impact's
     * impact.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    spring : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },

    /**
     * Using this function the effect's impact will be zero.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    none : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return 0;
    },

    /**
     * Using this function the effect's impact will be
     * as if it has reached the end position.
     *
     * @param pos {Number} Effect position in duration
     * @return {Number} Modified effect position
     * @deprecated since 2.0: Please use qx.bom.element.Animation instead.
     */
    full : function(pos)
    {
      if (!this.__warned) {
        this.__warned = true;
        qx.log.Logger.deprecatedMethodWarning(arguments.callee,
          "qx.fx.* is deprecated. Please use qx.bom.element.Animation instead."
        );
      }

      return 1;
    }
  }
});
