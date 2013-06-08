/* Gravity */

var sammy_app = null;


var bnd = function(model, template) {
    var element = document.getElementById('page');
    ko.cleanNode(element);
    ko.applyBindings({'name': template, 'data': model}, element);
};
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

        console.log("#errors: ", self.errors().length )

        if( self.errors().length )
        {
            return;
        }

        console.log(self.errors(), " <- username" )

        sammy_app.setLocation('/room/'+self.selectedGroup().id()+'?user='+self.loginName());
    };
};


var UserModel = function(user_data) {
  this.name = ko.observable(user_data.name);
  this.tags = ko.observableArray(user_data.tags);
};

ko.bindingHandlers.cytoscape = {
  init: function(element, valueAccessor) {
    var value = valueAccessor();
    console.log(value);
    if (value)
      $(element).cytoscape(value);
  }
}

var RoomDetailVM = function(room_id, as_user) {
    var self = this;
    self.currentRoom = ko.observable();
    self.users = ko.observableArray();
    self.visualizationOptions = ko.observable();

    $.get('/api/room/'+room_id+'/', {'user': as_user})
    .then(function(response) {
        self.currentRoom(new RoomModel(response.room));

        self.users(
            ko.utils.arrayMap(response.users, function(user_data) {
                return new UserModel(user_data);
            })
        );
        console.log('loaded');

        self.visualizationOptions({
          minZoom: 1,
          maxZoom: 1,
          style: cytoscape.stylesheet()
            .selector('node')
              .css({
                'content': 'data(name)',
                'text-valign': 'center',
                'color': 'white',
                'text-outline-width': 2,
                'text-outline-color': '#888',
                'shape': 'rectangle',
                'height': 48,
                'width': 48,
                'font-size': 22,
                'font-family': 'Source Sans Pro, sans-serif',
                'font-weight': 'bold'

              })
            .selector('edge')
              .css({
                'target-arrow-shape': 'triangle'
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
          
          elements: {
            nodes: [
              { data: { id: 'j', name: 'PB' } },
              { data: { id: 'e', name: 'MV' } },
              { data: { id: 'k', name: 'DR' } },
              { data: { id: 'g', name: 'MV' } }
            ],
            edges: [
              { data: { source: 'j', target: 'e' } },
              { data: { source: 'j', target: 'k' } },
              { data: { source: 'j', target: 'g' } },
              { data: { source: 'e', target: 'j' } },
              { data: { source: 'e', target: 'k' } },
              { data: { source: 'k', target: 'j' } },
              { data: { source: 'k', target: 'e' } },
              { data: { source: 'k', target: 'g' } },
              { data: { source: 'g', target: 'j' } }
            ]
          },
          
          ready: function(){
            window.cy = this;
            console.log("Cyto");
            
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
        });
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
