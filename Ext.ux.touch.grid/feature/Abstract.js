Ext.define('Ext.ux.touch.grid.feature.Abstract', {
    config : {
        events   : {},
        extraCls : null,
        grid     : null
    },

    constructor : function(config) {
        this.initConfig(config);

        this.callParent([config]);
    },

    updateEvents : function(events) {
        var me   = this,
            grid = me.getGrid(),
            cls, clsEvents;

        for (cls in events) {
            if (events.hasOwnProperty(cls)) {
                clsEvents = events[cls];

                if (cls === 'grid') {
                    cls = grid;
                } else if (cls === 'header') {
                    cls = grid.getHeader();
                } else if (cls === 'headerEl') {
                    cls = grid.getHeader().element;
                } else if (cls === 'gridBody') {
                    cls = grid.element.down('div.x-body');
                } else if (cls === 'store') {
                    cls = grid.getStore();
                } else {
                    cls = grid[cls];
                }

                var eventName, eventFn, eventCfg;

                if (Ext.isObject(cls)) {
                    for (eventName in clsEvents) {
                        eventFn = clsEvents[eventName];

                        if (Ext.isObject(eventFn)) {
                            eventCfg = Ext.apply({}, eventFn);

                            delete eventCfg.fn;

                            eventFn = eventFn.fn;
                        }
                        
                        /*
                         * object.getEventListeners() is broken in ST 2.2.x so
                         * we'll use a temporary workaround.
                         */
                        
                        if (!cls.gridListeners) {
                            cls.gridListeners = [];
                        }
                        
                        if (cls.gridListeners.indexOf(eventName) === -1) {
                            cls.on(eventName, me[eventFn], me, eventCfg || {});
                            cls.gridListeners.push(eventName);
                        }
                    }
                } else {
                    console.warn('Class could not be found in config.events Object');
                }
            }
        }
    }
});