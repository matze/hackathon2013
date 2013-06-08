/* Gravity */

var sammy_app = null;
var newEventsCallback = null;


var bnd = function(model, template) {
    var element = document.getElementById('page');
    ko.cleanNode(element);
    ko.applyBindings({'name': template, 'data': model}, element);
};


var assertHas = function(obj, property) {
  if (!obj[property]) {
    console.log("Error: missing property", obj, property);
  }
};


var RoomModel = function(room_data) {
    assertHas(room_data, 'id');
    assertHas(room_data, 'name');
    return {
        id: ko.observable(room_data.id),
        name: ko.observable(room_data.name)
    };
};


var UserModel = function(user_data) {
  this.id = ko.observable(user_data.id);
  this.name = ko.observable(user_data.name);
  this.tags = ko.observableArray(user_data.tags);
  this.myself = user_data.myself || false;
};


ko.bindingHandlers.cytoscape = {
  update: function(element, valueAccessor) {
    var value = valueAccessor();
    var valueUnwrapped = ko.utils.unwrapObservable(value);
    if (valueUnwrapped) {
      $(element).cytoscape(valueUnwrapped);
    }
  }
};


var RoomListVM = function() {
    var self = this;
    self.rooms = ko.observableArray();
    $.get('/api/room/')
    .then(function(response) {
        self.rooms(ko.utils.arrayMap(response.rooms, function(room_data) {
            return new RoomModel(room_data);
        }));
        console.log(response, "kk");
    });

    self.selectedGroup = ko.observable();
    self.selectGroup = function(room_vm, evt) {
      // console.log("selectGroup", room_vm.id(), room_vm.name());
      self.selectedGroup(room_vm);
    };

    self.errors = ko.observableArray();

    self.loginName = ko.observable();
    self.goToRoom = function(vm, evt) {
        if (!vm) {
            return;
        }
        var sel_gr = vm.selectedGroup();
        var login_name = vm.loginName();
        self.errors([]);
        if (!(login_name && login_name.trim())) {
          self.errors.push("Bitte gib einen Namen ein um dich einzuloggen");
        }
        if (!sel_gr) {
          self.errors.push("Bitte wähle eine Gruppe aus");
        }

        if(self.errors().length){
            return;
        }

        $.post('/api/room/'+sel_gr.id()+'/login/', {'user': login_name})
        .then(function(resp) {
            // console.log("Login and user created", resp);
        });
        sammy_app.setLocation('/room/'+sel_gr.id()+'?user='+login_name);
    };
};


var UserDetailVM = function(room_id, user_id, as_user) {
    var self = this;
    self.currentUser = ko.observable();
    self.loading = ko.observable(false);

    self.newTag = ko.observable();
    self.addNewTag = function(vm, evt) {
        var nTag = self.newTag();
        if (!nTag) {
            return;
        }
        $.post('/api/room/'+room_id+'/user/'+user_id+'/tag/', {'tag': nTag})
        .done(function(response) {
            console.log("tag added", response);
        });
    }

    $.get('/api/room/'+room_id+'/user/'+user_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentUser(new UserModel(response.user));
        self.loading(false);

        console.log("now update events")
    });
};


