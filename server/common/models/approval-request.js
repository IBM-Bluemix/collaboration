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

var models = require('../../server/model-config.json');
var loopback = require('loopback');
var app = loopback();

module.exports = function(ApprovalRequest) {

  ApprovalRequest.disableRemoteMethod("findOne", true);
  ApprovalRequest.disableRemoteMethod('createChangeStream', true); 
  ApprovalRequest.disableRemoteMethod("updateAll", true);

  ApprovalRequest.expanded = function(id, cb) {
    var app = require('../../server/server');
	var Person = app.models.Person;

    ApprovalRequest.find ({ where: { id: id }}, function (err, approvalrequests) {    
      var output = { approvalRequest: null,
        requester : null,
        approver : null};

	  var errorJson = {
	    "name": "Error",
	    "status": 404,
	    "message": "Unknown \"ApprovalRequest\" id \"" + id + "\".",
	    "statusCode": 404,
	    "code": "MODEL_NOT_FOUND",
  	  };

      if (err) {	  
  	    cb(errorJson, null);
      }
      else {
        if (!approvalrequests) {
		  cb(errorJson, null);
    	}
    	else {
    	  if (approvalrequests.length < 1) {
    	    cb(errorJson, null);
    	  }
    	  else {
    	    output.approvalRequest = approvalrequests[0];
    	    output.id = approvalrequests[0].id;
					
			Person.find ({where: {or: [{"id": approvalrequests[0].approverId}, {"id": approvalrequests[0].requesterId}]}}, function (err, persons) {
			  if (err) {	  				
			    cb(err, output);
			  }
			    else {
				  if (!persons) {
					errorJson.message = "Person not found";
					cb(errorJson, output);
				  } 
				  else {
				    if (persons.length < 1) {
					  errorJson.message = "Person not found";
					  cb(errorJson, output);
					}
					else {
					  if (persons[0].id == approvalrequests[0].requesterId) {
					    output.requester = persons[0];
					  }
					  if (persons[0].id == approvalrequests[0].approverId) {
					    output.approver = persons[0];
					  }	
					  if (persons.length == 2) {
					    if (persons[1].id == approvalrequests[0].requesterId) {
						  output.requester = persons[1];
						}
						if (persons[1].id == approvalrequests[0].approverId) {
						  output.approver = persons[1];
						}
					  }
				  		
				  	  // sample Watson service invocation
				  	  var watson = require('watson-developer-cloud');
				  	  var cfenv = require('../../server/cfenv-wrapper');
				  	  var appEnv = cfenv.getAppEnv();			  
					  var translationConfig = appEnv.getService(/translation.*/);
				      if (translationConfig) {						   
						var language_translation = watson.language_translation({
						  username: translationConfig.credentials.username,
						  password: translationConfig.credentials.password,
						  version: 'v2'
						});

						language_translation.translate({
						  text: output.approvalRequest.title, source : 'en', target: 'es' },
						  function (err, translation) {
						    if (!err) {
						    	output.translatedTitle = translation;
						    }
						    cb(null, output);
						});
				  	  }
				  	  else {
					  	cb(null, output);
					  }
					}
				  }
				}
			});		
      	  }
      	}
      }
    });
  }

  var ds = loopback.createDataSource('memory');
  var Person = ds.define('Person', app.models.Person);
  var ApprovalRequestExpandedModel = {
  	id: String,
	approvalRequest: ApprovalRequest,
	requester: Person,
	approver: Person,
	translatedTitle: String
  };
  var ApprovalRequestExpanded = ds.define('ApprovalRequestExpanded', ApprovalRequestExpandedModel);
     
  ApprovalRequest.remoteMethod('expanded', {
      accepts: {arg: 'id', type: 'string'},
      returns: { type: 'ApprovalRequestExpanded', root: true },      
      http: {path: '/expanded', verb: 'get'},
      description: "Find a model instance by id from the data source and additionally return children."
    }
  );
};