/*jslint browser: true, vars: true, undef: true, nomen: true, eqeq: false, plusplus: true, bitwise: true, regexp: true, newcap: true, sloppy: true, white: true */
/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true, latedef:true, newcap:true, noarg:true, noempty:true, regexp:true, undef:true, trailing:false */
/*global Ext, Bancha */

Ext.define('Ext.ux.touch.grid.feature.Editable2', {
    extend   : 'Ext.ux.touch.grid.feature.Abstract',
    requires : 'Ext.ux.touch.grid.feature.Abstract',

    config : {
        events : {
            grid : {
                itemdoubletap : 'handleDoubleTap',
                itemtap       : 'handleTap'
            }
        },

        extraCls : 'editable',

        activeEditor : null,

        lastEditedColumn: null
    },


    /**
     * Provide the openEditor function publically in the grid component
     */
    init: function(grid) {
        var me = this;
        grid.openFieldEditor = function(record, dataIndex) {
            me.openFieldEditor.call(me, grid, record, dataIndex);
        };
    },


    handleDoubleTap : function(grid, index, rowEl, rec, e) {
        this.handleTap(grid, index, rowEl, rec, e); // do the same
    },

    handleTap : function(grid, index, rowEl, rec, e) {
        var editor = this.getActiveEditor();

        if (editor) {
            if (!e.getTarget('.x-field')) {
                this.endEdit(grid);
            }
        }

        var target = e.getTarget('div.x-grid-cell'),
            cellEl = Ext.get(target);

        if (!cellEl) {
            return;
        }

        //prevent the handleTap event from firing startEdit twice
        if (Ext.ux.touch.grid.activeElement === cellEl) {
            return;
        }
        //track the active elemnt using the global namespace
        Ext.ux.touch.grid.activeElement = cellEl;

        // start editing
        this.startEdit(grid, cellEl, rec);     
    },

    onSelectFieldChange : function (field, e) {
        if(field.xtype !== 'selectfield') {
            // this is not a select field
            // the other event listeners onFieldBlur and
            // onEditorAction will handle it.
            return;
        }

        // close the editor and if necessary open the next editor
        this.endEdit();

        if(this.getLastEditedColumn().editNext) {
            this.openNextFieldEditor(); // next editor should be opened
        }
    },

    onFieldBlur : function (field, e) {
        field.fireEvent('elementblur', field, e);
        Ext.ux.touch.grid.activeElement='';
        this.endEdit();
    },

    onEditorAction: function(textfield, e, options) {

        // the editor is already closed from the onFieldBlur,
        // just stop the event and if necessary open the next editor
        e.stopEvent();

        if(this.getLastEditedColumn().editNext) {
            this.openNextFieldEditor(); // next editor should be opened
        }
    },

    openNextFieldEditor: function() {
        var column = this.getLastEditedColumn(),
            grid = this.getGrid(),
            record = column.editor.record;

        // find the current column index and then the next editor column index
        var newColumnIndex = grid.getColumns().indexOf(column) + 1,
            columns = grid.getColumns();

        // check validity
        while(newColumnIndex<columns.length && !Ext.isDefined(columns[newColumnIndex].editor)) {
            // current one doesn't have an editor, try next one
            newColumnIndex++;
        }
        if(newColumnIndex===columns.length) {
            Bancha.log.error("We couldn't find any further editor, even when there was a column editNext:true config.");
            return;
        }

        // open the new editor
        this.openFieldEditor(grid, record, columns[newColumnIndex].dataIndex);
    },

    /**
     * A public method to trigger starting of an edit action
     * @return void
     */
    openFieldEditor: function(grid, record, dataIndex) {

        // find the position of the record in the store to find the current row number
        var rowIndex = grid.getStore().indexOf(record) + 1; // add one, because we have a header row too

        // find the field element
        var fieldDom = grid.element.query('.x-grid-cell[dataindex='+dataIndex+']')[rowIndex],
            element = Ext.get(fieldDom);

        // ok, let's open the next editor
        // this is only a quick fix version and will not work for non-visible rows
        if(element) this.startEdit(grid, element, record);
    },

    handleFieldDestroy: function(cellEl, htmlValue) {
        cellEl.setHtml(htmlValue);
    },

    startEdit: function(grid, cellEl, rec) {
        var dataIndex = cellEl.getAttribute('dataindex'),
            column    = grid.getColumn(dataIndex),
            editor    = column.editor,
            value     = rec.get(dataIndex),
            htmlValue = cellEl.getHtml();

        if (!editor) {
            return;
        }

        if(this.getActiveEditor()) {
            // close the currently active editor first
            this.endEdit(grid);
        }

        cellEl.setHtml('');

        Ext.apply(editor, {
            renderTo  : cellEl,
            value     : value,
            htmlValue : htmlValue,
            record    : rec,
            name      : dataIndex
        });

        editor.field = Ext.ComponentManager.create(editor);

        editor.field.on({
            scope  : this,
            blur   : 'onFieldBlur', // this is for textfields
            change : 'onSelectFieldChange', //this is for select fields with an picker
            action : 'onEditorAction' // this is if the user presses action (enter/go) in a textfield
        });

        this.setActiveEditor(editor);

        // focus on input fields
        if(Ext.isFunction(editor.field.focus) && !Ext.isFunction(editor.field.showPicker)) {
            editor.field.focus();
        }
        // if it's a select field open the picker
        if(Ext.isFunction(editor.field.showPicker)) {
            editor.field.showPicker();
        }

        grid.fireEvent('editstart', grid, this, editor, dataIndex, rec);
    },

    endEdit: function(grid) {
        if (!grid) {
            grid = this.getGrid();
        }

        if(!this.getActiveEditor()) {
            return; // if there's no active editor, nothing to do here
        }

        var me        = this,
            editor    = this.getActiveEditor(),
            field     = editor.field,
            value     = field.getValue(),
            isDirty   = field.isDirty(),
            renderTo  = field.getRenderTo(),
            column    = grid.getColumn(editor.name);


        // bug fix workaround, not sure if this is a bug in sencha or in this code
        try {
            field.destroy();
        } catch(e) {
            // just ignore
        }

        if (isDirty) {
            editor.record.set(field.getName(), value);
            grid.refresh();
            column = grid.getColumn(editor.name); // we need the proper value after a refrsh

            grid.fireEvent('editend', grid, this, editor, value);

        } else {
            renderTo.setHtml(editor.htmlValue);

            grid.fireEvent('editcancel', grid, this, editor, value);
        }

        this.setActiveEditor(null);
        this.setLastEditedColumn(column);
    }
});

//eof
