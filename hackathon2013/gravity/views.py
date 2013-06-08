from functools import wraps
from django.views.generic import TemplateView
from django.http import HttpResponse
from rest_framework import generics, serializers
from hackathon2013.gravity.models import Tag, User, Room, create_event
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
    if event.tag_id: ret['tag'] = event.tag.label,
    return ret


def room_list_view(request):
    return get_json_response({'rooms': [get_json_room(room) for room in Room.objects.all()]})

def room_history_view(request, room_id, event_id):
    pass


def room_detail_view(request, room_id):
    user_name = request.GET.get('user', None)
    if not user_name: return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(id=room_id)
    user = User.objects.get(name=user_name, room=room)
    users = [get_json_user(u, as_user=user) for u in room.user_set.all()]
    return get_json_response({'room': get_json_room(room), 'users': users})


def login_view(request, room_id):
    user = request.POST.get('user', None)
    if not user: return HttpResponse(content="Missing: user", status=400)
    u, created = User.objects.get_or_create(name=user, room_id=room_id)
    return get_json_response({'ok': True})


def user_detail_view(request, room_id, user_id):
    return get_json_response({
        'user': get_json_user(User.objects.get(id=user_id, room_id=room_id))
    })


def room_create_event_view(request, room_id, user_id):
    user = request.POST.get('user', None)
    if not user: return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(id=room_id)
    tag = request.POST.get('tag', None)
    event = create_event(room, user_name=user, tag_label=tag, timestamp=None)
    return get_json_response(get_json_event(event))


def user_add_tag_view(request, room_id, user_id):
    tag = request.POST.get('tag', None)
    if not tag: return HttpResponse(content="Missing: tag", status=400)
    room = Room.objects.get(id=room_id)
    user = User.objects.get(id=user_id)
    event = create_event(room, user_name=user.name, tag_label=tag, timestamp=None)
    return get_json_response(get_json_event(event))


def event_list_view(request, last_known_event):
    return get_json_response({
        'events': [get_json_event(event) for event in Event.objects.filter(id__gt=last_known_event)]
    })
