define("ember-orbit", 
  ["ember-orbit/main","ember-orbit/store","ember-orbit/model","ember-orbit/record-array-manager","ember-orbit/schema","ember-orbit/source","ember-orbit/attr","ember-orbit/links/has-many-array","ember-orbit/links/has-one-object","ember-orbit/links/link-proxy-mixin","ember-orbit/record-arrays/filtered-record-array","ember-orbit/record-arrays/record-array","ember-orbit/relationships/has-many","ember-orbit/relationships/has-one","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __exports__) {
    "use strict";
    var EO = __dependency1__["default"];
    var Store = __dependency2__["default"];
    var Model = __dependency3__["default"];
    var RecordArrayManager = __dependency4__["default"];
    var Schema = __dependency5__["default"];
    var Source = __dependency6__["default"];
    var attr = __dependency7__["default"];
    var HasManyArray = __dependency8__["default"];
    var HasOneObject = __dependency9__["default"];
    var LinkProxyMixin = __dependency10__["default"];
    var FilteredRecordArray = __dependency11__["default"];
    var RecordArray = __dependency12__["default"];
    var hasMany = __dependency13__["default"];
    var hasOne = __dependency14__["default"];

    EO.Store = Store;
    EO.Model = Model;
    EO.RecordArrayManager = RecordArrayManager;
    EO.Schema = Schema;
    EO.Source = Source;
    EO.attr = attr;
    EO.HasManyArray = HasManyArray;
    EO.HasOneObject = HasOneObject;
    EO.LinkProxyMixin = LinkProxyMixin;
    EO.FilteredRecordArray = FilteredRecordArray;
    EO.RecordArray = RecordArray;
    EO.hasOne = hasOne;
    EO.hasMany = hasMany;

    __exports__["default"] = EO;
  });
define("ember-orbit/attr", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var attr = function(type, options) {
      options = options || {};
      options.type = type;

      var meta = {
        options: options,
        isAttribute: true
      };

      return Ember.computed(function(key, value) {
        if (arguments.length > 1) {
          var oldValue = this.getAttribute(key);

          if (value !== oldValue) {
            this.patch(key, value);
          }

          return value;

        } else {
          return this.getAttribute(key);
        }
      }).meta(meta);
    };

    __exports__["default"] = attr;
  });
define("ember-orbit/links/has-many-array", 
  ["./../record-arrays/record-array","./link-proxy-mixin","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var RecordArray = __dependency1__["default"];
    var LinkProxyMixin = __dependency2__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var forEach = Ember.EnumerableUtils.forEach;

    /**
     A `HasManyArray` is a `RecordArray` that represents the contents of a has-many
     relationship.

     @class HasManyArray
     @namespace EO
     @extends EO.RecordArray
     */
    var HasManyArray = RecordArray.extend(LinkProxyMixin, {

      arrayContentWillChange: function(index, removed, added) {
        var store = get(this, 'store');
        var idField = get(store, 'idField');
        var ownerType = get(this, '_ownerType');
        var ownerId = get(this, '_ownerId');
        var linkKey = get(this, '_linkKey');
        var content = get(this, 'content');
        var record, recordId;

        for (var i = index; i < index + removed; i++) {
          record = content.objectAt(i);
          recordId = get(record, idField);
          store.removeLink(ownerType, ownerId, linkKey, recordId);
        }

        return this._super.apply(this, arguments);
      },

      arrayContentDidChange: function(index, removed, added) {
        this._super.apply(this, arguments);

        var store = get(this, 'store');
        var idField = get(store, 'idField');
        var ownerType = get(this, '_ownerType');
        var ownerId = get(this, '_ownerId');
        var linkKey = get(this, '_linkKey');
        var content = get(this, 'content');
        var record, recordId;

        for (var i = index; i < index + added; i++) {
          record = content.objectAt(i);
          recordId = get(record, idField);
          store.addLink(ownerType, ownerId, linkKey, recordId);
        }
      }

    });

    __exports__["default"] = HasManyArray;
  });
