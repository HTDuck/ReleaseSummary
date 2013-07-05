Ext.define('Rally.apps.releasesummary.App', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',

    addContent: function () {
        this.add({
            xtype: 'container',
            itemId: 'releaseInfo',
            componentCls: 'releaseInfo'
        }, {
            xtype: 'container',
            itemId: 'stories'
        }, {
            xtype: 'container',
            itemId: 'defects'
        });

        this._releaseTemplate = new Ext.Template('<p><b>About this release: </b><br />' +
              'Additional information is available <a href="{detailUrl}" target="_top">here.</a></p>');

        this._query();
    },

    onScopeChange: function() {
        this._query();
    },

    _query: function () {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            autoLoad: true,
            fetch: ['FormattedID', 'Name', 'ScheduleState'],
            filters: [
                {
                    property: 'ScheduleState',
                    operator: '>=',
                    value: 'Accepted'
                },
                this.getContext().getTimeboxScope().getQueryFilter()
            ],
            sorters: [{
                property: 'FormattedID',
                direction: 'ASC'
            }],
            listeners: {
                load: this._onStoriesDataLoaded,
                scope: this
            },
            pageSize: 25
        });


        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Defect',
            autoLoad: true,
            fetch: ['FormattedID', 'Name', 'ScheduleState'],
            filters: [
                {
                    property: 'ScheduleState',
                    operator: '>=',
                    value: 'Accepted'
                },
                this.getContext().getTimeboxScope().getQueryFilter()
            ],
            sorters: [{
                property: 'FormattedID',
                direction: 'ASC'
            }],
            listeners: {
                load: this._onDefectsDataLoaded,
                scope: this
            },
            pageSize: 25
        });

        this.down('#releaseInfo').update(this._releaseTemplate.apply({
            detailUrl: Rally.nav.Manager.getDetailUrl(this.getContext().getTimeboxScope().getRecord())
        }));
    },

    _onStoriesDataLoaded: function (store, data) {

        if (!this.down('#story-title')) {
            this.down('#stories').add({
                xtype: 'displayfield',
                itemId: 'story-title',
                value: 'Stories: ' + store.totalCount,
                componentCls: 'gridTitle'
            });
        } else {
            this.down('#story-title').update('Stories: ' + store.totalCount);
        }

        if (!this.down('#story-grid')) {
            this._buildGrid(store, '#stories', 'story-grid');
        } else {
            this.down('#story-grid').reconfigure(store);
        }
    },

    _onDefectsDataLoaded: function (store, data) {
        if (!this.down('#defect-title')) {
            this.down('#defects').add({
                xtype: 'displayfield',
                itemId: 'defect-title',
                value: 'Defects: ' + store.totalCount,
                componentCls: 'gridTitle'
            });
        } else {
            this.down('#defect-title').update('Defects: ' + store.totalCount);
        }

        if (!this.down('#defect-grid')) {
            this._buildGrid(store, '#defects', 'defect-grid');
        } else {
            this.down('#defect-grid').reconfigure(store);
        }
    },

    _buildGrid: function(store, containerName, itemId) {
        this.down(containerName).add({
            xtype: 'rallygrid',
            componentCls: 'grid',
            itemId: itemId,
            store: store,
            columnCfgs: [
                {text: 'ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')}, 
                {text: 'Name', dataIndex: 'Name', flex: 3}, 
                {text: 'Schedule State', dataIndex: 'ScheduleState', flex: 1}
            ]
        });
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
        var release = this.getContext().getTimeboxScope().getRecord().get('Name');
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
