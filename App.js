Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    plugins: [
        {
            ptype: 'rallyprint',
            defaultTitle: ''
        }
    ],

    items: [{
        xtype: 'container',
        itemId: 'headerContainer'
    }, {
        xtype: 'container',
        itemId: 'storyGridTitle',
        componentCls: 'gridTitle'
    }, {
        xtype: 'container',
        itemId: 'storyGrid',
        componentCls: 'grid'
    }, {
        xtype: 'container',
        itemId: 'defectGridTitle',
        componentCls: 'gridTitle'
    }, {
        xtype: 'container',
        itemId: 'defectGrid',
        componentCls: 'grid'
    }, {
        xtype: 'container',
        itemId: 'releaseInfo',
        componentCls: 'releaseInfo'
    }],


    launch: function () {
        this.down('#headerContainer').add({
            xtype: 'rallyreleasecombobox',
            itemId: 'releaseComboBox',
            componentCls: 'combobox',
            listeners: {
                change: this._query,
                ready: this._query,
                scope: this
            }
        });

    },

    _query: function () {
        var customFilter = Ext.create('Rally.data.QueryFilter', {
            property: 'ScheduleState',
            operator: '=',
            value: 'Accepted'
        });
        customFilter =customFilter.or(Ext.create('Rally.data.QueryFilter', {
            property: 'ScheduleState',
            operator: '=',
            value: 'Released'
        }));


        customFilter = customFilter.and(Ext.create('Rally.data.QueryFilter', {
            property: 'Release.Name',
            operator: '=',
            value: this.down('#releaseComboBox').getRawValue()
        }));
        
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            autoLoad: true,
            fetch: ['FormattedID', 'Name', 'ScheduleState'],
            filters: customFilter,
            sorters: [{
                property: 'FormattedID',
                direction: 'ASC'
            }],
            listeners: {
                load: this._onStoriesDataLoaded,
                scope: this
            }
        });


        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Defect',
            autoLoad: true,
            fetch: ['FormattedID', 'Name', 'ScheduleState'],
            filters: customFilter,
            sorters: [{
                property: 'FormattedID',
                direction: 'ASC'
            }],
            listeners: {
                load: this._onDefectsDataLoaded,
                scope: this
            }
        });
        
        this.down('#releaseInfo').update('<p><b>About this release: </b><br />' +
              'Additional information is available <a href="' + 
              Rally.nav.Manager.getDetailUrl(this.down('#releaseComboBox').getValue()) + 
              '" target="_top">here.</a></p>');
    },

    _onStoriesDataLoaded: function (store, data) {
        var records = [],
            rankIndex = 1;
        Ext.Array.each(data, function (record) {
            //debugger;
            records.push({
                FormattedID: '<a href="' + Rally.nav.Manager.getDetailUrl(record.get('_ref')) + '" target="_top">' + record.get('FormattedID') + '</a>',
                Name: record.get('Name'),
                ScheduleState: record.get('ScheduleState')
            });
        });

        var customStore = Ext.create('Rally.data.custom.Store', {
            data: records,
            pageSize: 25
        });

        this.down('#storyGridTitle').update('<p><b>Stories: ' + records.length + '</b><br /></p>');

        if (!this.storyGrid) {
            this.storyGrid = this.down('#storyGrid').add({
                xtype: 'rallygrid',
                store: customStore,
                columnCfgs: [{
                    text: 'ID',
                    dataIndex: 'FormattedID'
                }, {
                    text: 'Name',
                    dataIndex: 'Name',
                    flex: 3
                }, {
                    text: 'Schedule State',
                    dataIndex: 'ScheduleState',
                    flex: 1
                }]
            });
        } else {
            this.storyGrid.reconfigure(customStore);
        }
    },

    _onDefectsDataLoaded: function (store, data) {
        var records = [],
            rankIndex = 1;
        Ext.Array.each(data, function (record) {
            records.push({
                FormattedID: '<a href="' + Rally.nav.Manager.getDetailUrl(record.get('_ref')) + '" target="_top">' + record.get('FormattedID') + '</a>',
                Name: record.get('Name'),
                ScheduleState: record.get('ScheduleState')
            });
        });

        var customStore = Ext.create('Rally.data.custom.Store', {
            data: records,
            pageSize: 25
        });

        this.down('#defectGridTitle').update('<p><b>Defects: ' + records.length + '</b><br /></p>');

        if (!this.defectGrid) {
            this.defectGrid = this.down('#defectGrid').add({
                xtype: 'rallygrid',
                store: customStore,
                columnCfgs: [{
                    text: 'ID',
                    dataIndex: 'FormattedID'
                }, {
                    text: 'Name',
                    dataIndex: 'Name',
                    flex: 3
                }, {
                    text: 'Schedule State',
                    dataIndex: 'ScheduleState',
                    flex: 1
                }]
            });
        } else {
            this.defectGrid.reconfigure(customStore);
        }
    },

    getOptions: function() {
        return [
        {
            text: 'Print',
            handler: this._onButtonPressed,
            scope: this
        }
        ];
    },

    _onButtonPressed: function() {
        var title, options;
        //var css = document.getElementsByTagName('style')[0].innerHTML;
        var css = document.getElementsByTagName('style')[0].innerHTML;


        
        //title = this.releaseComboBox.rawValue;
        options = "toolbar=1,menubar=1,scrollbars=yes,scrolling=yes,resizable=yes,width=1000,height=500";
        var printWindow = window.open('', '', options);

        var doc = printWindow.document;



        var header = this.down('#headerContainer');
        var storytitle = this.down('#storyGridTitle');
        var storygrid = this.down('#storyGrid');
        var defecttitle = this.down('#defectGridTitle');
        var defectgrid = this.down('#defectGrid');
        var releaseinfo = this.down('#releaseInfo');


        //doc.write('<html><head>' + css + '<title>' + '' + '</title>');
        doc.write('<html><head>' + '<style>' + css + '</style>');


        doc.write('</head><body class="landscape">');
        doc.write(header.getEl().dom.innerHTML);
        doc.write(storytitle.getEl().dom.innerHTML);
        doc.write(storygrid.getEl().dom.innerHTML);
        doc.write(defecttitle.getEl().dom.innerHTML);
        doc.write(defectgrid.getEl().dom.innerHTML);
        doc.write(releaseinfo.getEl().dom.innerHTML);
        doc.write('</body></html>');
        doc.close();

        this._injectCSS(printWindow);

        printWindow.print();

    },

    _injectContent: function(html, elementType, attributes, container, printWindow){
        elementType = elementType || 'div';
        container = container || printWindow.document.getElementsByTagName('body')[0];

        var element = printWindow.document.createElement(elementType);

        Ext.Object.each(attributes, function(key, value){
            if (key === 'class') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        if(html){
            element.innerHTML = html;
        }

        return container.appendChild(element);
    },

    _injectCSS: function(printWindow){
        //find all the stylesheets on the current page and inject them into the new page
        Ext.each(Ext.query('link'), function(stylesheet){
                this._injectContent('', 'link', {
                rel: 'stylesheet',
                href: stylesheet.href,
                type: 'text/css'
            }, printWindow.document.getElementsByTagName('head')[0], printWindow);
        }, this);

    }
});