define("ember-orbit/links/has-one-object", 
  ["./link-proxy-mixin","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var LinkProxyMixin = __dependency1__["default"];

    /**
     @module ember-orbit
     */

    /**
     A `HasOneObject` is an `ObjectProxy` that represents the contents of a has-one
     relationship.

     @class HasOneObject
     @namespace EO
     @extends Ember.ObjectProxy
     */
    var HasOneObject = Ember.ObjectProxy.extend(LinkProxyMixin);

    __exports__["default"] = HasOneObject;
  });
define("ember-orbit/links/link-proxy-mixin", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var LinkProxyMixin = Ember.Mixin.create({
      store: null,

      _ownerId: null,

      _ownerType: null,

      _linkKey: null,

      find: function() {
        var store = get(this, 'store');
        var promise = store.findLink.call(store,
          get(this, '_ownerType'),
          get(this, '_ownerId'),
          get(this, '_linkKey')
        );
        return promise;
      }
    });

    __exports__["default"] = LinkProxyMixin;
  });
define("ember-orbit/main", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var EO = {};

    __exports__["default"] = EO;
  });
define("ember-orbit/model", 
  ["./links/has-one-object","./links/has-many-array","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var HasOneObject = __dependency1__["default"];
    var HasManyArray = __dependency2__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get;

    /**
     @class Model
     @namespace EO
     */
    var Model = Ember.Object.extend(Ember.Evented, {
      getAttribute: function(key) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        return store.retrieveAttribute(type, id, key);
      },

      getLink: function(key) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        var relatedRecord = store.retrieveLink(type, id, key) || null;

        var hasOneObject = HasOneObject.create({
          content: relatedRecord,
          store: store,
          _ownerId: id,
          _ownerType: type,
          _linkKey: key
        });

        this._assignLink(key, hasOneObject);

        return hasOneObject;
      },

      getLinks: function(key) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        var relatedRecords = store.retrieveLinks(type, id, key) || Ember.A();

        var hasManyArray = HasManyArray.create({
          content: relatedRecords,
          store: this.store,
          _ownerId: id,
          _ownerType: type,
          _linkKey: key
        });

        this._assignLink(key, hasManyArray);

        return hasManyArray;
      },

      patch: function(key, value) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        return store.patch(type, id, key, value);
      },

      addLink: function(key, relatedRecord) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));
        var relatedId = get(relatedRecord, get(store, 'idField'));

        return store.addLink(type, id, key, relatedId);
      },

      removeLink: function(key, relatedRecord) {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));
        var relatedId = get(relatedRecord, get(store, 'idField'));

        return store.removeLink(type, id, key, relatedId);
      },

      remove: function() {
        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        return store.remove(type, id);
      },

      willDestroy: function() {
        this._super();

        var store = get(this, 'store');
        var type = this.constructor.typeKey;
        var id = get(this, get(store, 'idField'));

        store.unload(type, id);
      },

      _assignLink: function(key, value) {
        this._links = this._links || {};
        this._links[key] = value;
      }
    });

    Model.reopenClass({
      _create: Model.create,

      create: function() {
        throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
      },

      attributes: Ember.computed(function() {
        var map = {};

        this.eachComputedProperty(function(name, meta) {
          if (meta.isAttribute) {
            meta.name = name;
            map[name] = meta.options;
          }
        });

        return map;
      }),

      links: Ember.computed(function() {
        var map = {};

        this.eachComputedProperty(function(name, meta) {
          if (meta.isLink) {
            meta.name = name;
            map[name] = meta.options;
          }
        });

        return map;
      })
    });

    __exports__["default"] = Model;
  });
