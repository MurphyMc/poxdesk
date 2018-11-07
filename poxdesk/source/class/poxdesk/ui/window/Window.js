qx.Class.define("poxdesk.ui.window.Window",
{
  extend: qx.ui.window.Window,

  construct : function(title, props)
  {
    if (!props) props = {};

    this.base(arguments, title, props.icon);

    poxdesk.ui.window.Window.configure(this, props);
  },
  destruct : function ()
  {
    if (this.desktop) this.desktop.remove(this);
  },
  properties :
  {
  },
  members :
  {
    desktop: null
  },
  statics :
  {
    __cascade_start : 20,
    __first_left : 20, // Should always be the same as cascade_start
    __first_top : 20,
    __next_left : 20,
    __next_top : 20,

    __zoomerEl : null,

    configure : function (win, props)
    {
      if (!props) props = {};
      var desktop = props.desktop;
      if (desktop === undefined)
        desktop = qx.core.Init.getApplication().getUserData("desktop");
      if (!desktop) win.debug("No desktop for window!");
      win.desktop = desktop;

      desktop.add(win);

      //FIXME: width and height may not be known yet because the layout of the
      // children may be responsible.  so how do we know how to position?
      var wb = win.getBounds() || {};
      var w = props.width;
      if (w === undefined) w = wb.width;
      if (w === undefined || w === null) w = 300;
      var h = props.height;
      if (h === undefined) h = wb.height;
      if (h === undefined || h === null) h = 200;
      var x = props.left;
      var y = props.top;

      if (x === undefined || y === undefined)
      {
        // Man, I wrote this code once, but can't remember where.
        // This isn't quite right, but is probably okay for now.
        x = poxdesk.ui.window.Window.__next_left;
        y = poxdesk.ui.window.Window.__next_top;

        var deskSize = desktop.getBounds();
        if (!deskSize) deskSize = {width:9000,height:9000}; // First will prbably succeed

        if (x + w > deskSize.width)
        {
          x = poxdesk.ui.window.Window.__first_left;
          poxdesk.ui.window.Window.__cascade_start = x;
        }
        if (y + h > deskSize.height)
        {
          y = poxdesk.ui.window.Window.__first_top;
          x = poxdesk.ui.window.Window.__cascade_start + 20;
          poxdesk.ui.window.Window.__cascade_start += 20;
        }

        poxdesk.ui.window.Window.__next_left = x + 20;
        poxdesk.ui.window.Window.__next_top = y + 30;
      }
      win.setLayoutProperties({left:x, top:y});
      win.setWidth(w);
      win.setHeight(h);

      win.setAllowMaximize(props.allowMaximize ? true:false);
      win.setShowMaximize(props.allowMaximize ? true:false);

      if (desktop.getUserData("taskbar") && (props.allowMinimize !== false))
      {
        win.setAllowMinimize(true);
        win.setShowMinimize(true);
        desktop.getUserData("taskbar").registerWindow(win);
      }
      else
      {
        win.setAllowMinimize(false);
        win.setShowMinimize(false);
      }

      win.addListener("changeActive", function (e) { if (this.getActive()) { this.activate(); this.focus(); }; }, win);

      win.addListener("beforeRestore", poxdesk.ui.window.Window.__handleRestore, win);
      win.addListener("beforeMaximize", poxdesk.ui.window.Window.__handleMaximize, win);

      if (props.open !== false) win.open();

      return win;
    },

    __handleRestore : function (e)
    {
      if (this.getMode() !== "maximized") return;
      if (this.getUserData("zooming"))
      {
        this.setUserData("zooming", false);
        return;
      }
      this.setUserData("zooming", true);
      this.debug(arguments.caller);

      var b = this.getSizeHint();
      b.left = this.__savedLeft;
      b.top = this.__savedTop;

      var zoom = poxdesk.ui.window.Window.createZoomEffect(this.getBounds(), b);
      zoom.addListener("end", this.restore, this);
      e.preventDefault();
    },

    __handleMaximize : function (e)
    {
      if (this.getMode() !== "normal") return;
      if (this.getUserData("zooming"))
      {
        this.setUserData("zooming", false);
        return;
      }

      // Save position
      var props = this.getLayoutProperties();
      this.__savedLeft = props.left === undefined ? 0 : props.left;
      this.__savedTop = props.top === undefined ? 0 : props.top;

      this.setUserData("zooming", true);
      var parent = this.getLayoutParent();
      var zoom = poxdesk.ui.window.Window.createZoomEffect(this.getBounds(), parent.getBounds());
      zoom.addListener("end", this.maximize, this);
      e.preventDefault();
    },

    __handleZoomDone : function (e)
    {
      qx.bom.element.Style.set(this, "visibility", "hidden");
    },

    createZoomEffect : function (rect1, rect2, duration)
    {
      var zoomerEl;
      if (poxdesk.ui.window.Window.__zoomerEl === null)
      {
        zoomerEl = new qx.dom.Element.create("div");
        qx.bom.element.Style.set(zoomerEl, "visibility", "hidden");
        qx.bom.element.Style.set(zoomerEl, "position", "absolute");
        qx.bom.element.Style.set(zoomerEl, "background", "#3030df");
        qx.bom.element.Style.set(zoomerEl, "zIndex", "100000000");

        poxdesk.ui.window.Window.__zoomerEl = zoomerEl;
      }

      if (!duration) duration = 0.125;
      zoomerEl = poxdesk.ui.window.Window.__zoomerEl;
      var zoomerParent = qx.core.Init.getApplication().getRoot().getContentElement().getDomElement();
      qx.dom.Element.insertEnd(zoomerEl, zoomerParent);


      qx.bom.element.Style.set(zoomerEl, "width", Math.round(rect1.width) + "px");
      qx.bom.element.Style.set(zoomerEl, "height", Math.round(rect1.height) + "px");
      qx.bom.element.Style.set(zoomerEl, "top", Math.round(rect1.top) + "px");
      qx.bom.element.Style.set(zoomerEl, "left", Math.round(rect1.left) + "px");
      qx.bom.element.Style.set(zoomerEl, "visibility", "visible");

      var desc = {duration:duration*1000, timing: "ease-in", keyFrames: {
          0: {"width": rect1.width+"px", "height": rect1.height+"px", "top":rect1.top+"px", "left":rect1.left+"px"},
        100: {"width": rect2.width+"px", "height": rect2.height+"px", "top":rect2.top+"px", "left":rect2.left+"px"}
      }};
      var anim = qx.bom.element.Animation.animate(zoomerEl, desc);
      anim.addListener("end", poxdesk.ui.window.Window.__handleZoomDone, zoomerEl);
      return anim;
    }
  }
});

