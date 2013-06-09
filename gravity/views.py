from django.views.generic import TemplateView
from django.http import HttpResponse
from gravity.models import Tag, User, Room, create_event, Event
import json


class HomeView(TemplateView):
    template_name = 'index.html'


def get_json_response(response_content, status=200):
    content_type = 'application/json'
    return HttpResponse(json.dumps(response_content, separators=(',', ':')), content_type, status)


def get_json_room(room):
    return {'id': room.id, 'name': room.name}


def get_json_user(user, as_user=None):
    return {
        'id': user.id,
        'name': user.name,
        'tags': [t.label for t in user.tags.all()],
        'myself': True if as_user and as_user.id == user.id else False
    }


def get_json_event(event):
    ret = {'id': event.id, 'user': get_json_user(event.user)}
    if event.tag_id: ret['tag'] = event.tag.label
    return ret


def room_list_view(request):
    return get_json_response({'rooms': [get_json_room(room) for room in Room.objects.all()]})


def room_detail_view(request, room_id):
    user_name = request.GET.get('user', None)
    if not user_name: return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(id=room_id)
    user = User.objects.get(name=user_name, room=room)
    users = [get_json_user(u, as_user=user) for u in room.user_set.all()]
    return get_json_response({
        'room': get_json_room(room), 'users': users,
        'latestEventId': Event.objects.latest().id
    })


def login_view(request, room_id):
    user_name = request.POST.get('user', None)
    if not user_name: return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(id=room_id)
    try:
        u = User.objects.get(name=user_name, room=room)
    except User.DoesNotExist:
        u = User.objects.create(name=user_name, room=room)
        create_event(room, user_name=user_name)
    print "login_view", u
    return get_json_response({'ok': True})


def user_detail_view(request, room_id, user_id):
    return get_json_response({
        'user': get_json_user(User.objects.get(id=user_id, room__id=room_id)),
        'latestEventId': Event.objects.latest().id,
        'all_tags_in_group': [
            tag.label for tag in
            Tag.objects.filter(user__room__id=room_id).distinct()
        ]
    })


def user_move_view(request, room_id, user_id):
    room = Room.objects.get(id=room_id)
    try:
        u = User.objects.get(id=user_id, room=room)
        u.x = request.POST.get('x')
        u.y = request.POST.get('y')

        u.save()

    except User.DoesNotExist:
        pass


    return get_json_response({})


def room_create_event_view(request, room_id, user_id):
    user_name = request.POST.get('user', None)
    if not user_name: return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(id=room_id)
    tag = request.POST.get('tag', None)
    event = create_event(room, user_name=user_name, tag_label=tag, timestamp=None)
    return get_json_response(get_json_event(event))


def user_add_tag_view(request, room_id, user_id):
    tag = request.POST.get('tag', None)
    if not tag: return HttpResponse(content="Missing: tag", status=400)
    room = Room.objects.get(id=room_id)
    user = User.objects.get(id=user_id)
    event = create_event(room, user_name=user.name, tag_label=tag, timestamp=None)
    return get_json_response(get_json_event(event))


def event_list_view(request, room_id, last_known_event):
    return get_json_response({
        'events': [
            get_json_event(event)
            for event in Event.objects.filter(user__room__id=room_id, id__gt=last_known_event)
        ]
    })