define("ember-orbit/record-array-manager", 
  ["./record-arrays/record-array","./record-arrays/filtered-record-array","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var RecordArray = __dependency1__["default"];
    var FilteredRecordArray = __dependency2__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var forEach = Ember.EnumerableUtils.forEach;

    /**
     @class RecordArrayManager
     @namespace EO
     @private
     @extends Ember.Object
     */
    var RecordArrayManager = Ember.Object.extend({
      init: function() {
        this.filteredRecordArrays = Ember.MapWithDefault.create({
          defaultValue: function() { return []; }
        });

        this.changes = [];
      },

      recordDidChange: function(record, operation) {
        if (this.changes.push({record: record, operation: operation}) !== 1) { return; }
        Ember.run.schedule('actions', this, this._processChanges);
      },

      /**
       @method _processChanges
       @private
       */
      _processChanges: function() {
        forEach(this.changes, function(change) {
          this._processChange(change.record, change.operation);
        }, this);

        this.changes.length = 0;
      },

      _processChange: function(record, operation) {
    //    console.log('_processChange', record, operation);

        var path = operation.path,
            op = operation.op,
            value = operation.value;

        if (path.length === 2) {
          if (op === 'add') {
            this._recordWasChanged(record);
            return;

          } else if (op === 'remove') {
            this._recordWasDeleted(record);
            return;
          }

        } else if (path.length === 3 || path.length === 4) {
          this._recordWasChanged(record);
          return;

        } else if (path.length === 5) {
          if (op === 'add') {
            this._linkWasAdded(record, path[3], path[4]);
            return;

          } else if (op === 'remove') {
            this._linkWasRemoved(record, path[3], path[4]);
            return;
          }
        }

        console.log('!!!! unhandled change', path.length, operation);
      },

      _recordWasDeleted: function(record) {
        var recordArrays = record._recordArrays;

        if (recordArrays) {
          forEach(recordArrays, function(array) {
            array.removeObject(record);
          });
        }

        record.destroy();
      },

      _recordWasChanged: function(record) {
        var type = record.constructor.typeKey,
            recordArrays = this.filteredRecordArrays.get(type),
            filter;

        if (recordArrays) {
          forEach(recordArrays, function(array) {
            filter = get(array, 'filterFunction');
            this.updateRecordArray(array, filter, type, record);
          }, this);
        }
      },

      _linkWasAdded: function(record, key, value) {
        var type = record.constructor.typeKey;
        var store = get(this, 'store');
        var linkType = get(store, 'schema').linkProperties(type, key).model;

        if (linkType) {
          var relatedRecord = store.retrieve(linkType, value);
          var links = get(record, key);

          if (links && relatedRecord) {
            links.addObject(relatedRecord);
          }
        }
      },

      _linkWasRemoved: function(record, key, value) {
        var type = record.constructor.typeKey;
        var store = get(this, 'store');
        var linkType = get(store, 'schema').linkProperties(type, key).model;

        if (linkType) {
          var relatedRecord = store.retrieve(linkType, value);
          var links = get(record, key);

          if (links && relatedRecord) {
            links.removeObject(relatedRecord);
          }
        }
      },

      /**
       @method updateRecordArray
       @param {EO.RecordArray} array
       @param {Function} filter
       @param {String} type
       @param {EO.Model} record
       */
      updateRecordArray: function(array, filter, type, record) {
        var shouldBeInArray;

        if (!filter) {
          shouldBeInArray = true;
        } else {
          shouldBeInArray = filter(record);
        }

        if (shouldBeInArray) {
          array.addObject(record);
        } else {
          array.removeObject(record);
        }
      },

      /**
       @method updateFilter
       @param array
       @param type
       @param filter
       */
      updateFilter: function(array, type, filter) {
        var records = this.store.retrieve(type),
            record;

        for (var i=0, l=records.length; i<l; i++) {
          record = records[i];

          if (!get(record, 'isDeleted')) {
            this.updateRecordArray(array, filter, type, record);
          }
        }
      },

      /**
       @method createRecordArray
       @param {String} type
       @return {EO.RecordArray}
       */
      createRecordArray: function(type) {
        var array = RecordArray.create({
          type: type,
          content: Ember.A(),
          store: this.store
        });

        this.registerFilteredRecordArray(array, type);

        return array;
      },

      /**
       @method createFilteredRecordArray
       @param {Class} type
       @param {Function} filter
       @param {Object} query (optional)
       @return {EO.FilteredRecordArray}
       */
      createFilteredRecordArray: function(type, filter, query) {
        var array = FilteredRecordArray.create({
          query: query,
          type: type,
          content: Ember.A(),
          store: this.store,
          manager: this,
          filterFunction: filter
        });

        this.registerFilteredRecordArray(array, type, filter);

        return array;
      },

      /**
       @method registerFilteredRecordArray
       @param {EO.RecordArray} array
       @param {Class} type
       @param {Function} filter
       */
      registerFilteredRecordArray: function(array, type, filter) {
        var recordArrays = this.filteredRecordArrays.get(type);
        recordArrays.push(array);

        this.updateFilter(array, type, filter);
      },

      willDestroy: function(){
        this._super();

        flatten(values(this.filteredRecordArrays.values)).forEach(destroy);
      }
    });

    function values(obj) {
      var result = [];
      var keys = Ember.keys(obj);

      for (var i = 0; i < keys.length; i++) {
        result.push(obj[keys[i]]);
      }

      return result;
    }

    function destroy(entry) {
      entry.destroy();
    }

    function flatten(list) {
      var length = list.length;
      var result = Ember.A();

      for (var i = 0; i < length; i++) {
        result = result.concat(list[i]);
      }

      return result;
    }

    __exports__["default"] = RecordArrayManager;
  });
