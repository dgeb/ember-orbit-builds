define('ember-orbit', ['exports', 'ember-orbit/main', 'ember-orbit/store', 'ember-orbit/model', 'ember-orbit/record-array-manager', 'ember-orbit/schema', 'ember-orbit/source', 'ember-orbit/fields/key', 'ember-orbit/fields/attr', 'ember-orbit/fields/has-many', 'ember-orbit/fields/has-one', 'ember-orbit/links/has-many-array', 'ember-orbit/links/has-one-object', 'ember-orbit/links/link-proxy-mixin', 'ember-orbit/record-arrays/filtered-record-array', 'ember-orbit/record-arrays/record-array'], function (exports, EO, Store, Model, RecordArrayManager, Schema, Source, key, attr, hasMany, hasOne, HasManyArray, HasOneObject, LinkProxyMixin, FilteredRecordArray, RecordArray) {

	'use strict';

	EO['default'].Store = Store['default'];
	EO['default'].Model = Model['default'];
	EO['default'].RecordArrayManager = RecordArrayManager['default'];
	EO['default'].Schema = Schema['default'];
	EO['default'].Source = Source['default'];
	EO['default'].key = key['default'];
	EO['default'].attr = attr['default'];
	EO['default'].hasOne = hasOne['default'];
	EO['default'].hasMany = hasMany['default'];
	EO['default'].HasManyArray = HasManyArray['default'];
	EO['default'].HasOneObject = HasOneObject['default'];
	EO['default'].LinkProxyMixin = LinkProxyMixin['default'];
	EO['default'].FilteredRecordArray = FilteredRecordArray['default'];
	EO['default'].RecordArray = RecordArray['default'];

	exports['default'] = EO['default'];

});
define('ember-orbit/fields/attr', ['exports'], function (exports) {

  'use strict';

  /**
   @module ember-orbit
   */

  var attr = function(type, options) {
    options = options || {};
    options.type = type;

    return Ember.computed({
      get: function(key) {
        return this.getAttribute(key);
      },
      set: function(key, value) {
        var oldValue = this.getAttribute(key);

        if (value !== oldValue) {
          this.patch(key, value);
        }

        return value;
      }
    }).meta({
      options: options,
      isAttribute: true
    });
  };

  exports['default'] = attr;

});
define('ember-orbit/fields/has-many', ['exports'], function (exports) {

  'use strict';

  /**
   @module ember-orbit
   */

  var hasMany = function(model, options) {
    options = options || {};
    options.type = 'hasMany';
    options.model = model;

    return Ember.computed({
      get: function(key) {
        return this.getLinks(key);
      }
    }).meta({
      options: options,
      isLink: true
    }).readOnly();
  };

  exports['default'] = hasMany;

});
define('ember-orbit/fields/has-one', ['exports'], function (exports) {

  'use strict';

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

    return Ember.computed({
      get: function(key) {
        return this.getLink(key);
      },
      set: function(key, value) {
        var proxy = this.getLink(key),
            currentValue = get(proxy, 'content');

        if (value === null) {
          value = undefined;
        }

        if (currentValue !== value) {
          if (value === undefined) {
            this.removeLink(key, currentValue);
          } else {
            this.addLink(key, value);
          }
          set(proxy, 'content', value);
        }

        return proxy;
      }
    }).meta(meta);

  };

  exports['default'] = hasOne;

});
define('ember-orbit/fields/key', ['exports'], function (exports) {

  'use strict';

  /**
   @module ember-orbit
   */

  var key = function(type, options) {
    if (arguments.length === 1 && typeof type === 'object') {
      options = type;
      type = null; // use default below
    }

    options = options || {};
    options.type = type || 'string';

    var meta = {
      options: options,
      isKey: true
    };

    return Ember.computed({
      get: function(name) {
        return this.getKey(name);
      },
      set: function(name, value) {
        var oldValue = this.getKey(name);

        if (value !== oldValue) {
          this.patch(name, value);
        }

        return value;
      }
    }).meta(meta);
  };

  exports['default'] = key;

});
define('ember-orbit/links/has-many-array', ['exports', 'ember-orbit/record-arrays/record-array', 'ember-orbit/links/link-proxy-mixin'], function (exports, RecordArray, LinkProxyMixin) {

  'use strict';

  var get = Ember.get;

  /**
   A `HasManyArray` is a `RecordArray` that represents the contents of a has-many
   relationship.

   @class HasManyArray
   @namespace EO
   @extends EO.RecordArray
   */
  var HasManyArray = RecordArray['default'].extend(LinkProxyMixin['default'], {

    arrayContentWillChange: function(index, removed) {
      var store = get(this, 'store');
      var ownerType = get(this, '_ownerType');
      var ownerId = get(this, '_ownerId');
      var linkField = get(this, '_linkField');
      var content = get(this, 'content');
      var record, recordId;

      for (var i = index; i < index + removed; i++) {
        record = content.objectAt(i);
        recordId = record.primaryId;
        store.removeLink(ownerType, ownerId, linkField, recordId);
      }

      return this._super.apply(this, arguments);
    },

    arrayContentDidChange: function(index, removed, added) {
      this._super.apply(this, arguments);

      var store = get(this, 'store');
      var ownerType = get(this, '_ownerType');
      var ownerId = get(this, '_ownerId');
      var linkField = get(this, '_linkField');
      var content = get(this, 'content');
      var record, recordId;

      for (var i = index; i < index + added; i++) {
        record = content.objectAt(i);
        recordId = record.primaryId;
        store.addLink(ownerType, ownerId, linkField, recordId);
      }
    }

  });

  exports['default'] = HasManyArray;

});
define('ember-orbit/links/has-one-object', ['exports', 'ember-orbit/links/link-proxy-mixin'], function (exports, LinkProxyMixin) {

	'use strict';

	var HasOneObject = Ember.ObjectProxy.extend(LinkProxyMixin['default']);

	exports['default'] = HasOneObject;

});
define('ember-orbit/links/link-proxy-mixin', ['exports'], function (exports) {

  'use strict';

  /**
   @module ember-orbit
   */

  var get = Ember.get;

  var LinkProxyMixin = Ember.Mixin.create({
    store: null,

    _ownerId: null,

    _ownerType: null,

    _linkField: null,

    reload: function() {
      var store = get(this, 'store');
      var promise = store.findLinked.call(store,
        get(this, '_ownerType'),
        get(this, '_ownerId'),
        get(this, '_linkField')
      );
      return promise;
    }
  });

  exports['default'] = LinkProxyMixin;

});
define('ember-orbit/main', ['exports'], function (exports) {

	'use strict';

	/**
	 @module ember-orbit
	 */

	var EO = {};

	exports['default'] = EO;

});
define('ember-orbit/model', ['exports', 'ember-orbit/links/has-one-object', 'ember-orbit/links/has-many-array', 'ember-orbit/fields/key', 'orbit/lib/uuid'], function (exports, HasOneObject, HasManyArray, key, uuid) {

  'use strict';

  var get = Ember.get;
  var set = Ember.set;

  /**
   @class Model
   @namespace EO
   */
  var Model = Ember.Object.extend(Ember.Evented, {
    primaryId: null,

    getKey: function(field) {
      var store = get(this, 'store');
      var pk = get(this.constructor, 'primaryKey');

      if (pk === field) {
        return this.primaryId;
      } else {
        var type = get(this.constructor, 'typeKey');
        return store.retrieveKey(type, this.primaryId, field);
      }
    },

    getAttribute: function(field) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');
      var id = get(this, 'primaryId');

      return store.retrieveAttribute(type, id, field);
    },

    getLink: function(field) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');
      var id = get(this, 'primaryId');

      var relatedRecord = store.retrieveLink(type, id, field) || null;

      var hasOneObject = HasOneObject['default'].create({
        content: relatedRecord,
        store: store,
        _ownerId: id,
        _ownerType: type,
        _linkField: field
      });

      this._assignLink(field, hasOneObject);

      return hasOneObject;
    },

    getLinks: function(field) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');
      var id = get(this, 'primaryId');

      var relatedRecords = Ember.A(store.retrieveLinks(type, id, field) || []);

      var hasManyArray = HasManyArray['default'].create({
        content: relatedRecords,
        store: this.store,
        _ownerId: id,
        _ownerType: type,
        _linkField: field
      });

      this._assignLink(field, hasManyArray);

      return hasManyArray;
    },

    patch: function(field, value) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');

      return store.patch(type, this.primaryId, field, value);
    },

    addLink: function(field, relatedRecord) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');
      var relatedId = relatedRecord ? relatedRecord.primaryId : null;

      return store.addLink(type, this.primaryId, field, relatedId);
    },

    removeLink: function(field, relatedRecord) {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');
      var relatedId = relatedRecord ? relatedRecord.primaryId : null;

      return store.removeLink(type, this.primaryId, field, relatedId);
    },

    remove: function() {
      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');

      return store.remove(type, this.primaryId);
    },

    willDestroy: function() {
      this.trigger('didUnload');
      this._super();

      var store = get(this, 'store');
      var type = get(this.constructor, 'typeKey');

      store.unload(type, this.primaryId);
    },

    _assignLink: function(field, value) {
      this._links = this._links || {};
      this._links[field] = value;
    }
  });

  var _create = Model.create;

  Model.reopenClass({
    _create: function(store, id) {
      var record = _create.call(this, {store: store});
      set(record, 'primaryId', id);
      return record;
    },

    create: function() {
      throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
    },

    primaryKey: Ember.computed('keys', function() {
      if (arguments.length > 1) {
        throw new Ember.Error("You should not set `primaryKey` on a model. Instead, define a `key` with the options `{primaryKey: true, defaultValue: idGenerator}`.");
      }

      var keys = get(this, 'keys');
      var keyNames = Object.keys(keys);
      for (var k in keyNames) {
        var keyName = keyNames[k];
        if (keys[keyName].primaryKey) {
          return keyName;
        }
      }
    }),

    keys: Ember.computed(function() {
      var map = {};
      var _this = this;
      var primaryKey;

      _this.eachComputedProperty(function(name, meta) {
        if (meta.isKey) {
          meta.name = name;
          map[name] = meta.options;
          if (meta.options.primaryKey) {
            primaryKey = name;
          }
        }
      });

      // Set a single primary key named `id` if no other has been defined
      if (!primaryKey) {
        primaryKey = 'id';

        var options = {primaryKey: true, defaultValue: uuid.uuid};
        this.reopen({id: key['default'](options)});
        map.id = options;
      }

      return map;
    }),

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

  exports['default'] = Model;

});
define('ember-orbit/record-array-manager', ['exports', 'ember-orbit/record-arrays/record-array', 'ember-orbit/record-arrays/filtered-record-array'], function (exports, RecordArray, FilteredRecordArray) {

  'use strict';

  var get = Ember.get;

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
      var change;

      while (change = this.changes.shift()) {
        this._processChange(change.record, change.operation);
      }
    },

    _processChange: function(record, operation) {
  //    console.log('_processChange', record, operation);

      var path = operation.path,
          op = operation.op;

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
        recordArrays.toArray()
          .forEach(function(array) {
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
        recordArrays.forEach(function(array) {
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
      var array = RecordArray['default'].create({
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
      var array = FilteredRecordArray['default'].create({
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

      var filteredRecordArraysValues = [];
      this.filteredRecordArrays.forEach(function(value) {
        filteredRecordArraysValues.push(value);
      });

      flatten(values(filteredRecordArraysValues)).forEach(destroy);
    }
  });

  function values(obj) {
    var result = [];
    var keys = Object.keys(obj);

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

  exports['default'] = RecordArrayManager;

});
define('ember-orbit/record-arrays/filtered-record-array', ['exports', 'ember-orbit/record-arrays/record-array'], function (exports, RecordArray) {

  'use strict';

  var get = Ember.get;

  /**
   @class FilteredRecordArray
   @namespace EO
   @extends EO.RecordArray
   */
  exports['default'] = RecordArray['default'].extend({
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

    updateFilter: Ember.observer('filterFunction', function() {
      Ember.run.once(this, this._updateFilter);
    })
  });

});
define('ember-orbit/record-arrays/record-array', ['exports'], function (exports) {

  'use strict';

  /**
   @module ember-orbit
   */

  var get = Ember.get;

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
      this._recordArraysForRecord(record).delete(this);
    },

    _recordsAdded: function(records) {
      records.forEach(function(record) {
        this._recordAdded(record);
      }, this);
    },

    _recordsRemoved: function(records) {
      records.forEach(function(record) {
        this._recordRemoved(record);
      }, this);
    },

    _recordArraysForRecord: function(record) {
      record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
      return record._recordArrays;
    }
  });

  exports['default'] = RecordArray;

});
define('ember-orbit/schema', ['exports', 'orbit-common/schema'], function (exports, OrbitSchema) {

  'use strict';

  var get = Ember.get;

  var proxyProperty = function(source, property, defaultValue) {
    var _property = '_' + property;

    return Ember.computed({
      set: function(key, value) {
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
      },
      get: function() {
        if (!this[_property]) {
          this[_property] = defaultValue;
        }
        return this[_property];
      }
    });
  };

  var Schema = Ember.Object.extend({
    /**
     @property pluralize
     @type {function}
     @default OC.Schema.pluralize
     */
    pluralize: proxyProperty('_schema', 'pluralize'),

    /**
     @property singularize
     @type {function}
     @default OC.Schema.singularize
     */
    singularize: proxyProperty('_schema', 'singularize'),

    init: function() {
      this._super.apply(this, arguments);
      this._modelTypeMap = {};

      // Don't use `modelDefaults` in ember-orbit.
      // The same functionality can be achieved with a base model class that
      // can be overridden.
      var options = {
        modelDefaults: {}
      };

      var pluralize = this.get('pluralize');
      if (pluralize) {
        options.pluralize = pluralize;
      }

      var singularize = this.get('singularize');
      if (singularize) {
        options.singularize = singularize;
      }

      this._schema = new OrbitSchema['default'](options);
    },

    defineModel: function(type, modelClass) {
      var definedModels = this._schema.models;
      if (!definedModels[type]) {
        this._schema.registerModel(type, {
          keys: get(modelClass, 'keys'),
          attributes: get(modelClass, 'attributes'),
          links: get(modelClass, 'links')
        });
      }
    },

    modelFor: function(type) {
      Ember.assert("`type` must be a string", typeof type === 'string');

      var model = this._modelTypeMap[type];
      if (!model) {
        model = get(this, 'container').lookupFactory('model:' + type);
        if (!model) {
          throw new Ember.Error("No model was found for '" + type + "'");
        }
        model.typeKey = type;

        // ensure model is defined in underlying OC.Schema
        this.defineModel(type, model);

        // save model in map for faster lookups
        this._modelTypeMap[type] = model;

        // look up related models
        this.links(type).forEach(function(link) {
          this.modelFor(this.linkProperties(type, link).model);
        }, this);
      }

      return model;
    },

    models: function() {
      return Object.keys(this._schema.models);
    },

    primaryKey: function(type) {
      return this._schema.models[type].primaryKey.name;
    },

    primaryKeyProperties: function(type) {
      return this._schema.models[type].primaryKey;
    },

    keys: function(type) {
      return Object.keys(this._schema.models[type].keys);
    },

    keyProperties: function(type, name) {
      return this._schema.models[type].keys[name];
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

    normalize: function(type, record) {
      // Normalize links to IDs contained within the `__rel` (i.e. "forward link")
      // element.
      this.links(type).forEach(function(link) {
        if (!record.__rel) {
          record.__rel = {};
        }

        var linkValue = record[link];
        if (linkValue) {
          if (Ember.isArray(linkValue)) {
            var rel = record.__rel[link] = {};
            linkValue.forEach(function(id) {
              if (typeof id === 'object') {
                id = get(id, 'primaryId');
              }
              rel[id] = true;
            });

          } else if (typeof linkValue === 'object') {
            record.__rel[link] = get(linkValue, 'primaryId');

          } else {
            record.__rel[link] = linkValue;
          }

          delete record[link];
        }
      });

      this._schema.normalize(type, record);
    }
  });

  exports['default'] = Schema;

});
define('ember-orbit/source', ['exports', 'orbit-common/source'], function (exports, OCSource) {

  'use strict';

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
        this.orbitSource instanceof OCSource['default']);
    }
  });

  exports['default'] = Source;

});
define('ember-orbit/store', ['exports', 'ember-orbit/source', 'ember-orbit/record-array-manager', 'orbit-common/memory-source'], function (exports, Source, RecordArrayManager, OCMemorySource) {

  'use strict';

  var get = Ember.get;

  var RSVP = Ember.RSVP;

  var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
  function promiseArray(promise, label) {
    return PromiseArray.create({
      promise: RSVP.Promise.cast(promise, label)
    });
  }

  var Store = Source['default'].extend({
    orbitSourceClass: OCMemorySource['default'],
    schema: null,

    init: function() {
      this._super.apply(this, arguments);

      this.typeMaps = {};

      this.orbitSource.on('didTransform', this._didTransform, this);

      this._requests = Ember.OrderedSet.create();

      this._recordArrayManager = RecordArrayManager['default'].create({
        store: this
      });
    },

    then: function(success, failure) {
      return this.settleRequests().then(success, failure);
    },

    settleRequests: function() {
      return Ember.RSVP.all(this._requests.toArray());
    },

    settleTransforms: function() {
      return this.orbitSource.settleTransforms();
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

      promise = promise || RSVP.Promise.cast(array);

      return promiseArray(promise.then(function() {
        return array;
      }, null, "OE: Store#filter of " + type));
    },

    find: function(type, id, options) {
      var _this = this;
      this._verifyType(type);

      var promise = this.orbitSource.find(type, id, options).then(function(data) {
        return _this._lookupFromData(type, data);
      });

      return this._request(promise);
    },

    add: function(type, properties) {
      var _this = this;
      this._verifyType(type);
      properties = properties || {};

      get(this, 'schema').normalize(type, properties);
      var promise = this.orbitSource.add(type, properties).then(function(data) {
        return _this._lookupFromData(type, data);
      });

      return this._request(promise);
    },

    remove: function(type, id) {
      this._verifyType(type);
      id = this._normalizeId(id);

      var promise = this.orbitSource.remove(type, id);

      return this._request(promise);
    },

    patch: function(type, id, field, value) {
      this._verifyType(type);
      id = this._normalizeId(id);

      var promise = this.orbitSource.patch(type, id, field, value);

      return this._request(promise);
    },

    addLink: function(type, id, field, relatedId) {
      this._verifyType(type);
      id = this._normalizeId(id);
      relatedId = this._normalizeId(relatedId);

      var promise = this.orbitSource.addLink(type, id, field, relatedId);

      return this._request(promise);
    },

    removeLink: function(type, id, field, relatedId) {
      this._verifyType(type);
      id = this._normalizeId(id);
      relatedId = this._normalizeId(relatedId);

      var promise = this.orbitSource.removeLink(type, id, field, relatedId);

      return this._request(promise);
    },

    findLink: function(type, id, field) {
      var _this = this;
      this._verifyType(type);
      id = this._normalizeId(id);

      var linkType = get(this, 'schema').linkProperties(type, field).model;
      this._verifyType(linkType);

      var promise = this.orbitSource.findLink(type, id, field).then(function(data) {
        return _this._lookupFromData(linkType, data);
      });

      return this._request(promise);
    },

    findLinked: function(type, id, field, options) {
      var _this = this;
      this._verifyType(type);
      id = this._normalizeId(id);

      var linkType = get(this, 'schema').linkProperties(type, field).model;
      this._verifyType(linkType);

      var promise = this.orbitSource.findLinked(type, id, field, options).then(function(data) {
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
        id = this._normalizeId(id);

        if (this.orbitSource.retrieve([type, id])) {
          return this._lookupRecord(type, id);
        }
      }
    },

    retrieveKey: function(type, id, field) {
      this._verifyType(type);
      id = this._normalizeId(id);

      return this.orbitSource.retrieve([type, id, field]);
    },

    retrieveAttribute: function(type, id, field) {
      this._verifyType(type);
      id = this._normalizeId(id);

      return this.orbitSource.retrieve([type, id, field]);
    },

    retrieveLink: function(type, id, field) {
      this._verifyType(type);
      id = this._normalizeId(id);

      var linkType = get(this, 'schema').linkProperties(type, field).model;
      this._verifyType(linkType);

      var relatedId = this.orbitSource.retrieve([type, id, '__rel', field]);

      if (linkType && relatedId) {
        return this.retrieve(linkType, relatedId);
      }
    },

    retrieveLinks: function(type, id, field) {
      this._verifyType(type);
      id = this._normalizeId(id);

      var linkType = get(this, 'schema').linkProperties(type, field).model;
      this._verifyType(linkType);

      var links = this.orbitSource.retrieve([type, id, '__rel', field]);
      if(links === undefined) throw new Error("Link " + [type,id,field].join("/") + " is not loaded. Add it to your includes e.g. find('" + type + "', '" + id + "', {include: ['" + field + "']})");
      var relatedIds = Object.keys(links);

      if (linkType && Ember.isArray(relatedIds) && relatedIds.length > 0) {
        return this.retrieve(linkType, relatedIds);
      }
    },

    unload: function(type, id) {
      this._verifyType(type);
      id = this._normalizeId(id);

      var typeMap = this.typeMapFor(type);
      delete typeMap.records[id];
    },

    _verifyType: function(type) {
      Ember.assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
    },

    _didTransform: function(transform, result) {
      // console.log('_didTransform', transform, result);

      result.operations.forEach(function(operation) {
        var path = operation.path,
            record = this._lookupRecord(path[0], path[1]);

        if (path.length === 3) {
          // attribute changed
          record.propertyDidChange(path[2]);

        } else if (path.length === 4) {
          // hasOne link changed
          var linkName = path[3];
          var linkValue = this.retrieveLink(path[0], path[1], linkName);
          record.set(linkName, linkValue);
        }

        // trigger record array changes
        this._recordArrayManager.recordDidChange(record, operation);
      }, this);
    },

    _lookupRecord: function(type, id) {
      var typeMap = this.typeMapFor(type);
      id = this._normalizeId(id);

      var record = typeMap.records[id];

      if (record === undefined) {
        var model = get(this, 'schema').modelFor(type);

        record = model._create(this, id);

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
      if (Ember.isNone(data)) {
        return null;
      }

      var pk = get(this, 'schema').primaryKey(type);
      if (Ember.isArray(data)) {
        var ids = data.map(function(recordData) {
          return recordData[pk];
        });
        return this._lookupRecords(type, ids);
      } else {
        return this._lookupRecord(type, data[pk]);
      }
    },

    _request: function(promise) {
      var requests = this._requests;
      requests.add(promise);
      return promise.finally(function() {
        requests.delete(promise);
      });
    },

    _normalizeId: function(id) {
      if (id !== null && typeof id === 'object') {
        return id.primaryId;
      } else {
        return id;
      }
    }
  });

  exports['default'] = Store;

});//# sourceMappingURL=ember-orbit.amd.map