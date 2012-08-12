/*

*/

qx.Class.define("poxdesk.LogViewer",
{
  extend : qx.core.Object,
  
  events :
  {
  },
  
  properties :
  {    

  },
  
  construct : function()
  {
    this._container = new poxdesk.ui.window.Window("LogViewer");
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/apps/utilities-log-viewer.png",
      width: 600,
      height: 400,
      contentPadding : [ 0, 0, 0, 0 ]
    });
    this._container.setLayout(new qx.ui.layout.VBox());
    //this._container.open();
    
    //this.getRoot().add(this._container, {left: 50, top: 10});
    
    this._table = this.createTable();
    this._controls = this.createControls();
    if (this._controls) this._container.add(this._controls);
    
    this._container.add(this._table, {flex: 1});

    this._messenger = new poxdesk.Messenger();
    this._messenger.start();
    this._messenger.addListener("connected", function (e) {
      var data = e.getData();
      this.debug("CONNECTED session " + data.getSession());
      var chan = "log_" + data.getSession() + "_" + data.toHashCode();
      this._messenger.join(chan, {'json':true});
      this._messenger.addChannelListener(chan, this.addEntry, this);
    }, this);
    //this.refresh();
  },
  
 
  members :
  {

    addEntry : function (data)
    {
      //this.debug("LOG:" + JSON.stringify(data));
      if (data.levelno < this._minLevel) return;
      var time = this._dateFormat.format(new Date(data.created*1000));
      var icon = this._iconMap[data.levelname.substring(0,1)];
      var msg = data.message;
      var subsystem = data.name;
      this._tableModel.addRows([[icon,time,subsystem,msg]]);

      var bottom = this._tableModel.getRowCount();
      this._table.scrollCellVisible(0, bottom-1);
    },

    createTable : function()
    {
      // table model
      var tableModel = this._tableModel = new qx.ui.table.model.Simple();
      tableModel.setColumns([ "", "Time", "System", "Message" ]);
      tableModel.sortByColumn(1, true);
      //tableModel.setColumnSortable(3, false);
      
      // Customize the table column model.  We want one that automatically resizes columns.
      var custom =
      {
        tableColumnModel : function(obj) {
          return new qx.ui.table.columnmodel.Resize(obj);
        }
      };
      
      var table = new qx.ui.table.Table(tableModel, custom);
      
      table.set({
        width: 600,
        height: 400,
        decorator : null
      });
      
      //table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
      
      var tcm = table.getTableColumnModel();
            
      var rez = tcm.getBehavior();
      rez.setWidth(0, 25);
      rez.setWidth(1, 86);
      rez.setWidth(2, 150);
      rez.set(3, { width:"1*", minWidth:100 });

      tcm.setDataCellRenderer(0, new qx.ui.table.cellrenderer.Image());
      
      // use a different header renderer
      //tcm.setHeaderCellRenderer(2, new qx.ui.table.headerrenderer.Icon("icon/16/apps/office-calendar.png", "A date"));

          var makeNum = function (t, d)
          {
            return parseFloat(d.replace("/", "") + t.replace(/:/g,"").replace(" ", "."))
          };
          var fixTime = function (t)
          {
            return t;
            t = t.split(":");
            var h = t[0];
            var m = t[1];
            var s = t[2];
          };

          var ascending = function(row1, row2)
          {
            //var a = makeNum(row1[arguments.callee.columnIndex], row1[arguments.callee.columnIndex-1]);
            //var b = makeNum(row2[arguments.callee.columnIndex], row2[arguments.callee.columnIndex-1]);            
            var a = fixTime(row1[arguments.callee.columnIndex]);
            var b = fixTime(row1[arguments.callee.columnIndex]);
            
            if (a > b)
            {
              return 1;
            }
            if (a < b)
            {
              return -1;
            }
            return 0;
          };

          var descending = function(row1, row2)
          {
            return ascending(row2, row1);
          }

          table.getTableModel().setSortMethods(1, {
            ascending  : ascending,
            descending : descending
          });

          
      return table;
    },



    createControls : function()
    {

      var bar = new qx.ui.menubar.MenuBar;
      var menu, opt;

      menu = new qx.ui.menu.Menu;
      var group = new qx.ui.form.RadioGroup();
      opt = new qx.ui.menu.RadioButton("DEBUG");//, this._iconMap['D']);
      group.add(opt);
      //group.setSelection(opt);
      menu.add(opt);
      opt = new qx.ui.menu.RadioButton("INFO");//, this._iconMap['I']);
      group.add(opt);
      menu.add(opt);
      opt = new qx.ui.menu.RadioButton("WARNING");//, this._iconMap['W']);
      group.add(opt);
      menu.add(opt);
      opt = new qx.ui.menu.RadioButton("ERROR");//, this._iconMap['E']);
      group.add(opt);
      menu.add(opt);
      opt = new qx.ui.menu.RadioButton("CRITICAL");//, this._iconMap['C']);
      group.add(opt);
      menu.add(opt);
      group.addListener("changeSelection", function (e) {
        //FIXME: This should actually reconfigure the log on POX, but I'm lazy at the moment
        var v = e.getData()[0].getLabel();
        var val = this._levelNamesToValues[v];
        this.debug(val);
        if (val !== undefined) this._minLevel = val;
      }, this);

      bar.add(new qx.ui.menubar.Button("Level", null, menu));

      menu = new qx.ui.menu.Menu;
      opt = new qx.ui.menu.CheckBox("l2_learning");
      opt.addListener("execute", function () { alert("Not implemented yet"); });
      menu.add(opt);
      bar.add(new qx.ui.menubar.Button("Component", null, menu));

      return bar;
    },

    _dateFormat : new qx.util.format.DateFormat('hh:mm:ss a'),
    _messenger : null,
    _container : null,
    _controls : null,
    _table : null,
    _tableModel : null,
    _iconMap : {
      "I" : ("qx/icon/Tango/16/status/dialog-information.png"),
      "W" : "icon/16/status/dialog-warning.png",
      "E" : "qx/icon/Tango/16/emblems/emblem-important.png",
      "C" : "qx/icon/Tango/16/status/dialog-error.png"
     },
    _levelNamesToValues : {
      "DEBUG" : 10,
      "INFO" : 20,
      "WARNING" : 30,
      "ERROR" : 40,
      "CRITICAL" : 50
     },
    _minLevel : 0
     
  }, 

  destruct : function() {
    //this._disposeObjects("_table", "_controls", "_container", "_tableModel", "_messenger");
    this._disposeObjects("_messenger");
  }
});