define("ember-orbit/record-arrays/filtered-record-array", 
  ["./record-array","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var RecordArray = __dependency1__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get;

    /**
     @class FilteredRecordArray
     @namespace EO
     @extends EO.RecordArray
     */
    var FilteredRecordArray = RecordArray.extend({
      /**
       @method filterFunction
       @param {EO.Model} record
       @return {Boolean} `true` if the record should be in the array
       */
      filterFunction: null,

      replace: function() {
        var type = get(this, 'type').toString();
        throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
      },

      /**
       @method updateFilter
       @private
       */
      _updateFilter: function() {
        var manager = get(this, 'manager');
        manager.updateFilter(this, get(this, 'type'), get(this, 'filterFunction'));
      },

      updateFilter: Ember.observer(function() {
        Ember.run.once(this, this._updateFilter);
      }, 'filterFunction')
    });

    __exports__["default"] = FilteredRecordArray;
  });
define("ember-orbit/record-arrays/record-array", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var forEach = Ember.EnumerableUtils.forEach;

    /**
     @class RecordArray
     @namespace EO
     @extends Ember.ArrayProxy
     @uses Ember.Evented
     */

    var RecordArray = Ember.ArrayProxy.extend(Ember.Evented, {
      init: function() {
        this._super();
        this._recordsAdded(get(this, 'content'));
      },

      willDestroy: function() {
        this._recordsRemoved(get(this, 'content'));
        this._super();
      },

      /**
       The model type contained by this record array.

       @property type
       @type String
       */
      type: null,

      /**
       The store that created this record array.

       @property store
       @type EO.Store
       */
      store: null,

      /**
       Adds a record to the `RecordArray`.

       @method addObject
       @param {EO.Model} record
       */
      addObject: function(record) {
        get(this, 'content').addObject(record);
        this._recordAdded(record);
      },

      /**
       Removes a record from the `RecordArray`.

       @method removeObject
       @param {EO.Model} record
       */
      removeObject: function(record) {
        get(this, 'content').removeObject(record);
        this._recordRemoved(record);
      },

      _recordAdded: function(record) {
        this._recordArraysForRecord(record).add(this);
      },

      _recordRemoved: function(record) {
        this._recordArraysForRecord(record).remove(this);
      },

      _recordsAdded: function(records) {
        forEach(records, function(record) {
          this._recordAdded(record);
        }, this);
      },

      _recordsRemoved: function(records) {
        forEach(records, function(record) {
          this._recordRemoved(record);
        }, this);
      },

      _recordArraysForRecord: function(record) {
        record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
        return record._recordArrays;
      }
    });

    __exports__["default"] = RecordArray;
  });
define("ember-orbit/relationships/has-many", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var hasMany = function(model, options) {
      options = options || {};
      options.type = 'hasMany';
      options.model = model;

      var meta = {
        options: options,
        isLink: true
      };

      return Ember.computed(function(key) {
        return this.getLinks(key);
      }).meta(meta).readOnly();
    };

    __exports__["default"] = hasMany;
  });
