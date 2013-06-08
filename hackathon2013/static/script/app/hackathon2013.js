/* Gravity */

var sammy_app = null;


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
        self.errors([]);
        console.log("goToRoom", vm, !vm.loginName(), !vm.selectedGroup())
        if (!(vm.loginName() && vm.loginName().trim())) {
          self.errors.push("Bitte gib einen Namen ein um dich einzuloggen");
        }
        if (!vm.selectedGroup()) {
          self.errors.push("Bitte wähle eine Gruppe aus");
        }

        sammy_app.setLocation('/room/'+self.selectedGroup().id()+'?user='+self.loginName());
    };
};


var UserModel = function(user_data) {
  this.name = ko.observable(user_data.name);
  this.tags = ko.observableArray(user_data.tags);
};


var RoomDetailVM = function(room_id, as_user) {
    self.currentRoom = ko.observable();
    self.users = ko.observableArray();

    $.get('/api/room/'+room_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentRoom(new RoomModel(response.room));
        self.users(
            ko.utils.arrayMap(response.users, function(user_data) {
                return new UserModel(user_data);
            })
        );
        console.log('loaded');
    });
};


$(document).ready(function() {
    sammy_app = new Sammy();
    sammy_app.get('/', function() {
        var vm = new RoomListVM();
        var element = document.getElementById('page');
        ko.cleanNode(element);
        ko.applyBindings({'name': 'RoomListTemplate', 'data': vm}, element);
    });
    sammy_app.get(/^\/room\/(\d+)(\/?)$/, function(context, room_id) {
        var as_user = context.params.user;
        bnd(new RoomDetailVM(room_id, as_user), 'RoomDetailTemplate');
    });
    sammy_app.raise_errors = true;
    sammy_app.debug = true;
    // sammy_app.log = function() {};
    sammy_app.run();
});

/*
Hackathon = Ember.Application.create();


Hackathon.Event = DS.Model.extend({
  id: DS.attr('string'),
  user: DS.hasMany('Hackathon.User'),
  tag: DS.hasMany('Hackathon.Tag')
});


Hackathon.Room = DS.Model.extend({
  name: DS.attr('string'),
  users: DS.hasMany('Hackathon.User')
});


Hackathon.User = DS.Model.extend({
  name: DS.attr('string'),
  tags: DS.hasMany('Hackathon.Tag'),
  room: DS.belongsTo('Hackathon.Room')
});


Hackathon.Tag = DS.Model.extend({
  label: DS.attr('string')
});



Hackathon.Store = DS.Store.extend({
  revision: 12,
  adapter: DS.DjangoRESTAdapter.create({
      namespace: 'Hackathon'
  })
});



Hackathon.RoomsView = Ember.View.extend({
  addRoom: function(event) {
    var name = this.get('name');
    if (!name.trim()) {
      alert("Please enter a name");
    }
    // var logged_in_user = this.get('logged_in_user');
    // if (!logged_in_user.trim()) {
    //   alert("Who are you?");
    // }
    var new_room = Hackathon.Room.createRecord({'name': name});
    this.get('controller').addRoom(new_room);
    this.set('name', '');
  }
});


Hackathon.RoomsController = Ember.ArrayController.extend({
  addRoom: function(room) {
    this.get('store').commit();
  }
});



Hackathon.RoomView = Ember.View.extend({
  addUser: function(event) {
    var name = this.get('name');
    if (!name.trim()) {
      alert("Please enter a name");
    }
    var new_user = Hackathon.User.createRecord({'name': name});
    this.get('controller').addUser(new_user);
    this.set('name', '');
  }
});


Hackathon.RoomController = Ember.ObjectController.extend({
  addUser: function(room) {
    this.get('store').commit();
  }
});

Hackathon.Router = Ember.Router.extend({
  enableLogging: true,
  location: 'history'
});
Hackathon.Router.map(function() {
  this.route("rooms", {path : "/"});
  this.route("room", { path : "/room/:room_id" });
  this.route("user", { path : "/user/:user_id" });
});

Hackathon.RoomsRoute = Ember.Route.extend({
  model: function() {
    return Hackathon.Room.find();
  }
});
Hackathon.RoomRoute = Ember.Route.extend({
  model: function(options) {
    Hackathon.User.find({'room': options.room_id});
    return Hackathon.Room.find(options.room_id);
  }
});
*/
