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

var mongodbUtils = require('./mongodb.js')();
var acl = require('acl');
var authenticationUtils = require('./authentication.js')();
var persons = require('./persons.js')();

module.exports = function() {
  return {
  	"setUp" : function(app, callback) {

      mongodbUtils.getDatabase(function(err, database) {
        if (database) {
          acl = new acl(new acl.mongodbBackend(database, "acl"));

          acl.allow(['admin','user'], 'persons', 'view');
          acl.allow('admin', 'persons', 'add');
          acl.allow('admin', 'persons', 'update');

          callback(null, acl);
        }
        else {
          callback('Error: Cannot access ACL database', null);
        }        
      });

      app.get('/admin/addadmin', authenticationUtils.ensureAuthenticated, function (req, res) {
        var personJson = req.user['_json'];
        persons.addPerson(
          req.user['id'],
          personJson.displayName,
          "http://heidloff.net/wp-content/uploads/2015/11/4Y7B9422-4.jpg",
          "Developer Advocate",
          function(err, result) {
            if (err) {
              res.write('Error: User ' + req.user['id'] + ' not added as admin');
              res.end(); 
            }
            else {              
              acl.addUserRoles(req.user['id'], 'admin', function(err) {                
                if (err) {        
                  res.write('Error: User ' + req.user['id'] + ' not added as admin');
                  res.end(); 
                }
                else {
                  res.write('Success: User ' + req.user['id'] + ' added as admin');
                  res.end();  
                }
              });              
            }
          }
        );   
      });

      app.get('/admin/adduser', authenticationUtils.ensureAuthenticated, function (req, res) {
        var personJson = req.user['_json'];
        persons.addPerson(
          req.user['id'],
          personJson.displayName,
          "https://secure.gravatar.com/avatar/f30cecb19e3f7d5a463f0a7a6c644ce4?d=identicon&r=PG",
          "Developer Advocate",
          function(err, result) {
            if (err) {
              res.write('Error: User ' + req.user['id'] + ' not added as user');
              res.end(); 
            }
            else {              
              acl.addUserRoles(req.user['id'], 'user', function(err) {                
                if (err) {        
                  res.write('Error: User ' + req.user['id'] + ' not added as user');
                  res.end(); 
                }
                else {
                  res.write('Success: User ' + req.user['id'] + ' added as user');
                  res.end();  
                }
              });              
            }
          }
        );   
      });

      app.get('/admin/userroles', authenticationUtils.ensureAuthenticated , function (req, response) {
        acl.userRoles(req.user['id'], function (err, roles) {
          if (err) {
            res.write('Error: Roles of user ' + req.user['id'] + ' not read');
            res.end(); 
          }
          else {
            response.write('Roles: ' + roles);
            response.end(); 
          }
        });
      });
            		
  	}
  };
};