/* Gravity */

var sammy_app = null;
var newEventsCallback = null;

var update_interval = 2000;

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
  this.x = ko.observableArray(user_data.x);
  this.y = ko.observableArray(user_data.y);
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
        if(!/^[a-zA-Z0-9 _]+$/.test(login_name)) {
          var valid_chars = "a-zA-Z0-9 _";
          self.errors.push('Bitte wähle einen Namen der nur "'+valid_chars+'" enthält')
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
            setTimeout(function() {
                sammy_app.setLocation('/room/'+sel_gr.id()+'?user='+login_name);
            }, 500);
        });
    };


};


var UserDetailVM = function(room_id, user_id, as_user) {
    var self = this;
    self.currentUser = ko.observable();
    self.loading = ko.observable(false);

    var all_tags_in_group = ko.observable();
    self.tagsInRoomNotSet = ko.computed(function() {
        if (!self.currentUser()) {
            return [];
        }
        var user_tags = self.currentUser().tags();
        return ko.utils.arrayFilter(all_tags_in_group(), function(tag) {
            if (user_tags.indexOf(tag) === -1) {
                return true;
            }
        });
    });

    self.backToRoomUrl = '/room/'+room_id+'?user='+as_user;
    self.room_id = room_id;
    self.as_user = as_user;

    self.newTag = ko.observable();
    self.addNewTag = function(vm, evt) {
        var nTag = self.newTag();
        if (!nTag) {
            return;
        }
        self.newTag('');
        $.post('/api/room/'+room_id+'/user/'+user_id+'/tag/', {'tag': nTag})
        .done(function(response) {
            console.log("tag added", response);
            // self.update();
        });
    };

    self.latestEventId = ko.observable();
    self.doingUpdate = ko.observable(false);
    self.update = function() {
        if( self.doingUpdate() )
            return;
        self.doingUpdate(true);
        var latestEventId = self.latestEventId();
        if (latestEventId) {
            $.get('/api/room/'+room_id+'/events/'+latestEventId+'/')
            .done(function(response) {
                ko.utils.arrayForEach(response.events, function(evt) {
                    console.log("ev", evt);
                    var user = self.currentUser();
                    if (evt.user.id === user.id()) {
                        // console.log(user, user.tags, user.tags());
                        user.tags.push(evt.tag);
                    }
                    self.latestEventId(evt.id);
                });
                self.doingUpdate(false);
            });
        }
    };
    setInterval(self.update, update_interval);

    self.showExistingTags = ko.observable();
    self.addExistingTag = function(existingTag) {
        $.post('/api/room/'+room_id+'/user/'+user_id+'/tag/', {'tag': existingTag})
        .done(function(response) {
            console.log("tag added", response);
            // self.update();
        });
    }

    $.get('/api/room/'+room_id+'/user/'+user_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentUser(new UserModel(response.user));
        all_tags_in_group(response.all_tags_in_group);

        self.loading(false);
        self.latestEventId(response.latestEventId);
    });
};


