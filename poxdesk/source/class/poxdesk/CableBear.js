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
    this._container = new poxdesk.ui.window.Window("Disconnected - CableBear");
    this._container.setShowMaximize(true);
    this._container.setAllowMaximize(true);
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/actions/system-search.png",
      width: 740,
      height: 400,
      contentPadding : [ 0, 0, 0, 0 ]
    });
    this._container.setLayout(new qx.ui.layout.VBox());

    this._table = this.createTable();
    this._controls = this.createControls();
    if (this._controls) this._container.add(this._controls);

    //this._container.add(this._table, {flex: 1});

    var split = new qx.ui.splitpane.Pane("vertical");
    this._container.add(split, {flex: 1});

    split.add(this._table, 2);
    this._details = this.createDetails()
//    this._details.setHeight(this._container.getHeight() * 0.25);
    split.add(this._details, 1);

    ///this._container.add(this._table, {flex: 1});

    //this._tableModel.addRows([["","(Not Connected)"]]);

    this._dispatcher = new poxdesk.WebsocketChannel();
    this._dispatcher.addListener("message", this._on_message, this);
    this._dispatcher.addListener("disconnected", function () { this._container.setCaption("Disconnected - CableBear"); this._dispatcher.close(); }, this);
    this._dispatcher.addListener("connected", function () { this._container.setCaption("CableBear"); }, this);
    this._dispatcher.setLocation("ws://" + location.host + "/cable_bear/ws");
    this._dispatcher.start();
    console.log("CableBear starting...");

    //this._dispatcher.getExposedObjects()[undefined] = this;
  },

  members :
  {
    _on_message : function (msg)
    {
      msg = msg.getData();
      msg['io'] = '';
      if (msg['in_order'] === true)
      {
        msg['io'] = String.fromCharCode(0x2705);
      }
      else if (msg['in_order'] === false)
      {
        msg['io'] = String.fromCharCode(0x274C);
      }
      msg['flg'] = msg['flags'];
      console.log(msg.num, msg);
      var data = msg;
      this._tableModel.addRowsAsMapArray([data], null, true);
    },

    _on_cellTap : function (e)
    {
      var row = this._tableModel.getRowData(e.getRow());
      this._details.removeAll();
      for (var i = 0; i < row.details.length; i++)
      {
        var item = new qx.ui.form.ListItem(row.details[i]);
        this._details.add(item);
      }
    },

    /*
    _pdmethod_setCaption : function (title)
    {
      this._container.setCaption(title);
    },
    */

    createDetails : function ()
    {
      var lst = new qx.ui.form.List();
      return lst;
    },

    createTable : function()
    {
      // table model
      var tableModel = this._tableModel = new qx.ui.table.model.Simple();
      tableModel.setColumns([ "num", "ts", /*"src_ip", "dst_ip",*/ "src_port", "dst_port", "flg", "awin", "seq", "ack", "len", "io", "notes" ]);
      //tableModel.sortByColumn(1, true);
      //tableModel.setColumnSortable(3, false);

      // Customize the table column model.  We want one that automatically resizes columns.
      var custom =
      {
        tableColumnModel : function(obj) {
          return new qx.ui.table.columnmodel.Resize(obj);
        }
      };

      var table = new qx.ui.table.Table(tableModel, custom);

      //table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

      table.addListener("cellTap", this._on_cellTap, this);

      var tcm = table.getTableColumnModel();

      var rez = tcm.getBehavior();
      [40,50,/*90,90,*/55,55,30,50,50,50,40,22].forEach(function (w, i) {
        rez.setWidth(i, w);
      });

      table.setDataRowRenderer(new poxdesk.CableBearRowRenderer(table));

      return table;
    },

    createControls : function()
    {

      var bar = new qx.ui.menubar.MenuBar;
      var menu, opt;

      menu = new qx.ui.menu.Menu();
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

    _dispatcher: null,
    _container : null,
    _controls : null,
    _table : null,
    _tableModel : null
  },

  destruct : function() {
    this._disposeObjects("_dispatcher", "_container");
  }
});