define("ember-orbit/relationships/has-one", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var hasOne = function(model, options) {
      options = options || {};
      options.type = 'hasOne';
      options.model = model;

      var meta = {
        options: options,
        isLink: true
      };

      return Ember.computed(function(key, value) {
        var proxy = this.getLink(key);

        if (arguments.length > 1) {
          if (value !== get(proxy, 'content')) {
            proxy.setProperties({
              content: value,
              promise: this.addLink(key, value)
            });
          }
        }

        return proxy;

      }).meta(meta);
    };

    __exports__["default"] = hasOne;
  });
define("ember-orbit/schema", 
  ["orbit-common/schema","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var OrbitSchema = __dependency1__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get;

    var proxyProperty = function(source, property, defaultValue) {
      var _property = '_' + property;
      
      return function(key, value) {
        if (arguments.length > 1) {
          this[_property] = value;
          if (this[source]) {
            this[source][property] = value;
          }
        }
        if (!this[_property]) {
          this[_property] = defaultValue;
        }
        return this[_property];
      }.property();
    };

    var Schema = Ember.Object.extend({
      /**
       @property idField
       @type {String}
       @default 'clientid'
       */
      idField: proxyProperty('_schema', 'idField', 'clientid'),

      /**
       @property remoteIdField
       @type {String}
       @default 'id'
       */
      remoteIdField: proxyProperty('_schema', 'remoteIdField', 'id'),

      /**
       @property generateId
       @type {function}
       @default OC.Schema.generateId
       */
      generateId: proxyProperty('_schema', 'generateId'),

      init: function() {
        this._super.apply(this, arguments);
        this._modelTypeMap = {};

        var options = {
          idField: get(this, 'idField'),
          remoteIdField: get(this, 'remoteIdField')
        };

        var generateId = this.get('generateId');
        if (generateId) {
          options.generateId = generateId;
        }

        this._schema = new OrbitSchema(options);
      },

      defineModel: function(type, modelClass) {
        var definedModels = this._schema.models;
        if (!definedModels[type]) {
          this._schema.registerModel(type, {
            attributes: get(modelClass, 'attributes'),
            links: get(modelClass, 'links')
          });
        }
      },

      modelFor: function(type) {
        Ember.assert("`type` must be a string", typeof type === 'string');

        var model = this._modelTypeMap[type];
        if (!model) {
          model = this.container.lookupFactory('model:' + type);
          if (!model) {
            throw new Ember.Error("No model was found for '" + type + "'");
          }
          model.typeKey = type;

          // ensure model is defined in underlying OC.Schema
          this.defineModel(type, model);

          // save model in map for faster lookups
          this._modelTypeMap[type] = model;
        }

        return model;
      },

      models: function() {
        return Object.keys(this._schema.models);
      },

      attributes: function(type) {
        return Object.keys(this._schema.models[type].attributes);
      },

      attributeProperties: function(type, name) {
        return this._schema.models[type].attributes[name];
      },

      links: function(type) {
        return Object.keys(this._schema.models[type].links);
      },

      linkProperties: function(type, name) {
        return this._schema.models[type].links[name];
      },

      normalize: function(type, data) {
        return this._schema.normalize(type, data);
      }
    });

    __exports__["default"] = Schema;
  });
