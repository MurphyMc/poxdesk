/**
 *
 * Originally by Dominik Horb
 */
//TODO: Refactor the window list into a child widget that you add to a Toolbar.
qx.Class.define("poxdesk.ui.window.Taskbar",
{
  extend : qx.ui.core.Widget,

  properties :
  {    
    menuButton : 
    {
      //check : 'Boolean',
      init : null
    }
  },
  
  statics :
  {
    getButtonPos : function (button)
    {
      //FIXME: gotta be a much cleaner way
      var el = button.getContainerElement().getDomElement();

      var b = qx.bom.element.Location.get(el);
      b.width = b.right - b.left;
      b.height = b.bottom - b.top;

      //var cel = this.__desktop.getLayoutParent().getContainerElement().getDomElement();
      
      //FIXME: This is not a very robust way of doing this, but the above won't
      //       work since this method is now static.
      var cel = button.getLayoutParent().getLayoutParent().getLayoutParent().getLayoutParent().getLayoutParent();
      cel = cel.getContainerElement().getDomElement();
      
      var cb = qx.bom.element.Location.get(cel);
      b.left -= cb.left;
      b.top -= cb.top;
  
      return b;  
    }
  },
  
  //***************************************************************************
  // CONSTRUCTOR 
  //***************************************************************************
  construct : function(desktop)
  {
    this.base(arguments);
    if (!desktop) desktop = qx.core.Init.getApplication().getUserData("desktop");
    this.__desktop = desktop;
    if (!desktop) this.debug("No desktop for taskbar");
        
    var taskbar = new qx.ui.toolbar.ToolBar();
    this.__taskbar = taskbar;
    taskbar.setSpacing(1);   
    this._setLayout(new qx.ui.layout.VBox());
    this._add(taskbar);
    
    var button = new qx.ui.toolbar.MenuButton("Menu");
    button.setAppearance("taskbar-button");
    this.__taskbar.add(button);
    this.setMenuButton(button);
    
    this.__windowButtonPart = new qx.ui.toolbar.Part();
    this.__taskbar.add(this.__windowButtonPart);

    this.__taskbar.addSpacer();    

    // The desktop should know its taskbar
    desktop.setUserData("taskbar", this);

    // Hardcode a quick little clock/calendar
    var clock = new qx.ui.toolbar.Button("", null);
    var pop = new qx.ui.popup.Popup(new qx.ui.layout.Basic());      
    pop.add(new qx.ui.control.DateChooser());
    pop.setPlaceMethod("widget");
    pop.setPosition("top-left");
    
    clock.addListener("click", function (e) {
      this.placeToWidget(e.getTarget(), true);
      this.show();
    }, pop);
    this.__timer = new qx.event.Timer(1000 * 15);
    this.__timer.addListener("interval", this.__clockTick, clock);
    this.__timer.fireEvent("interval");
    this.__timer.start();
    this.__timer.setEnabled(true);
    this.__taskbar.add(clock);
  },
  destruct : function()
  {
    this._disposeObjects("__taskbar", "__windowButtonPart", "__timer");
  },  
 
  //***************************************************************************
  // MEMBERS
  //***************************************************************************
  members :
  {
    __taskbar : null,
    __windowButtonPart : null,
    __timer : null, // For the clock.  Doesn't really belong here.
    __desktop : null, // The desktop this taskbar is for
    
    __clockTick : function (e)
    {      
      var t = new Date();
      var h = t.getHours();
      var m = t.getMinutes();
      var ap = (h >= 12) ? "pm" : "am";
      h = h ? (h > 12 ? h - 12 : h) : 12;
      if (m < 10) m = "0" + m;

      this.setLabel(h + ":" + m + " " + ap);          
    },   

    registerWindow : function (window)
    {
      var button = new qx.ui.toolbar.CheckBox("", null);
      button.setAppearance("taskbar-button");
      button.setWidth(100);
      button.setMinWidth(20);
      button.setMaxWidth(100);
      
      // The actual toggling feature gets in our way.
      // Rip off the listener (not very nice)
      if (!button.removeListener("execute", button._onExecute, button))
      {
        this.debug("Failed to remove listener from taskbar button!");
      }

      // Bind some properties of the window to the button
      window.bind("caption", button, "label");
      window.bind("icon", button, "icon");
      window.bind("active", button, "value");

      // Handle window close events so we can remove the button
      window.addListener("close", button.destroy, button);

      // The button needs to know its corresponding window
      button.setUserData("window", window);
     
      // if the button is clicked switch the state of the window and the button
      button.addListener("click", this.__handleClick, this);
      
      window.addListener("beforeMinimize", this.__handleBeforeMinimize, button);
      window.addListener("minimize", this.__handleMinimize, button);
      window.addListener("beforeRestore", this.__handleRestore, button);
      window.addListener("beforeMaximize", this.__handleMaximize, button);
      
      // Add button      
      this.__windowButtonPart.add(button);
      
      return button;
    },

    __handleBeforeMinimize : function (e)
    {
      var window = this.getUserData("window");
      window.setUserData("oldMode", window.getMode());
    },
    
    __handleMinimize : function (e)
    { 
      var window = this.getUserData("window");
      //if (window.getMode() !== "minimized") return;           
      var b = poxdesk.ui.window.Taskbar.getButtonPos(this);
      var zoom = poxdesk.ui.window.Window.createZoomEffect(window.getBounds(), b);
    },
    
    __handleMaximize : function (e)
    { 
      var window = this.getUserData("window");
      if (window.getMode() !== "minimized") return;
      if (window.getUserData("zooming"))
      {
        window.setUserData("zooming", false);
        return;
      }      
      
      // Save position
      var props = window.getLayoutProperties();
      window.__savedLeft = props.left === undefined ? 0 : props.left;
      window.__savedTop = props.top === undefined ? 0 : props.top;      
      
      window.setUserData("zooming", true);  
      var b = poxdesk.ui.window.Taskbar.getButtonPos(this);
      var parent = window.getLayoutParent();
      var zoom = poxdesk.ui.window.Window.createZoomEffect(b, parent.getBounds());
      zoom.addListener("finish", window.maximize, window);
      e.preventDefault();
    },
    
    __handleRestore : function (e)
    { 
      var window = this.getUserData("window");
      if (window.getMode() !== "minimized") return;
      if (window.getUserData("zooming"))
      {
        window.setUserData("zooming", false);
        return;
      }      
      window.setUserData("zooming", true);      
      var b = poxdesk.ui.window.Taskbar.getButtonPos(this);
      //this.debug("restore from min",b,window.getBounds());
      var zoom = poxdesk.ui.window.Window.createZoomEffect(b, window.getBounds());
      zoom.addListener("finish", window.restore, window);
      e.preventDefault();
    },
   
    __handleClick : function (e)
    {
      var window = e.getTarget().getUserData("window");
      var button = e.getTarget();      
      var val = button.getValue();
      var minimized = window.getMode() == "minimized";
      var active = window.isActive();
      
      //window.debug(window.getCaption(),"active: " + active + " min: " + minimized);

      if (minimized)
      {
        if (window.getUserData("oldMode") === "maximized")
          window.maximize();
        else
          window.restore();        
        this.__desktop.setActiveWindow(window);
        //window.debug("restore");
      }
      else if (active !== true)
      {
        //window.debug("activate");
        //window.open();
        //window.activate();
        this.__desktop.setActiveWindow(window);
      }
      else
      {
        //window.debug("minimize");
        window.minimize();
      }
    }       
  } 
});
