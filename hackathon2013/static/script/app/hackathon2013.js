/* Gravity */
Hackathon = Ember.Application.create();



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