define("ember-orbit/source", 
  ["./schema","orbit-common/source","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Schema = __dependency1__["default"];
    var OCSource = __dependency2__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var Source = Ember.Object.extend({
      orbitSourceClass: null,
      orbitSourceOptions: null,
      schema: null,

      /**
       @method init
       @private
       */
      init: function() {
        this._super.apply(this, arguments);

        var OrbitSourceClass = get(this, 'orbitSourceClass');

        // If `orbitSourceClass` is obtained through the _super chain, dereference
        // its wrapped function, which will be the constructor.
        //
        // Note: This is only necessary when retrieving a *constructor* from an Ember
        //       class hierarchy. Otherwise, `superWrapper` "just works".
        if (OrbitSourceClass && OrbitSourceClass.wrappedFunction) {
          OrbitSourceClass = OrbitSourceClass.wrappedFunction;
        }

        var schema = get(this, 'schema');
        if (!schema) {
          var container = get(this, 'container');
          schema = container.lookup('schema:main');
          set(this, 'schema', schema);
        }

        var orbitSourceSchema = get(schema, '_schema');
        var orbitSourceOptions = get(this, 'orbitSourceOptions');
        this.orbitSource = new OrbitSourceClass(orbitSourceSchema, orbitSourceOptions);

        Ember.assert("orbitSource must be an instance of an `OC.Source`",
          this.orbitSource instanceof OCSource);
      }
    });

    __exports__["default"] = Source;
  });
