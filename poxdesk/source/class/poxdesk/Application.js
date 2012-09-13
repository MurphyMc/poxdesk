/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(poxdesk/*)
#asset(qx/icon/Tango/16/categories/internet.png)
#asset(qx/icon/Tango/22/categories/internet.png)
#asset(qx/icon/Tango/16/apps/*)
#asset(qx/icon/Tango/16/actions/*)
#asset(qx/icon/Tango/22/actions/*)
#asset(qx/icon/Tango/22/apps/*)
#asset(qx/icon/Tango/22/devices/network*)
#asset(qx/icon/Tango/22/categories/system.png)
#asset(qx/icon/Tango/16/categories/system.png)
#asset(qx/icon/Tango/16/status/*)
#asset(qx/icon/Tango/16/emblems/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "poxdesk"
 */
qx.Class.define("poxdesk.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     * 
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      window.document.title = "POXDesk"; // Must be a better way

      var layout = new qx.ui.layout.VBox();
      var container = new qx.ui.container.Composite(layout);
      container.setLayout(layout);
      this.getRoot().add(container, {left:0, top:0, width:"100%", height:"100%"});

      var windowManager = new qx.ui.window.Manager();
      var desktop = new qx.ui.window.Desktop(windowManager);
      //desktop.set({decorator: "main", backgroundColor: "#8080A0"});
var dec = new poxdesk.Wallpaper();
dec.setStartColor("#8085a0");//7989aa");
dec.setEndColor("#4f506b");
//dec.setEndColor("#3f406b");
desktop.set({decorator: dec});

      /*
background: #7989aa;
background: -moz-linear-gradient(-45deg,  #7989aa 0%, #3f4c6b 100%);
background: -webkit-gradient(linear, left top, right bottom, color-stop(0%,#7989aa), color-stop(100%,#3f4c6b));
background: -webkit-linear-gradient(-45deg,  #7989aa 0%,#3f4c6b 100%);
background: -o-linear-gradient(-45deg,  #7989aa 0%,#3f4c6b 100%);
background: -ms-linear-gradient(-45deg,  #7989aa 0%,#3f4c6b 100%);
background: linear-gradient(135deg,  #7989aa 0%,#3f4c6b 100%);
filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#7989aa', endColorstr='#3f4c6b',GradientType=1 );
*/

      container.add(desktop, {flex:1});


      // We should be able to specify a desktop for anything that needs it, but
      // if we don't, things should look here to find one.
      qx.core.Init.getApplication().setUserData("desktop", desktop);

      // We could add the taskbar to a specific desktop, but if we don't specify one,
      // it uses the userData on the Application to find the default desktop.
      var taskbar = new poxdesk.ui.window.Taskbar();
      container.add(taskbar);


      // Customize the menu button
      var button = taskbar.getMenuButton();
      button.setIcon("/favicon.gif");//icon/16/categories/internet.png");
      button.setLabel("POX");      
      var mainMenu = new qx.ui.menu.Menu();
      this._startMenu = mainMenu;
      button.setMenu(mainMenu);
      var item;

      item = new qx.ui.menu.Button("Calculator", "icon/22/apps/utilities-calculator.png");
      mainMenu.add(item);
      item.addListener("execute", function (e) {
        qx.Theme.include(poxdesk.theme.Appearance, showcase.page.theme.calc.theme.appearance.Modern);
        var c = new showcase.page.theme.calc.view.Calculator(true);
        c.setIcon("icon/16/apps/utilities-calculator.png");
        c.setShowClose(true);
        var model = new showcase.page.theme.calc.Model();
        new showcase.page.theme.calc.Presenter(c, model);        
        poxdesk.ui.window.Window.configure(c, {width:c.getWidth()*.75, height:c.getHeight()});        
      }, this);

      this.addToStart("LogViewer", function () { new poxdesk.LogViewer(); }, "icon/22/apps/utilities-log-viewer.png");
      this.addToStart("TopoViewer", function () { new poxdesk.TopoViewer(); }, "icon/22/categories/internet.png");
      this.addToStart("TableViewer", function () { new poxdesk.TableViewer(); }, "icon/22/actions/system-search.png");
      this.addToStart("L2 Learning Switch", function () { new poxdesk.LearningSwitch(); }, "icon/22/devices/network-wired.png");

      this.addToStart("Terminal", function () { new poxdesk.Terminal(); }, "icon/22/apps/utilities-terminal.png");

    },

    addToStart : function (name, callback, icon, self)
    {
      if (!!self) self = this;
      var item = new qx.ui.menu.Button(name, icon);
      this._startMenu.add(item);
      item.addListener("execute", callback, self);
    },

    _startMenu : null
  }
});
