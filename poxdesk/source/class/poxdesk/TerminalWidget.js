// Terminal widget for qooxdoo
// Murphy McCauley, 2009, 2011
//
// This is based on a JavaScript terminal emulator I found (license below),
// though I've made a number of enhancements besides just converting to
// qooxdoo.  It looks like some other work has been done on the original too,
// including independent implementation of some of the stuff I've done, 
// so it might make some sense to try to sync changes.
// It looks like a the most current version of that work is at:
//  http://code.google.com/p/sshconsole/source/browse/content/VT100.js
//
// Original info/license follows.
// ------------------------------------------------------------------------
// VT100.js -- a text terminal emulator in JavaScript with a ncurses-like
// interface and a POSIX-like interface. (The POSIX-like calls are
// implemented on top of the ncurses-like calls, not the other way round.)
//
// Released under the GNU LGPL v2.1, by Frank Bi <bi@zompower.tk>
// ------------------------------------------------------------------------

qx.Class.define("poxdesk.TerminalWidget",
{
  extend : qx.ui.core.Widget,
  
  events :
  {
    "characters": "qx.event.type.Data"
  },
  
  properties :
  {    
    insert : 
    {
      check : 'Boolean',
      init : false
    },
    
    echo :
    {
      check : 'Boolean',
      init : false
    },
    
    cursorVisible :
    {
      check : 'Boolean',
      init : true
    },
    
    //TODO: handle changing of these properties
    //TODO: handle _applyFont?
    columns :
    {
      check : 'Integer',
      init : 80
    },
    
    rows : 
    {
      check : 'Integer',
      init : 25
    },
    
    fontSize :
    {
      init : 12
    },
    
    
    selectable :
    {
      refine : true,
      init : false
    },

    // overridden
    allowGrowX :
    {
      refine : true,
      init : false
    },

    // overridden
    allowGrowY :
    {
      refine : true,
      init : false
    },

    // overridden
    allowShrinkX :
    {
      refine : true,
      init : false
    },
    
    // overridden
    allowShrinkY :
    {
      refine : true,
      init : false
    },
    
    focusable :
    {
      refine: true,
      init : true
    }
  },
  
  statics :
  {
      COLOR_BLACK : 0,
      COLOR_BLUE : 1,
      COLOR_GREEN : 2,
      COLOR_CYAN : 3,
      COLOR_RED : 4,
      COLOR_MAGENTA : 5,
      COLOR_YELLOW : 6,
      COLOR_WHITE : 7,
      COLOR_PAIRS : 256,
      COLORS : 8,
      // public constants -- attributes
      A_NORMAL : 0,
      A_UNDERLINE : 1,
      A_REVERSE : 2,
      A_BLINK : 4,
      A_DIM : 8,
      A_BOLD : 16,
      A_STANDOUT : 32,
      A_PROTECT : 0,
      A_INVIS : 0, // ?
      // other public constants
      TABSIZE : 8,
      // private constants
      //ATTR_FLAGS_ : A_UNDERLINE | A_REVERSE | A_BLINK | A_DIM | A_BOLD | A_STANDOUT | A_PROTECT | A_INVIS,
      _ATTR_FLAGS : 0x3f
      //_COLOR_SHIFT : 6,        
  },
  
  
  construct : function()
  {
    this.__self = this.self(arguments);
    this.__bkgd_ = {
                    mode: this.__self.A_NORMAL,
                    fg: this.__self.COLOR_WHITE,
                    bg: this.__self.COLOR_BLACK
                 };
    this.__c_attr_ = {
                    mode: this.__self.A_NORMAL,
                    fg: this.__self.COLOR_WHITE,
                    bg: this.__self.COLOR_BLACK
                 };    
    this.base(arguments);
    this.addListener("keypress", this._onKeyPress); 
  },
  
  destruct : function ()
  {
    //TODO: clean stuff up?
    if (this.__beep) document.body.removeChild(this.__beep);    
  },
  
  members :
  {
    __beep : null, // bell
    __self : null,
    __invalidContentSize : true,
    __element : null,
    __font : null,
    __contentSize :
    {
      width : 0,
      height : 0
    },
    
    __bell : function ()
    {
      //TODO: clean this up, use qooxdoo, use html5, etc.
      this.debug(" ** DING ! **");
      if (this.__beep) document.body.removeChild(this.__beep);
      this.__beep = document.createElement("embed");
      this.__beep.setAttribute("src", "resource/poxdesk/terminal_bell.wav");
      this.__beep.setAttribute("hidden", true);
      this.__beep.setAttribute("autostart", true);
      document.body.appendChild(this.__beep);    
    },
    
    visualizeFocus : function() {
      this.base(arguments);
      this.__refresh();
    },

    /**
     * Event handler which is executed when the widget lost the focus.
     *
     * This method is used by the {@link #qx.ui.core.FocusHandler} to
     * remove states etc. from a previously focused widget.
     *
     * @internal
     * @return {void}
     */
    visualizeBlur : function() {
      this.base(arguments);
      this.__refresh();
    },
    
    _onKeyPress : function (e)
    {
      var cursorPrefix = this.__application_cursor_key_mode ? '\x1bO' : '\x1b[';
      e.preventDefault();
      var c = e.getKeyIdentifier();
      if (c.length == 1)
      {
        if (e.isShiftPressed() == false) c = c.toLowerCase();
        if (e.isCtrlPressed())
        {
          var cc = c.toUpperCase().charCodeAt(0);
          if (cc >= 64 && cc <= 95) c = String.fromCharCode(cc - 64);
          this.debug("ctrl",c,cc);
        }
        else this.debug("plain");
      }
      else if (c == 'Space') c = ' ';
      else if (c == 'Backspace') c = '\b';
      else if (c == 'Tab') c = '\t';
      else if (c == 'Enter') c = '\n';
      
      else if (c == 'Up') c = cursorPrefix + 'A';
      else if (c == 'Down') c = cursorPrefix + 'B';
      else if (c == 'Right') c = cursorPrefix + 'C';
      else if (c == 'Left') c = cursorPrefix + 'D';

      else if (c == 'Delete') c = '\x1b[3~';
      else if (c == 'Home') c = '\x1b[H';
      else if (c == 'Escape') c = '\x1b';
      else return;
      this.__pushData(c);
    },
    
    __pushData : function (c, noEcho)
    {
      if (this.__echo && (noEcho !== true)) this.write(c);
      this.fireDataEvent('characters', c)
    },
    
    /*getFocusElement : function()
    {
      return this.getContentElement();
    },*/

    
    __getFont : function ()
    {
      if (!this.__font) this.__font = new qx.bom.Font(this.getFontSize(), ['monospace']);
      return this.__font;
    },
    
    __computeContentSize : function()
    {    
      this.__refresh();
        
      // Annoyingly, browsers add
      var s = "";
      for (var i = 0; i < 80; i++) s += ".";
      this.__contentSize = qx.bom.Label.getTextSize(s, this.__getFont().getStyles());
      this.__invalidContentSize = false;
    },
    
    // overridden
    _getContentHint : function()
    {
      this.__computeContentSize();  

      var h = {
        width : this.__contentSize.width-1,// * this.getColumns(),
        height : this.__contentSize.height * this.getRows()
      };      
      this.debug("pane size", h, this.getColumns(), this.getRows());
      return h;
    },
    
    write : function (msg)
    {
      this.__write(msg);
    },
    
    _createContentElement : function()
    {
      this.__element = new qx.html.Label();
      this.__element.setRich(true);
this.debug("STYLE",JSON.stringify(this.__getFont().getStyles()))
      this.__element.setStyles(this.__getFont().getStyles());
      
      this.__createBuffer();    
      //this.write("One moment...");
      
    
      this.__element.setStyle("overflowX", "auto");
      this.__element.setStyle("overflowY", "auto");

      return this.__element;
    },
    
    
    
    __topmargin : 0,
    __botmargin : -1,
    __application_cursor_key_mode : false,
    __autowrap : false,
    __esc_state_ : 0,
    __scrolled_ : 0,
    __bkgd_ : null, /*{
                    mode: this.__self.A_NORMAL,
                    fg: this.__self.COLOR_WHITE,
                    bg: this.__self.COLOR_BLACK
                 },*/
    __c_attr_ : null, /*{
                    mode: this.__self.A_NORMAL,
                    fg: this.__self.COLOR_WHITE,
                    bg: this.__self.COLOR_BLACK
                 },*/
    //columns : null, //FIXME: remove
    //getRows() : null, //FIXME: remove 
    __text_ : null,
    __attr_ : null,
    __debug_ : false,
    __row_ : 0,
    __col_ : 0,
    
    
    
    __createBuffer : function ()
    {
      //this.getColumns() = this.getColumns(); //FIXME
      //this.getRows() = this.getRows(); // FIXME
      
      var r;
      this.__text_ = new Array(this.getRows());
      this.__attr_ = new Array(this.getRows());
      for (r = 0; r < this.getRows(); ++r) {
            this.__text_[r] = new Array(this.getColumns());
            this.__attr_[r] = new Array(this.getColumns());
      }
    
      this.__clear();
      this.__refresh();
    },
    

    // object methods

    __identify : function ()
    {
      // Send terminal identification.  As far as I can tell...
      //var response = "\x1b[?1;2c";  // vt100 with AVO (Advanced Video Option) -- 132x24 support
      //var response = "\x1b[?1;0c";  // vt101
      var response = "\x1b[?6c";    // vt102 
      this.__pushData(response, true);
      this.__debug("sending terminal identification");
    },
    
    __insert_line : function ()
    {
      var wd = this.getColumns();
      var bot = (this.__botmargin == -1) ? this.getRows() - 1 : this.__botmargin;
      var top = this.__topmargin;
      var n_text = this.__text_[bot], n_attr = this.__attr_[bot];
      for (var r = bot; r > top; --r)
      {
              this.__text_[r] = this.__text_[r-1];
              this.__attr_[r] = this.__attr_[r-1];
      }
      this.__text_[top] = n_text;
      this.__attr_[top] = n_attr;
      for (var c = 0; c < wd; ++c) {
              n_text[c] = ' ';
              n_attr[c] = this.__bkgd_;
      }
    },
    
    __may_scroll_ : function()
    {
        var ht = this.__botmargin;
        if (ht == -1)
          ht = this.getRows();
        else
          ht += 1;
        var cr = this.__row_;
//if (this.lcr != cr || this.lht != ht) this.debug("may scroll ", cr, " ", ht); 
//this.lcr = cr;this.lht=ht;       
        while (cr >= ht) {
                this.__scroll();
                --cr;
        }
        this.__row_ = cr;
    },

    __html_colours_ : function(attr)
    {
        var fg, bg, co0, co1;
        fg = attr.fg;
        bg = attr.bg;
        switch (attr.mode & (this.__self.A_REVERSE | this.__self.A_DIM | this.__self.A_BOLD)) {
            case 0:
            case this.__self.A_DIM | this.__self.A_BOLD:
                co0 = '00';  co1 = 'c0';
                break;
            case this.__self.A_BOLD:
                co0 = '00';  co1 = 'ff';
                break;
            case this.__self.A_DIM:
                if (fg == this.__self.COLOR_BLACK)
                        co0 = '40';
                else
                        co0 = '00';
                co1 = '40';
                break;
            case this.__self.A_REVERSE:
            case this.__self.A_REVERSE | this.__self.A_DIM | this.__self.A_BOLD:
                co0 = 'c0';  co1 = '40';
                break;
            case this.__self.A_REVERSE | this.__self.A_BOLD:
                co0 = 'c0';  co1 = '00';
                break;
            default:
                if (fg == this.__self.COLOR_BLACK)
                        co0 = '80';
                else
                        co0 = 'c0';
                co1 = 'c0';
        }
        return {
                f: '#' + (fg & 4 ? co1 : co0) +
                         (fg & 2 ? co1 : co0) +
                         (fg & 1 ? co1 : co0),
                b: '#' + (bg & 4 ? co1 : co0) +
                         (bg & 2 ? co1 : co0) +
                         (bg & 1 ? co1 : co0)
            };
    },

    __addch : function(ch, attr) 
    {
        var cc = this.__col_;
        //this.__debug("addch:: ch: " + ch + ", attr: " + attr);
        switch (ch) {
            case '\b':
                if (cc != 0)
                        --cc;
                break;
            case '\n':
this.debug("1 line",this.__row_);            
                ++this.__row_;
this.debug("2 line",this.__row_);                
                cc = 0;
//                this.__clrtoeol();
                this.__may_scroll_();
this.debug("3 line",this.__row_);                
                break;
            case '\r':            
                this.__may_scroll_();
                cc = 0;
                break;
            case '\t':
                this.__may_scroll_();
                cc += this.__self.TABSIZE - cc % this.__self.TABSIZE;
                if (cc >= this.getColumns()) {
                        ++this.__row_;
                        cc -= this.getColumns();
                }
                break;
            default:
                if (attr === undefined)
                        attr = this.___cloneAttr(this.__c_attr_);
                if (cc >= this.getColumns()) {
                        if (!this.__autowrap)
                        {
                          this.__debug("omit");
                          return;
                        }
                        ++this.__row_;
                        cc = 0;
                }
                this.__may_scroll_();
                if (this.getInsert())
                {
                  for (var c = this.getColumns() - 1; c > cc; --c)
                  {
                    this.__text_[this.__row_][c] = this.__text_[this.__row_][c - 1];
                    this.__attr_[this.__row_][c] = this.__attr_[this.__row_][c - 1];
                  }                
                  this.__text_[this.__row_][cc] = ch;
                  this.__attr_[this.__row_][cc] = attr;                
                }
                else
                {
                  this.__text_[this.__row_][cc] = ch;
                  this.__attr_[this.__row_][cc] = attr;
                }
                ++cc;
        }
        this.__col_ = cc;
    },

    __addstr : function(stuff)
    {
        for (var i = 0; i < stuff.length; ++i)
                this.__addch(stuff.charAt(i));
    },

    ___cloneAttr : function (a)
    {
        return {
                mode: a.mode,
                fg: a.fg,
                bg: a.bg
        };
    },

    __attroff : function(a)
    {
        //this.__debug("attroff: " + a + "\n");
        a &= this.__self._ATTR_FLAGS;
        this.__c_attr_.mode &= ~a;
    },

    __attron : function(a)
    {
        //this.__debug("attron: " + a + "\n");
        a &= this.__self._ATTR_FLAGS;
        this.__c_attr_.mode |= a;
    },

    __attrset : function(a)
    {
        //this.__debug("attrset: " + a + "\n");
        this.__c_attr_.mode = a;
    },

    __fgset : function(fg)
    {
        //this.__debug("fgset: " + fg + "\n");
        this.__c_attr_.fg = fg;
    },

    __bgset : function(bg)
    {
        //this.__debug("bgset: " + bg + "\n");
        this.__c_attr_.bg = bg;
    },

    __bkgdset : function(a)
    {
        this.__bkgd_ = a;
    },

    __clear : function()
    {
        this.__debug("clear");
        this.__row_ = this.__col_ = 0;
        this.__scrolled_ = 0;
        for (var r = 0; r < this.getRows(); ++r) {
                for (var c = 0; c < this.getColumns(); ++c) {
                        this.__text_[r][c] = ' ';
                        this.__attr_[r][c] = this.___cloneAttr(this.__bkgd_);
                }
        }
    },

    __clrtobot : function()
    {
        this.__debug("clrtobot, row: " + this.__row_);
        var ht = this.getRows();
        var wd = this.getColumns();
        this.__clrtoeol();
        for (var r = this.__row_ + 1; r < ht; ++r) {
                for (var c = 0; c < wd; ++c) {
                        this.__text_[r][c] = ' ';
                        this.__attr_[r][c] = this.__bkgd_;
                }
        }
    },


    __clrtoeol : function()
    {
        this.__debug("clrtoeol, col: " + this.__col_);
        var r = this.__row_;
        if (r >= this.getRows())
                return;
        for (var c = this.__col_; c < this.getColumns(); ++c) {
                this.__text_[r][c] = ' ';
                this.__attr_[r][c] = this.__bkgd_;
        }
    },

    __dch : function(count)
    {
        this.__debug("dch, col: " + this.__col_);
        var r = this.__row_;
        if (r >= this.getRows()) return;
        this.__text_[r][this.__col_] = ' ';
        var attr = this.___cloneAttr(this.__attr_[r][this.getColumns() - count]);
        for (var c = this.__col_; c < this.getColumns() - count; ++c)
        {
                this.__text_[r][c] = this.__text_[r][c + count];
                this.__attr_[r][c] = this.__attr_[r][c + count];
        }
        for (var c = this.getColumns() - count; c < this.getColumns(); ++c)
        {        
          this.__text_[r][c] = ' ';
          this.__attr_[r][c] = attr;
        }
    },
    
    __clearpos : function(row, col)
    {
        this.__debug("clearpos (" + row + ", " + col + ")");
        if (row < 0 || row >= this.getRows())
                return;
        if (col < 0 || col >= this.getColumns())
                return;
        this.__text_[row][col] = ' ';
        this.__attr_[row][col] = this.__bkgd_;
    },

    __getyx : function()
    {
        return { y: this.__row_, x: this.__col_ };
    },

    __move : function(r, c)
    {
        this.__debug("move: (" + r + ", " + c + ")");
this.debug("move: (" + r + ", " + c + ")");        
        if (r < 0)
                r = 0;
        else if (r >= this.getRows())
                r = this.getRows() - 1;
        if (c < 0)
                c = 0;
        else if (c >= this.getColumns())
                c = this.getColumns() - 1;
        this.__row_ = r;
        this.__col_ = c;
    },



    __refresh : function()
    {
        this.__debug("refresh");
        var r, c, stuff = "", start_tag = "", end_tag = "", at = -1, n_at, ch,
            pair, cr, cc, ht, wd, cv, added_end_tag;
        ht = this.getRows();
        wd = this.getColumns();
        cr = this.__row_;
        cc = this.__col_;
        cv = this.getCursorVisible() && this.hasState('focused');
        
        if (cc >= wd)
                cc = wd - 1;
        for (r = 0; r < ht; ++r) {
                if (r > 0) {
                        stuff += '\n';
                }
                for (c = 0; c < wd; ++c) {
                        added_end_tag = false;
                        n_at = this.__attr_[r][c];
                        if (cv && r == cr && c == cc) {
                                // Draw the cursor here.
                                n_at = this.___cloneAttr(n_at);
                                n_at.mode ^= this.__self.A_REVERSE;
                        }
                        // If the attributes changed, make a new span.
                        if (at == -1 || n_at.mode != at.mode || n_at.fg != at.fg || n_at.bg != at.bg) {
                                if (c > 0) {
                                        stuff += end_tag;
                                }
                                start_tag = "";
                                end_tag = "";
                                if (n_at.mode & this.__self.A_BLINK) {
                                        start_tag = "<blink>";
                                        end_tag = "</blink>" + end_tag;
                                }
                                if (n_at.mode & this.__self.A_STANDOUT)
                                        n_at.mode |= this.__self.A_BOLD;
                                pair = this.__html_colours_(n_at);
                                start_tag += '<span style="white-space:nowrap;color:' + pair.f +
                                             ';background-color:' + pair.b;
                                if (n_at.mode & this.__self.A_UNDERLINE)
                                        start_tag += ';text-decoration:underline';
                                start_tag += ';">';
                                stuff += start_tag;
                                end_tag = "</span>" + end_tag;
                                at = n_at;
                                added_end_tag = false;//true;
                        } else if (c == 0) {
                                stuff += start_tag;
                        }
                        ch = this.__text_[r][c];
                        switch (ch) {
                            case '&':
                                stuff += '&amp;';       break;
                            case '<':
                                stuff += '&lt;';        break;
                            case '>':
                                stuff += '&gt;';        break;
                            case ' ':
                                //stuff += ' '; break;
                                stuff += '&nbsp;';   break;
                            default:
                                stuff += ch;
                        }
                        //if (c == wc-1)
                        //{
                        //}
                }
                if (!added_end_tag)
                        stuff += end_tag;
        }
        //this.__domElement.innerHTML = "<b>" + stuff + "</b>\n";
        //this.__domElement.innerHTML = stuff + "\n";
        //this.__element.setContent("<b>" + stuff + "</b>");
        this.__element.setValue(stuff);
    },

    __scroll : function()
    {
        this.__scrolled_ += 1;
        this.__debug("scrolled: " + this.__scrolled_);
        var n_text = this.__text_[this.__topmargin], n_attr = this.__attr_[this.__topmargin];
        var wd = this.getColumns();
        var ht = (this.__botmargin == -1) ? this.getRows() : (this.__botmargin + 1);
        for (var r = this.__topmargin + 1; r < ht; ++r) {
                this.__text_[r - 1] = this.__text_[r];
                this.__attr_[r - 1] = this.__attr_[r];
        }
        this.__text_[ht - 1] = n_text;
        this.__attr_[ht - 1] = n_attr;
        for (var c = 0; c < wd; ++c) {
                n_text[c] = ' ';
                n_attr[c] = this.__bkgd_;
        }
    },

    __standend : function()
    {
        //this.__debug("standend");
        this.__attrset(0);
    },

    __standout : function()
    {
        //this.__debug("standout");
        this.__attron(this.__self.A_STANDOUT);
    },

    __write : function(stuff)
    {
        var ch, x, r, c, i, j, yx, myx;
        for (i = 0; i < stuff.length; ++i) {
                ch = stuff.charAt(i);
                if (ch == '\x0D') {
                        //this.__debug("write:: ch: " + ch.charCodeAt(0) + ", '\\x0D'");
                } else {
                        //this.__debug("write:: ch: " + ch.charCodeAt(0) + ", '" + (ch == '\x1b' ? "ESC" : ch) + "'");
                }
                //this.__debug("ch: " + ch.charCodeAt(0) + ", '" + (ch == '\x1b' ? "ESC" : ch) + "'\n");
                switch (ch) {
                    case '\x00':
                    case '\x7f':
                        continue;
                    case '\x07':  /* bell, ignore it */
                        //this.debug("BEEP");
                        this.__bell();
                        continue;
                    case '\a':
                    case '\b':
                    case '\t':
                    case '\r':
                        this.__addch(ch);
                        continue;
                    case '\n':
this.__addch(ch);
continue;
                    case '\v':
                    case '\f': // what a mess
                        yx = this.__getyx();
                        myx = {x: this.getColumns() - 1, y: this.getRows() - 1};
                        if (yx.y >= myx.y) {
                                this.__scroll();
                                this.__move(myx.y, 0);
                        } else
                                this.__move(yx.y + 1, 0);
                        continue;
                    case '\x18':
                    case '\x1a':
                        this.__esc_state_ = 0;
                        this.__debug("write:: set escape state: 0");
                        continue;
                    case '\x1b':
                        this.__esc_state_ = 1;
                        this.__debug("write:: set escape state: 1");
                        continue;
                    case '\x9b':
                        this.__esc_state_ = 2;
                        this.__debug("write:: set escape state: 2");
                        continue;
                }
                // not a recognized control character
                switch (this.__esc_state_) {
                    case 0: // not in escape sequence
                        this.__addch(ch);
                        break;
                    case 1: // just saw ESC
                        switch (ch) {
                            case '[':
                                this.__esc_state_ = 2;
                                //this.__debug("write:: set escape state: 2");
                                break;
                            case '=':
                                /* Set keypade mode (ignored) */
                                this.__debug("write:: set keypade mode: ignored");
                                this.__esc_state_ = 0;
                                break;
                            case '>':
                                /* Reset keypad mode (ignored) */
                                this.__debug("write:: reset keypade mode: ignored");
                                this.__esc_state_ = 0;
                                break;
                            case 'H':
                                /* Set tab at cursor column (ignored) */
                                this.__debug("write:: set tab cursor column: ignored");
                                this.__esc_state_ = 0;
                                break;
                            default:
                                this.__debug("write:: " + ch.charCodeAt(0) + " following esc");
                        }
                        break;
                    case 2: // just saw CSI
                        switch (ch) {
                            case 'L':
                                // Insert line
                                this.__insert_line();
                                continue;
                            case 'K':
                                /* Erase in Line */
                                this.__esc_state_ = 0;
                                this.__clrtoeol();
                                continue;
                            case 'H':
                                /* Move to (0,0). */
                                this.__esc_state_ = 0;
                                this.__move(0, 0);
                                continue;
                            case 'J':
                                /* Clear to the bottom. */
                                this.__esc_state_ = 0;
                                this.__clrtobot();
                                continue;
                            case 'Z':
                                // I think this is an old vt100-specific request
                                // for terminal identification.  It's not clear to me
                                // if we should send the normal identification, or what
                                // seems to be a vt100-specific response.
                                // For now, I am sending the specific response, with the
                                // rationale that if something is sending what seems to
                                // be an older, weird request, it probably won't understand
                                // the newer response.  Not sure if this is true. :)
                                this.__warn("Sending weird old vt100 terminal identification");
                                this.__pushData("\x1b/Z", true); // specific response claiming to be a vt100 (I think)
                                //this.__identify(); // normal response
                                continue;               
                            case '?':
                                /* Special VT100 mode handling. */
                                this.__esc_state_ = 6;
                                this.__csi_parms = [0];
                                this.__debug("write:: special vt100 mode");
                                continue;
                        }
                        // Drop through to next case.
                        this.__csi_parms_ = [0];
                        this.__debug("write:: set escape state: 3");
                        this.__esc_state_ = 3;
                    case 3: // saw CSI and parameters
                    case 6: // Reset mode handling, saw <ESC>[?1
                        switch (ch) {
                            case '0':
                            case '1':
                            case '2':
                            case '3':
                            case '4':
                            case '5':
                            case '6':
                            case '7':
                            case '8':
                            case '9':
                                x = this.__csi_parms_.pop();
                                this.__csi_parms_.push(x * 10 + ch * 1);
                                this.__debug("csi_parms_: " + this.__csi_parms_);
                                continue;
                            case ';':
                                if (this.__csi_parms_.length < 17)
                                        this.__csi_parms_.push(0);
                                continue;
                        }

                        var oldstate = this.__esc_state_;
                        this.__esc_state_ = 0;

                        if (oldstate == 6)
                        {
                          // Expect a letter - the mode target, example:
                          // <ESC>[?1l : cursor key mode = cursor
                          // <ESC>[?1h : save current screen, create new empty
                          //             screen and position at 0,0
                          // <ESC>[?5l : White on blk
                          // XXX: Ignored for now.
                          //this.__debug("Saw reset mode: <ESC>[?" + this.__csi_parms_[0] + ch + "\n");
                          switch (this.__csi_parms_[0])
                          {
                            case '1': // cursor mode
                              this.__application_cursor_key_mode = ch == 'h';
                              this.__debug("application cursor mode: " + (ch == 'h'));
                              break;
                            case '7':
                              this.__autowrap = ch == 'h';
                              this.__debug("autowrap mode: " + (ch == 'h'));                                                      
                              break;
                            case '25':
                              this.setCursorVisible(ch == 'h');
                              break;

                            default:
                              this.__warn("write:: <ESC>[?" + this.__csi_parms_ + ch);                            
                          }
                        }
                        else // 3
                        {
                          switch (ch) {
                              case 'A':
                                  // Cursor Up            <ESC>[{COUNT}A
                                  this.__move(this.__row_ - Math.max(1, this.__csi_parms_[0]),
                                            this.__col_);
                                  break;
                              case 'B':
                                  // Cursor Down          <ESC>[{COUNT}B
                                  this.__move(this.__row_ + Math.max(1, this.__csi_parms_[0]),
                                            this.__col_);
                                  break;
                              case 'C':
                                  // Cursor Forward       <ESC>[{COUNT}C
                                  this.__move(this.__row_,
                                            this.__col_ + Math.max(1, this.__csi_parms_[0]));
                                  break;
                              case 'c':
                                  // Identify             <ESC>[{0}c
                                  this.__identify();
                                  break;
                              case 'D':
                                  // Cursor Backward      <ESC>[{COUNT}D
                                  this.__move(this.__row_,
                                            this.__col_ - Math.max(1, this.__csi_parms_[0]));
                                  break;
                              case 'h':
                                  if (Math.max(1, this.__csi_parms_[0]) == 4) 
                                  {
  console.log("INSERT ON");
                                    this.setInsert(true);
                                  }
                                  break;
                              case 'l':
                                  if (Math.max(1, this.__csi_parms_[0]) == 4)
                                  {
  console.log("INSERT OFF");
                                    this.setInsert(false);
                                  }
                                  break;
                              case 'P':
                                  // Delete Character (DCH) <ESC>[{COUNT}P
                                  var c = Math.max(1, this.__csi_parms_[0]);
                                  this.__dch(c);
                                  break;                                
                              case 'f':
                              case 'H':
                                  // Cursor Home          <ESC>[{ROW};{COLUMN}H
                                  this.__csi_parms_.push(0);
                                  this.__move(this.__csi_parms_[0] - 1,
                                            this.__csi_parms_[1] - 1);
                                  break;
                              case 'J':
                                  switch (this.__csi_parms_[0]) {
                                      case 0:
                                          this.__clrtobot();
                                          break;
                                      case 2:
                                          this.__clear();
                                          this.__move(0, 0);
                                  }
                                  break;
                              case 'm':
                                  for (j=0; j<this.__csi_parms_.length; ++j) {
                                          x = this.__csi_parms_[j];
                                          switch (x) {
                                              case 0:
                                                  this.__standend();
                                                  this.__fgset(this.__bkgd_.fg);
                                                  this.__bgset(this.__bkgd_.bg);
                                                  break;
                                              case 1:
                                                  this.__attron(this.__self.A_BOLD);
                                                  break;
                                              case 30:
                                                  this.__fgset(this.__self.COLOR_BLACK);
                                                  break;
                                              case 31:
                                                  this.__fgset(this.__self.COLOR_RED);
                                                  break;
                                              case 32:
                                                  this.__fgset(this.__self.COLOR_GREEN);
                                                  break;
                                              case 33:
                                                  this.__fgset(this.__self.COLOR_YELLOW);
                                                  break;
                                              case 34:
                                                  this.__fgset(this.__self.COLOR_BLUE);
                                                  break;
                                              case 35:
                                                  this.__fgset(this.__self.COLOR_MAGENTA);
                                                  break;
                                              case 36:
                                                  this.__fgset(this.__self.COLOR_CYAN);
                                                  break;
                                              case 37:
                                                  this.__fgset(this.__self.COLOR_WHITE);
                                                  break;
                                              case 40:
                                                  this.__bgset(this.__self.COLOR_BLACK);

                                                  break;
                                              case 41:
                                                  this.__bgset(this.__self.COLOR_RED);
                                                  break;
                                              case 42:
                                                  this.__bgset(this.__self.COLOR_GREEN);
                                                  break;
                                              case 44:
                                                  this.__bgset(this.__self.COLOR_YELLOW);
                                                  break;
                                              case 44:
                                                  this.__bgset(this.__self.COLOR_BLUE);
                                                  break;
                                              case 45:
                                                  this.__bgset(this.__self.COLOR_MAGENTA);
                                                  break;
                                              case 46:
                                                  this.__bgset(this.__self.COLOR_CYAN);
                                                  break;
                                              case 47:
                                                  this.__bgset(this.__self.COLOR_WHITE);
                                                  break;
                                          }
                                  }
                                  break;
                              case 'r':
                                  // 1,24r - set scrolling region 
                                  //TODO: validate parameters
                                  this.__topmargin = (this.__csi_parms_.length < 1 ? 1 : this.__csi_parms_[0]) - 1;
                                  this.__botmargin = (this.__csi_parms_.length < 2 ? -1 : this.__csi_parms_[1]) - 1; // -1 is special meaning height
                                  var invalid = false;
                                  if (this.__topmargin > this.__botmargin)
                                  {
                                    if (this.__botmargin != -1)
                                      invalid = true;
                                    else if (this.__topmargin >= (this.getRows()-1))
                                      invalid = true;
                                  }
                                  else if (this.__botmargin >= (this.getRows()-1))
                                  {
                                    invalid = true;
                                  }
                                  if (invalid)
                                  {
                                    this.__topmargin = 0;
                                    this.__botmargin = this.getRows()-1;
                                  }
                                  this.__move(this.__topmargin, 0);
  this.debug("margins:",this.__topmargin,"/",this.__botmargin,this.__csi_parms_);
                                  break;
                              case '[':
                                  this.__debug("write:: set escape state: 4");
                                  this.__esc_state_ = 4;
                                  break;
                              case 'g':
                                  // 0g: clear tab at cursor (ignored)
                                  // 3g: clear all tabs (ignored)
                                  break;
                              default:
                                  this.__warn("write:: unknown command: " + ch);
                                  this.__csi_parms_ = [];
                                  break;
                          }
                        }
                        break;
                    case 4: // saw CSI [
                        this.__esc_state_ = 0; // gobble char.
                        break;
                }
        }
        this.__refresh();
    },

    __debug : function(message) {
        if (this.__debug_) {
                this.debug(message + "\n");
        }
    },

    __warn : function(message) {
        this.debug("vt warn:" + message + "\n");
    }
        
    
  }
});