var RoomDetailVM = function(room_id, as_user) {
    var self = this;
    self.currentRoom = ko.observable();
    self.users = ko.observableArray();
    
    /* export, so that GWT can read it :-) */
    users = self.users;

    self.visualizationOptions = ko.observable();
    self.loading = ko.observable();

    var visuOptions = {
      minZoom: 1,
      maxZoom: 1,
      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'content': 'data(name)',
            'text-valign': 'center',
            'color': '#d9cb9e',
            'text-outline-width': 4,
            'text-outline-color': '#374140',
            'shape': 'rectangle',
            'height': 48,
            'width': 48,
            'font-size': 22,
            'font-family': 'Source Sans Pro, sans-serif',
            'font-weight': 'bold',
            'background-color': '#374140'
          })
        .selector('edge')
          .css({
            'target-arrow-shape': 'none',
            'source-arrow-shape': 'none',
            'line-color': '#374140'
          })
        .selector(':selected')
          .css({
            'background-color': 'black',
            'line-color': 'black',
            'target-arrow-color': 'black',
            'source-arrow-color': 'black'
          })
        .selector('.faded')
          .css({
            'opacity': 0.25,
            'text-opacity': 0
          }),
      ready: function(){
        window.cy = this;

        // giddy up...

        cy.elements().unselectify();

        cy.on('tap', 'node', function(e){
          var node = e.cyTarget;
          var neighborhood = node.neighborhood().add(node);

          cy.elements().addClass('faded');
          neighborhood.removeClass('faded');
        });

        cy.on('tap', function(e){
          if( e.cyTarget === cy ){
            cy.elements().removeClass('faded');
          }
        });
      }
    };

    $.get('/api/room/'+room_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentRoom(new RoomModel(response.room));

        self.users(
            ko.utils.arrayMap(response.users, function(user_data) {
                return new UserModel(user_data);
            })
        );

        // visualizationOptions.elements = {
        //     nodes: [
        //       { data: { id: 'j', name: 'PB' } },
        //       { data: { id: 'e', name: 'MV' } },
        //       { data: { id: 'k', name: 'DR' } },
        //       { data: { id: 'g', name: 'MV' } }
        //     ],
        //     edges: [
        //       { data: { source: 'j', target: 'e' } },
        //       { data: { source: 'j', target: 'k' } },
        //       { data: { source: 'j', target: 'g' } },
        //       { data: { source: 'e', target: 'j' } },
        //       { data: { source: 'e', target: 'k' } },
        //       { data: { source: 'k', target: 'j' } },
        //       { data: { source: 'k', target: 'e' } },
        //       { data: { source: 'k', target: 'g' } },
        //       { data: { source: 'g', target: 'j' } }
        //     ]
        // };

        visuOptions.elements = {nodes: [], edges: []};

        /* all_tags: tag -> {users with this tag} */
        var all_tags = {};
        var edges = [];
        ko.utils.arrayForEach(self.users(), function(user) {
            console.log("node", user.id(), user.name(), user.tags());
            visuOptions.elements.nodes.push(
                {'data': {'id': String(user.id()), 'name': user.name()}});
            ko.utils.arrayForEach(user.tags(), function(tag) {
                if (!all_tags[tag]) {
                    all_tags[tag] = [user.id()];
                } else {
                    all_tags[tag].push(user.id());
                }
            });
        });
        /* users_with_related_users: user -> [ user, [tags] ] */
        var users_with_related_users = {};
        for (var tag in all_tags) {
        	console.log("tag",tag);
            var list_of_users_with_tag = all_tags[tag];
            ko.utils.arrayForEach(list_of_users_with_tag, function(user_id) {
            	
            	// make a copy
                var arr_without_myself = list_of_users_with_tag.slice();
                arr_without_myself.splice(arr_without_myself.indexOf(user_id));
                if (arr_without_myself) {
                	// if there are more than 1 with the tag
                	ko.utils.arrayForEach(arr_without_myself, function(related_user_id) {
                		console.log("Adding",tag, user_id, related_user_id);
                		
                		var related_users = users_with_related_users[user_id];
                    	if(!related_users) {
                    		related_users = [];
                    		related_users[ related_user_id ] = [ tag ];
                    		users_with_related_users[user_id] = related_users;
                    	} else {
                    		var tags = related_users[related_user_id];
                    		if(!tags) {
                    			related_users[related_user_id] = [tag];
                    		} else {
                    			tags.push(tag);
                    		}
                    	}
                	});
                }
                
            });
            
        }
        
        /* create final edges */
        for (var user_id in users_with_related_users) {
        	var related_users = users_with_related_users[user_id];
        	if(related_users) {
        		for(var related_user_id in related_users) {
        			
        				var related_tags = related_users[related_user_id];
        				var edgeCount = related_tags.length;
        				console.log("edge",user_id, edgeCount, related_user_id);
        				visuOptions.elements.edges.push(
        						{'data': {
        							'source':  String(user_id),
        							'target':  String(related_user_id),
        							'weight': String(edgeCount)
        						}});
        			
        		}
        	}
        }

        self.visualizationOptions(visuOptions);

        self.loading(false);
        // newEventsCallback(groupDetailEventCb.bind(self));
    });
};


$(document).ready(function() {
    newEventsCallback = ko.observable();

    sammy_app = new Sammy();
    sammy_app.get('/', function() {
        bnd(new RoomListVM(), 'RoomListTemplate');
    });
    sammy_app.get(/^\/room\/(\d+)(\/?)$/, function(context, room_id) {
        var as_user = context.params.user;
        if (!as_user) {
          alert("Please call as a user, i.e. /room/"+room_id+"/?user=Klaus");
        }
        bnd(new RoomDetailVM(room_id, as_user), 'RoomDetailTemplate');
    });
    sammy_app.get(/^\/room\/(\d+)\/user\/(\d+)(\/?)$/, function(context, room_id, user_id) {
        var as_user = context.params.user;
        if (!as_user) {
          alert("Please call as a user, i.e. /room/"+room_id+"/user/"+user_id+"/?user=Klaus");
        }
        bnd(new UserDetailVM(room_id, user_id, as_user), 'UserDetailTemplate');
    });
    sammy_app.raise_errors = true;
    sammy_app.debug = true;
    // sammy_app.log = function() {};
    sammy_app.run();
});
