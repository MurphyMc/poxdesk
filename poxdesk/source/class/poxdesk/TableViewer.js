/*
#asset(qx/icon/Tango/16/actions/system-search.png)
*/

qx.Class.define("poxdesk.TableViewer",
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
    this._mac_to_port = {};
    this._switches = {};
    this._container = new poxdesk.ui.window.Window("Disconnected - TableViewer");
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/actions/system-search.png",
      width: 740,
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
      var chan = "of_01";//"openflow" + data.getSession() + "_" + data.toHashCode();
      this._messenger.join(chan);
      this._messenger.addChannelListener(chan, this._on_openflow, this);
      this._messenger.send({'cmd':'list_switches'}, chan);
      this.debug("Sending switch request");

    }, this);
    //this.refresh();

    this._buildMenu();

    //this._tableModel.addRows([["","(Not Connected)"]]);
  },
  
 
  members :
  {

    refresh : function ()
    {
      this.info("REFRESH");
      this._messenger.send({'cmd':'get_flow_stats','dpid':this._selected}, 'of_01');
    },

    _on_openflow : function (data)
    {
      //this.debug("LOG:" + JSON.stringify(data));
//this._tableModel.addRows([[icon,time,subsystem,msg]]);
      if (data.type_str == 'ConnectionUp')
      {
        this.addSwitch(data);//Probably not quite right!
      }
      else if (data.type_str == 'ConnectionDown')
      {
        //this.removeSwitch(data.dpid);
      }
      else if (data.switch_list)
      {
        for (var i = 0; i < data.switch_list.length; i++)
        {
          this.addSwitch(data.switch_list[i]);
        }
      }
      else if (data.flow_stats && data.dpid === this._selected)
      {
        var fieldnames = [ "in_port", "dl_src", "dl_dst", "dl_type", "nw_src", "nw_dst", /*"tp_src", "tp_dst"*/ ];
//this.debug(JSON.stringify(data.flow_stats));
        var table = [];

        for (var i = 0; i < data.flow_stats.length; i++)
        {
          var record = data.flow_stats[i];
//this.debug(JSON.stringify(record));
          var entry = [];
          table.push(entry);
          for (var j = 0; j < fieldnames.length; j++)
          {
            var field = fieldnames[j];
            entry.push(record.match[field]);
          }
          var actions = "";
          for (var j = 0; j < record.actions.length; j++)
          {
            var act = record.actions[j];
            var atype = act.type;
            if (atype.substring(0, 6) == "OFPAT_") atype = atype.substring(6);
            actions += ',' + atype;
            if (act.port !== undefined) actions += ":" + act.port;
          }
          if (actions.length) actions = actions.substring(1);
          entry.push(actions);
        }

        this._tableModel.setData(table);

      }
    },

    _sendTable : function ()
    {
      var table = [];

      var st = {'cmd':'set_table', 'dpid':this._selected};
      st.flows = table;

      //this.debug(JSON.stringify(st));
      this._messenger.send(st, 'of_01');
    },

    addSwitch : function (sw)
    {
      this.debug(sw);
      this._switches[sw.dpid] = sw;
      this._buildMenu();
    },

    _checkItem : function (checkbox)
    {
      this._selected = checkbox.getLabel();
      this._buildMenu();
      this._container.setCaption(this._selected + " - TableViewer");
      this._tableModel.setData([]);
      //this._sendTable();
      this._timer = new qx.event.Timer(3500);
      this._timer.addListener("interval", this.refresh, this);
      this._timer.setEnabled(true);
      this.refresh();
    },

    _buildMenu : function ()
    {
      var count = 0;
      var self = this;
      function cb (e)
      {
        self._checkItem(this);
      }

      this._switchMenu.removeAll();
      for (var dpid in this._switches)
      {
        count++;
        var opt = new qx.ui.menu.CheckBox(dpid);
        if (!this._selected)
        {
          opt.addListener('changeValue', cb);
        }
        else
        {
          opt.setEnabled(false);
        }
        if (dpid == this._selected) opt.setValue(true);
        this._switchMenu.add(opt);
      }

      if (count == 0)
      {
        var opt = new qx.ui.menu.CheckBox("(No switches yet)");
        opt.setEnabled(false);
        this._switchMenu.add(opt);
      }
    },

    createTable : function()
    {
      // table model
      var tableModel = this._tableModel = new qx.ui.table.model.Simple();
      tableModel.setColumns([ "port", "dl_src", "dl_dst", "dl_type", "nw_src", "nw_dst", /*"tp_src", "tp_dst",*/ "actions" ]);
//      tableModel.sortByColumn(1, true);
      //tableModel.setColumnSortable(3, false);
      
      // Customize the table column model.  We want one that automatically resizes columns.
      var custom =
      {
        tableColumnModel : function(obj) {
          return new qx.ui.table.columnmodel.Resize(obj);
        }
      };
      
      var table = new qx.ui.table.Table(tableModel, custom);
      
      /*
      table.set({
        width: 300,
        height: 400,
        decorator : null
      });
      */
      
      //table.getSelectionModel().setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
      
      var tcm = table.getTableColumnModel();
            
      var rez = tcm.getBehavior();
      rez.setWidth(0, 40);
      rez.setWidth(1, 120);
      rez.setWidth(2, 120);
      rez.setWidth(3, 55);
      rez.setWidth(4, 70);
      rez.setWidth(5, 70);
      //rez.setMinWidth(8-2, 140);
      //rez.setWidth(1, 110);

      return table;
    },



    createControls : function()
    {

      var bar = new qx.ui.menubar.MenuBar;
      var menu, opt;

      //menu = new qx.ui.menu.Menu;
      //opt = new qx.ui.menu.CheckBox();
      //menu.add(opt);

      this._switchMenu = new qx.ui.menu.Menu();
      menu = new qx.ui.menubar.Button("Switch", null, this._switchMenu);
      bar.add(menu);

      /*
      menu.addListener("execute", function (e) {
        this.debug("REQUEST SWITCHES");
        this._messenger.send({'cmd':'list_switches'}, 'of_01');
      }, this);
      */

      menu = new qx.ui.menu.Menu();
      opt = new qx.ui.menu.Button("Refresh");
      opt.addListener("execute", function () {
        this.refresh();
      }, this);
      menu.add(opt);
      opt = new qx.ui.menu.Button("Clear");
      opt.addListener("execute", function () {
        this._sendTable();
      }, this);
      menu.add(opt);
      bar.add(new qx.ui.menubar.Button("Operations", null, menu));
      

      return bar;
    },

    _mac_to_port : null, // learn table
    _selected : null, // selected switch (or null)
    _switches : null, // switches we know about
    _switchMenu : null,
    _messenger : null,
    _container : null,
    _controls : null,
    _table : null,
    _tableModel : null,
    _timer : null
  }, 

  destruct : function() {
    this._disposeObjects("_messenger", "_timer");
  }
});
