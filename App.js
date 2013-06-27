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
        itemId: 'stories'
    }, {
        xtype: 'container',
        itemId: 'defects'
    }, {
        xtype: 'container',
        itemId: 'releaseInfo',
        componentCls: 'releaseInfo'
    }],


    launch: function () {
        this.down('#headerContainer').add({
            xtype: 'rallyreleasecombobox',
            itemId: 'releaseComboBox',
            fieldLabel: 'Select Release: ',
            width: 310,
            labelWidth: 100,
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
            records.push({
                FormattedID: '<a href="' + Rally.nav.Manager.getDetailUrl(record.get('_ref')) + 
                    '" target="_top">' + record.get('FormattedID') + '</a>',
                Name: record.get('Name'),
                ScheduleState: record.get('ScheduleState')
            });
        });

        var customStore = Ext.create('Rally.data.custom.Store', {
            data: records,
            pageSize: 25
        });

        this.down('#stories').add({
            xtype: 'displayfield',
            value: '<b><p style="font-size:14px">Stories: ' + records.length + '</p></b><br />',
            componentCls: 'gridTitle'
        });


        if (!this.storyGrid) {
            this.storyGrid = this.down('#stories').add({
                xtype: 'rallygrid',
                componentCls: 'grid',
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

        this.down('#defects').add({
            xtype: 'displayfield',
            value: '<b><p style="font-size:14px">Defects: ' + records.length + '</p></b><br />',
            componentCls: 'gridTitle'
        });


        if (!this.defectGrid) {
            this.defectGrid = this.down('#defects').add({
                xtype: 'rallygrid',
                componentCls: 'grid',
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


    // adding the print button to gear menu in the Rally site
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
        var release = this.down('#releaseComboBox').getRawValue();
        var title = release, options;

        var css = document.getElementsByTagName('style')[0].innerHTML;
        
        options = "toolbar=1,menubar=1,scrollbars=yes,scrolling=yes,resizable=yes,width=1000,height=500";
        var printWindow = window.open('', '', options);

        var doc = printWindow.document;

        var stories = this.down('#stories');
        var defects = this.down('#defects');
        var releaseinfo = this.down('#releaseInfo');

        doc.write('<html><head>' + '<style>' + css + '</style><title>' + title + '</title>');

        doc.write('</head><body class="landscape">');
        doc.write('<p>Release: ' + release + '</p><br />');
        doc.write(stories.getEl().dom.innerHTML + defects.getEl().dom.innerHTML + releaseinfo.getEl().dom.innerHTML);
        doc.write('</body></html>');
        doc.close();

        this._injectCSS(printWindow);

        printWindow.print();

    },

    // source code to get the Rally CSS
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
        Ext.each(Ext.query('link'), function(stylesheet){
                this._injectContent('', 'link', {
                rel: 'stylesheet',
                href: stylesheet.href,
                type: 'text/css'
            }, printWindow.document.getElementsByTagName('head')[0], printWindow);
        }, this);
    }
});