var RoomDetailVM = function(room_id, as_user, hl_tag) {
    var self = this;
    self.currentRoom = ko.observable();
    self.users = ko.observableArray();
    self.hl_tag = hl_tag;

    self.all_tags = ko.observable();
    self.weights= ko.observable();

    /* export, so that GWT can read it :-) */
    users = self.users;



    self.visualizationOptions = ko.observable();
    self.loading = ko.observable();

    self.do_hl_tag = function(hl_tag) {
        if (hl_tag === undefined) {
            hl_tag = self.hl_tag;
        }
        if (hl_tag) {
            var all_with_class = cy.$('.'+hl_tag);
            var reset_color = function() {
              this.delay(1000).animate({css: {'background-color': this.data().bgcolor}});
            };

            all_with_class.animate({ css: {'background-color' : '#d9cb9e'}}, {duration: 500, complete: reset_color });
        }
    };

    var visuOptions = {
      minZoom: 1,
      maxZoom: 1,
      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'content': 'data(name)',
            'text-valign': 'center',
            'color': 'data(fgcolor)',
            'text-outline-width': 4,
            'text-outline-color': 'data(bgcolor)',
            'height': 48,
            'width': 48,
            'font-size': 22,
            'font-family': 'Source Sans Pro, sans-serif',
            'font-weight': 'bold',
            'background-color': 'data(bgcolor)' //'#374140'
          })

        .selector('.user').css(
            {'shape' : 'rectangle'}
        )
        .selector('.explosion').css(
            {'shape' : 'ellipse', 'border-color' : 'yellow', 'background-opacity' : 0, 'border-width' : 3}
        )
        .selector('edge')
          .css({
            'target-arrow-shape': 'none',
            'source-arrow-shape': 'none',
            'line-color': '#374140',
            'width' : 'data(weight)'
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

        cy.on('free', function(e){
            var node = e.cyTarget;
            console.log( node.data().id );
            console.log("moved node to", node.position());

            $.post("/api/room/"+room_id+"/user/"+node.data().id+"/move/", {x: node.position().x, y: node.position().y})
            .then( function( response ){});
        });

        cy.on('tap', 'node', function(e){
          var node = e.cyTarget;

          var user_id = node.data().id;
          console.log("tap", user_id);

          var event = jQuery.Event("click");
          event.user_id = user_id;

        $('#goToDetailButton').trigger(event)

          var neighborhood = node.neighborhood().add(node);

          cy.elements().addClass('faded');
          neighborhood.removeClass('faded');
        });

        cy.on('cxttap', function(e){
            self.do_hl_tag()
        });

        cy.on('tap', function(e){
          if( e.cyTarget === cy ){
            cy.elements().removeClass('faded');
          }
        });
      }
    };

    self.latestEventId = ko.observable();
    self.doingUpdate = ko.observable(false);
    self.update = function() {
        if (!self.doingUpdate()) {
            self.doingUpdate(true);
            var latestEventId = self.latestEventId();
            if (latestEventId) {
                $.get('/api/room/'+room_id+'/events/'+latestEventId+'/')
                .done(function(response) {
                    ko.utils.arrayForEach(response.events, function(evt) {
                        console.log("ev", evt);

                        var user_id = evt.user.id;
                        var has_tag = evt.tag !== undefined;
                        var has_position = evt.x != undefined && evt.y != undefined;
                        var _user = new UserModel(evt.user);


                    // add node if user has no tag (which means, that there is a new user)
                    // otherwise, highlight user's node

                    var highlight = function( node )
                    {
                        pos = node.position();

                        radians_and_times = [[100, 400], [200, 600], [300, 1000]];

                        var add_animate_remove = function( index, rt)
                        {
                            var remove_node = function()
                            {
                                cy.remove( this );
                            }

                            new_node = cy.add({group: 'nodes', position: pos, classes: 'explosion'});
                            new_node.animate({ css: {'width' : rt[0], 'height' : rt[0] }},{duration: rt[1], complete: remove_node });
                        }

                        $.each(radians_and_times, add_animate_remove);

                    };

                    if( has_tag )
                    {
                        node = cy.$("node#"+evt.user.id);
                        highlight(node);

                        console.log( self.all_tags() )

                        // already has the tag? Then do nothing ...
                        if( self.all_tags()[evt.tag].indexOf(evt.user.id) == -1 )
                        {
                            // add new edges
                            connected_users = self.all_tags()[evt.tag]
                            console.log("need to connect with", connected_users)

                            var connect = function( index, id )
                            {
                                new_edge = cy.add({group: 'edges', data: {source: String(evt.user.id), weight: '1', target: String(id)}});
                            };

                            $.each( connected_users, connect );

                        }
                    }

                    else if (has_position )
                    {
                       console.log("got MOVE event for user", evt.user.id);
                    }

                    else
                    {
                        // TODO do we ever reach this line?
                        console.log("need new node");
                        var bg_color = '#37' + Math.floor((_user.name().charCodeAt(0) + Math.random() * 10) % 255).toString(16) + '40';

                        var props = {
                            group: 'nodes',
                            classes: 'user  ' + _user.tags().join(' '),
                            'data': {
                                'id': String(_user.id()),
                                'name': _user.name(),
                                'bgcolor': bg_color,
                                'fgcolor': '#d9cb9e'
                                 // + color + '40'
                            },
                            position: {x: 400 + Math.random()*30, y: 300 + Math.random()*30}
                        }
                        new_node = cy.add(props);
                        highlight(new_node);

                    }

                        self.latestEventId(evt.id);
                    });
                    self.doingUpdate(false);
                });
            }
        }
    };
    setInterval(self.update, update_interval);

    $.get('/api/room/'+room_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentRoom(new RoomModel(response.room));

        self.users(
            ko.utils.arrayMap(response.users, function(user_data) {
                return new UserModel(user_data);
            })
        );

        visuOptions.elements = {nodes: [], edges: []};

        /* all_tags: tag -> {users with this tag} */
        var weights = {}
        var all_tags = {}
        var edges = [];
        console.log("user " + as_user);
        ko.utils.arrayForEach(self.users(), function(user) {
            var bg_color = '#37' + Math.floor((user.name().charCodeAt(0) + Math.random() * 10) % 255).toString(16) + '40';
            var fg_color = '#d9cb9e';

            if (user.name() == as_user) {
                bg_color = '#8fb247';
                fg_color = '#333';
            }

            visuOptions.elements.nodes.push(
                {'classes': 'user  ' + user.tags().join(' '), 'data': {'id': String(user.id()), 'name': user.name(), 'fgcolor': fg_color, 'bgcolor': bg_color }});

            ko.utils.arrayForEach(user.tags(), function(tag) {
                if (!all_tags[tag]) {
                    all_tags[tag] = [user.id()];
                } else {
                    all_tags[tag].push(user.id());
                }
            });
        });

        self.all_tags(all_tags)

        /* users_with_related_users: user -> [ user, [tags] ] */
        var users_with_related_users = {};
        for (var tag in all_tags) {
            var list_of_users_with_tag = all_tags[tag];
            ko.utils.arrayForEach(list_of_users_with_tag, function(user_id) {
                // make a copy
                var arr_without_myself = list_of_users_with_tag.slice();
                arr_without_myself.splice(arr_without_myself.indexOf(user_id));
                if (arr_without_myself) {
                    // if there are more than 1 with the tag
                    ko.utils.arrayForEach(arr_without_myself, function(related_user_id) {
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

            self.latestEventId(response.latestEventId);
        };

        /* create final edges */
        for (var user_id in users_with_related_users) {
            var related_users = users_with_related_users[user_id];
            if(related_users) {
                for(var related_user_id in related_users) {

                        var related_tags = related_users[related_user_id];
                        var edgeCount = related_tags.length;
                        // console.log("edge",user_id, edgeCount, related_user_id);
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

        if (self.hl_tag) {
            setTimeout(function() {
                self.do_hl_tag();
            }, 200);
        }

        self.loading(false);
        // newEventsCallback(groupDetailEventCb.bind(self));
    });

    self.goToDetailView = function(vm, evt) {
        if( !vm )
            return;
        // console.log("goToDetailView");
        // console.log(evt);
       //  console.log(as_user, room_id);
        sammy_app.setLocation('/room/'+room_id+"/user/"+evt.user_id+"?user="+as_user);

    };



};


$(document).ready(function() {
    newEventsCallback = ko.observable();

    sammy_app = new Sammy();
    sammy_app.get('/', function() {
        bnd(new RoomListVM(), 'RoomListTemplate');
    });
    sammy_app.get(/^\/room\/(\d+)(\/?)$/, function(context, room_id) {
        var as_user = context.params.user;
        var hl = context.params.hl;

        if (!as_user) {
          alert("Please call as a user, i.e. /room/"+room_id+"/?user=Klaus");
        }
        bnd(new RoomDetailVM(room_id, as_user, hl), 'RoomDetailTemplate');
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
