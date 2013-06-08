Hackathon = Ember.Application.create();



Hackathon.Rooms = DS.Model.extend({
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



Hackathon.SessionView = Ember.View.extend({
  templateName: 'session',
  addRating: function(event) {
    if (this.formIsValid()) {
      var rating = this.buildRatingFromInputs(event);
      this.get('controller').addRating(rating);
      this.resetForm();
    }
  },
  buildRatingFromInputs: function(session) {
    var score = this.get('score');
    var feedback = this.get('feedback');
    return Hackathon.Rating.createRecord(
    { score: score,
      feedback: feedback,
      session: session
    });
  },
  formIsValid: function() {
    var score = this.get('score');
    var feedback = this.get('feedback');
    if (score === undefined || feedback === undefined || score.trim() === "" || feedback.trim() === "") {
      return false;
    }
    return true;
  },
  resetForm: function() {
    this.set('score', '');
    this.set('feedback', '');
  }
});



Hackathon.SessionController = Ember.ObjectController.extend({
  addRating: function(rating) {
    this.get('store').commit();
  }
});

Hackathon.Router.map(function() {
  this.route("room", { path : "/" });
  this.route("session", { path : "/session/:session_id" });
  this.route("speaker", { path : "/speaker/:speaker_id" });
});

Hackathon.RoomsRoute = Ember.Route.extend({
  model: function() {
    return Hackathon.Rooms.find();
  }
});
