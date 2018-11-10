/*
#asset(qx/icon/Tango/16/actions/system-search.png)
*/

qx.Class.define("poxdesk.CableBear",
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
    var settings = window.localStorage.getItem("CableBear");
    try
    {
      if (settings) settings = JSON.parse(settings);
    }
    catch (err)
    {
      settings = null;
    }
    if (!settings) settings = {width:600,height:400};
    this._settings = settings;
    this._container = new poxdesk.ui.window.Window("Disconnected - CableBear");
    this._container.setShowMaximize(true);
    this._container.setAllowMaximize(true);
    this._container.addListener("close", this.dispose, this);
    this._container.addListener("resize", this.saveSettings, this);

    this._container.set({
      icon: "icon/16/actions/system-search.png",
      width: settings.width, //540,
      height: settings.height, //400,
      contentPadding : [ 0, 0, 0, 0 ]
    });
    this._container.setLayout(new qx.ui.layout.VBox());

    this._table = this.createTable();
    this._controls = this.createControls();
    this._details = this.createDetails()
    if (this._controls) this._container.add(this._controls);

    var tcm = this._table.getTableColumnModel();
    tcm.addListener("orderChanged", this.saveSettings, this);
    tcm.addListener("visibilityChanged", this.saveSettings, this);
    tcm.addListener("widthChanged", this.saveSettings, this);

    var split = new qx.ui.splitpane.Pane("vertical");
    this._split = split;
    this._container.add(split, {flex: 1});

    split.add(this._table, 2);
    split.add(this._details, 1.1);

    //this._container.add(this._table, {flex: 1});

    this._dispatcher = new poxdesk.WebsocketChannel();
    this._dispatcher.addListener("message", this._on_message, this);
    this._dispatcher.addListener("disconnected", function () { this._container.setCaption("Disconnected - CableBear"); this._dispatcher.close(); }, this);
    this._dispatcher.addListener("connected", function () { this._container.setCaption("CableBear"); }, this);
    this._dispatcher.setLocation("//" + location.host + "/cable_bear/ws");
    this._dispatcher.start();
    console.log("CableBear starting...");

    //this._dispatcher.getExposedObjects()[undefined] = this;
  },

  members :
  {
    saveSettings : function ()
    {
      if (this._noSave) return;
      if (!this._table) return;
      var s = {};
      s.width = this._container.getWidth();
      s.height = this._container.getHeight();

      var table = this._table;
      var tcm = table.getTableColumnModel();
      var tm = table.getTableModel();
      //var tb = tcm.getBehavior();
      var colConfig = [];
      colConfig.fill(null, 0, tm.getColumnCount());
      for (var xindex = 0; xindex < tm.getColumnCount(); xindex++)
      {
        var index = tcm.getOverallColumnAtX(xindex);
        var w = tcm.getColumnWidth(index);
        var n = tm.getColumnName(index);
        //var w = tb.getWidth(index);
        var v = tcm.isColumnVisible(index);
        //colConfig.push([n,w,v]);
        colConfig[xindex] = [n,w,v];
      };
      console.log(colConfig);
      s.colConfig = colConfig;

      window.localStorage.setItem("CableBear", JSON.stringify(s));
      console.log("Save", s);
    },

    _on_message : function (msg)
    {
      function checkbox (v)
      {
        if (v === true) return String.fromCharCode(0x2705);
        if (v === false) return String.fromCharCode(0x274C);
        return '';
      }
      msg = msg.getData();
      msg['io'] = checkbox(msg['in_order']);
      msg['retx'] = checkbox(msg['retx']);
      msg['dup_ack'] = checkbox(msg['dup_ack']);
      msg['flg'] = msg['flags'];
      msg['dir'] = msg['is_tx'] ? String.fromCharCode(0x25b6) : String.fromCharCode(0x25c0);
      console.log(msg.num, msg);
      var data = msg;
      this._tableModel.addRowsAsMapArray([data], null, true);
    },

    _on_cellTap : function (e)
    {
      var row = this._tableModel.getRowData(e.getRow());
      this.set_details(row);
    },

    _on_selection_change : function (e)
    {
      var rowIndex = this._table.getSelectionModel().getAnchorSelectionIndex();
      var row = this._tableModel.getRowData(rowIndex);
      this.set_details(row);
    },

    set_details : function (row)
    {
      this._details.removeAll();
      for (var i = 0; i < row.details.length; i++)
      {
        var item = new qx.ui.form.ListItem(row.details[i]);
        this._details.add(item);
      }
    },

    createDetails : function ()
    {
      var lst = new qx.ui.form.List();
      return lst;
    },

    createTable : function()
    {
      // table model
      var tableModel = this._tableModel = new qx.ui.table.model.Simple();
      var colConfig = this._settings.colConfig;
      if (!colConfig) colConfig = this._defaultColConfig;
      var colNames = colConfig.map(function(x){return x[0];});
      tableModel.setColumns(colNames);
      console.log("colnames",colNames);
      //tableModel.sortByColumn(1, true);
      //tableModel.setColumnSortable(3, false);

      // Customize the table column model.  We want one that automatically resizes columns.
      var custom =
      {
        tableColumnModel : function(obj) {
          return new qx.ui.table.columnmodel.Resize(obj);
        }
      };

      var table = new qx.ui.table.Table(tableModel/*, custom*/);

      //table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

      table.addListener("cellTap", this._on_cellTap, this);
      table.getSelectionModel().addListener("changeSelection", this._on_selection_change, this);

      var tcm = table.getTableColumnModel();
      var tm = table.getTableModel();
      //var tb = tcm.getBehavior();

      colConfig.forEach(function(colData,index) {
        tcm.setColumnWidth(index, colData[1]);
        //tb.setWidth(index, colData[1]); // Above doesn't work since we're using resize behavior?
        tcm.setColumnVisible(index, colData[2]);
      });

      table.setDataRowRenderer(new poxdesk.CableBearRowRenderer(table));

      return table;
    },

    createControls : function()
    {

      var bar = new qx.ui.menubar.MenuBar;
      var menu, opt;

      menu = new qx.ui.menu.Menu();
      opt = new qx.ui.menu.Button("Reset Settings");
      opt.addListener("execute", function () {
        window.localStorage.setItem("CableBear", null);
        window.alert("To see the changes, you'll need to open a new window.");
        this._noSave = true;
      }, this);
      menu.add(opt);
      opt = new qx.ui.menu.Button("Quit");
      opt.addListener("execute", function () {
        this.dispose();
      }, this);
      menu.add(opt);
      bar.add(new qx.ui.menubar.Button("File", null, menu));

      menu = new qx.ui.menu.Menu();
      opt = new qx.ui.menu.Button("About");
      opt.addListener("execute", function () {
        window.alert("CableBear\n\nTCP packet display utility\n\nby Murphy McCauley, 2018", "About");
      }, this);
      menu.add(opt);
      bar.add(new qx.ui.menubar.Button("Help", null, menu));

      return bar;
    },

    _noSave : false,
    _defaultColConfig : [['dir',22,true],['num',40,true],['ts',50,true],['src_ip',90,false],['dst_ip',90,false],['src_port',55,true],['dst_port',55,true],['flg',30,true],['awin',50,true],['rwnd',50,false],['seq',70,true],['retx',22,true],['ack',70,true],['dup_ack',22,true],['len',40,true],['io',22,true]],
    _settings : null,
    _dispatcher : null,
    _container : null,
    _controls : null,
    _table : null,
    _split : null,
    _tableModel : null
  },

  destruct : function() {
    this._disposeObjects("_dispatcher", "_container");
  }
});
