//------------------------------------------------------------------------------
// Copyright IBM Corp. 2016
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------

var cfenv = require('./cfenv-wrapper');
var appEnv = cfenv.getAppEnv();
var MongoClient = require('mongodb').MongoClient;
var mongodb = require('mongodb');
var databaseInstance;

module.exports = function() {
  return {
  	"getDatabase" : function(callback) {

      if (databaseInstance) {
        callback(null, databaseInstance);
      }
      else {
    		var mongodbConfig = appEnv.getService(/mongodb.*/);
    		if (!mongodbConfig) {
          var err = 'Error: No MongoDB config found';
    			console.log(err);
        	callback(err, null);
    		}
    		var mongodbUrl = mongodbConfig.credentials.url;
    		if (!mongodbUrl) {
          var err = 'Error: No MongoDB URL found';
    			console.log(err);
        	callback(err, null);
    		}

    		MongoClient.connect(mongodbUrl, function(err, db) { 
      			if (err) {
        			console.log('Error: No connection to MongoDB', err);
        			callback(err, null);
      			}
      			else {
      				console.log("Connected to MongoDB: " + mongodbUrl);
              databaseInstance = db;
      				callback(null, db);
      			}
    		});
      }		
  	},
 
    "getObjectId" : function() {
      var newObjectId = mongodb.ObjectId();
      return '' + newObjectId.valueOf();
    }
  }
};