define("ember-orbit/store", 
  ["./source","./model","./record-array-manager","orbit-common/memory-source","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Source = __dependency1__["default"];
    var Model = __dependency2__["default"];
    var RecordArrayManager = __dependency3__["default"];
    var OCMemorySource = __dependency4__["default"];

    /**
     @module ember-orbit
     */

    var get = Ember.get,
        set = Ember.set;

    var Promise = Ember.RSVP.Promise;

    var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
    function promiseArray(promise, label) {
      return PromiseArray.create({
        promise: Promise.cast(promise, label)
      });
    }

    var Store = Source.extend({
      orbitSourceClass: OCMemorySource,
      schema: null,
      idField: Ember.computed.alias('schema.idField'),

      init: function() {
        this._super.apply(this, arguments);

        this.typeMaps = {};

        this.orbitSource.on('didTransform', this._didTransform, this);

        this._requests = Ember.OrderedSet.create();

        this._recordArrayManager = RecordArrayManager.create({
          store: this
        });
      },

      then: function(success, failure) {
        return Ember.RSVP.all(this._requests.toArray()).then(success, failure);
      },

      willDestroy: function() {
        this.orbitSource.off('didTransform', this.didTransform, this);
        this._recordArrayManager.destroy();
        this._super.apply(this, arguments);
      },

      typeMapFor: function(type) {
        var typeMap = this.typeMaps[type];

        if (typeMap) return typeMap;

        typeMap = {
          records: {},
          type: type
        };

        this.typeMaps[type] = typeMap;

        return typeMap;
      },

      transform: function(operation) {
        return this.orbitSource.transform(operation);
      },

      all: function(type) {
        this._verifyType(type);

        var typeMap = this.typeMapFor(type),
            findAllCache = typeMap.findAllCache;

        if (findAllCache) { return findAllCache; }

        var array = this._recordArrayManager.createRecordArray(type);

        typeMap.findAllCache = array;
        return array;
      },

      filter: function(type, query, filter) {
        this._verifyType(type);

        var length = arguments.length;
        var hasQuery = length === 3;
        var promise;
        var array;

        if (hasQuery) {
          promise = this.find(type, query);
        } else if (length === 2) {
          filter = query;
        }

        if (hasQuery) {
          array = this._recordArrayManager.createFilteredRecordArray(type, filter, query);
        } else {
          array = this._recordArrayManager.createFilteredRecordArray(type, filter);
        }

        promise = promise || Promise.cast(array);

        return promiseArray(promise.then(function() {
          return array;
        }, null, "OE: Store#filter of " + type));
      },

      find: function(type, id) {
        var _this = this;
        this._verifyType(type);

        var promise = this.orbitSource.find(type, id).then(function(data) {
          return _this._lookupFromData(type, data);
        });

        return this._request(promise);
      },

      add: function(type, properties) {
        var _this = this;
        this._verifyType(type);

        get(this, 'schema').normalize(type, properties);
        var promise = this.orbitSource.add(type, properties).then(function(data) {
          return _this._lookupFromData(type, data);
        });

        return this._request(promise);
      },

      remove: function(type, id) {
        this._verifyType(type);

        var promise = this.orbitSource.remove(type, id);

        return this._request(promise);
      },

      patch: function(type, id, key, value) {
        this._verifyType(type);

        var promise = this.orbitSource.patch(type, id, key, value);

        return this._request(promise);
      },

      addLink: function(type, id, key, relatedId) {
        this._verifyType(type);

        var promise = this.orbitSource.addLink(type, id, key, relatedId);

        return this._request(promise);
      },

      removeLink: function(type, id, key, relatedId) {
        this._verifyType(type);

        var promise = this.orbitSource.removeLink(type, id, key, relatedId);

        return this._request(promise);
      },

      findLink: function(type, id, key) {
        var _this = this;
        this._verifyType(type);

        var linkType = get(this, 'schema').linkProperties(type, key).model;

        var promise = this.orbitSource.findLink(type, id, key).then(function(data) {
          return _this._lookupFromData(linkType, data);
        });

        return this._request(promise);
      },

      retrieve: function(type, id) {
        this._verifyType(type);

        var ids;
        if (arguments.length === 1) {
          ids = Object.keys(this.orbitSource.retrieve([type]));

        } else if (Ember.isArray(id)) {
          ids = id;
        }

        if (ids) {
          return this._lookupRecords(type, ids);

        } else {
          if (typeof id === 'object') {
            var idField = get(this, 'idField');
            id = get(id, idField);
          }
          if (this.orbitSource.retrieve([type, id])) {
            return this._lookupRecord(type, id);
          }
        }
      },

      retrieveAttribute: function(type, id, key) {
        this._verifyType(type);

        return this.orbitSource.retrieve([type, id, key]);
      },

      retrieveLink: function(type, id, key) {
        this._verifyType(type);

        var linkType = get(this, 'schema').linkProperties(type, key).model;

        var relatedId = this.orbitSource.retrieve([type, id, '__rel', key]);

        if (linkType && relatedId) {
          return this.retrieve(linkType, relatedId);
        }
      },

      retrieveLinks: function(type, id, key) {
        this._verifyType(type);

        var linkType = get(this, 'schema').linkProperties(type, key).model;

        var relatedIds = Object.keys(this.orbitSource.retrieve([type, id, '__rel', key]));

        if (linkType && Ember.isArray(relatedIds) && relatedIds.length > 0) {
          return this.retrieve(linkType, relatedIds);
        }
      },

      unload: function(type, id) {
        this._verifyType(type);

        var typeMap = this.typeMapFor(type);
        delete typeMap.records[id];
      },

      _verifyType: function(type) {
        Ember.assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
      },

      _didTransform: function(operation, inverse) {
    //    console.log('_didTransform', operation, inverse);

        var op = operation.op,
            path = operation.path,
            value = operation.value,
            record = this._lookupRecord(path[0], path[1]);

        if (path.length === 3) {
          // attribute changed
          record.propertyDidChange(path[2]);

        } else if (path.length === 4) {
          // hasOne link changed
          var key = path[3];
          var link = this.retrieveLink(path[0], path[1], key);
          record.set(key, link);
        }

        // trigger record array changes
        this._recordArrayManager.recordDidChange(record, operation);
      },

      _lookupRecord: function(type, id) {
        var typeMap = this.typeMapFor(type),
            record = typeMap.records[id];

        if (record === undefined) {
          var model = get(this, 'schema').modelFor(type);

          var data = {
            store: this
          };
          data[get(this, 'idField')] = id;

          record = model._create(data);

          typeMap.records[id] = record;
        }

        return record;
      },

      _lookupRecords: function(type, ids) {
        var _this = this;
        return ids.map(function(id) {
          return _this._lookupRecord(type, id);
        });
      },

      _lookupFromData: function(type, data) {
        var idField = get(this, 'idField');
        if (Ember.isArray(data)) {
          var ids = data.map(function(recordData) {
            return recordData[idField];
          });
          return this._lookupRecords(type, ids);
        } else {
          return this._lookupRecord(type, data[idField]);
        }
      },

      _request: function(promise) {
        var requests = this._requests;
        requests.add(promise);
        return promise.finally(function() {
          requests.remove(promise);
        });
      }
    });

    __exports__["default"] = Store;
  });