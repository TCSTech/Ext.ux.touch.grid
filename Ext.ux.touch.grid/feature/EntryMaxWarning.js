Ext.define('Ext.ux.touch.grid.feature.EntryMaxWarning', {
    extend   : 'Ext.ux.touch.grid.feature.Abstract',
    requires : 'Ext.ux.touch.grid.feature.Abstract',

    /**
     * On construction add the maximum entry warning component
     */
    init : function(grid) {

        // create a component to display if there are to many entries
        var component = Ext.create('Ext.Component', {
                docked: 'top',
                tpl: '<div class="notice">'+Bancha.t('Please narrow down your selection, first {count} of {totalCount} records are displayed!')+'</div>',
                showAnimation: 'fadeIn',
                hideAnimation: 'fadeOut'
            });
        grid.add(component);


        // if there are more results then the grid will display show the warning
        grid.getStore().on('refresh', function(store, data) {
            if(store.getTotalCount() > store.getCount()) {
                // display/update the warning
                component.setData({
                    count: store.getCount(),
                    totalCount: store.getTotalCount()
                });
                component.show();
            }
            if(store.getTotalCount() === store.getCount()) {
                // hide the warning
                component.hide();
            }
        });
    }

});