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


def room_list_view(request):
    return get_json_response({
        'rooms': [get_json_room(room) for room in Room.objects.all()]
    })


def get_json_room(room):
    return {'id': room.id, 'name': room.name}


def room_detail_view(request, pk):
    user = request.GET.get('user', None)
    if not user:
        return HttpResponse(content="Missing: user", status=400)
    room = Room.objects.get(pk=pk)
    users = [get_json_user(u, as_user=user) for u in room.user_set.all()]
    return get_json_response({'room': get_json_room(room), 'users': users})


def get_json_user(user, as_user=None):
    if as_user:
        return {
            'id': user.id,
            'name': user.name,
            'tags': [t.label for t in user.tags.all()],
            'myself': True
        }
    return {
        'id': user.id,
        'name': user.name,
        'tags': [t.label for t in user.tags.all()]
    }


def get_json_event(event):
    ret = {
        'id': event.id,
        'user': get_json_user(event.user)
    }
    if event.tag_id:
        ret['tag'] = event.tag.label,
    return ret


def login_view(request, room_id):
    user = request.POST.get('user', None)
    if not user:
        return HttpResponse(content="Missing: user", status=400)

    room = Room.objects.get(id=room_id)

    u, created = User.objects.get_or_create(name=user, room=room)
    return get_json_response({'ok': True})


def room_create_event_view(request, room_id):
    user = request.POST.get('user', None)
    if not user:
        return HttpResponse(content="Missing: user", status=400)

    room = Room.objects.get(id=room_id)

    tag = request.POST.get('tag', None)

    event = create_event(room, user_name=user, tag_label=tag, timestamp=None)
    return get_json_response(get_json_event(event))

# class RoomSerializer(serializers.ModelSerializer):
#     #users = serializers.ManyPrimaryKeyRelatedField()

#     class Meta:
#         model = Room
#         fields = ('id', 'name')


# class RoomList(generics.ListCreateAPIView):
#     model = Room
#     serializer_class = RoomSerializer


# class RoomDetail(generics.RetrieveUpdateDestroyAPIView):
#     model = Room
#     serializer_class = RoomSerializer


class UserSerializer(serializers.ModelSerializer):
    tags = serializers.ManyPrimaryKeyRelatedField()

    class Meta:
        model = User
        fields = ('id', 'name', 'tags')


class UserList(generics.ListCreateAPIView):
    model = User
    serializer_class = UserSerializer

    # def get_queryset(self):
    #     session_pk = self.kwargs.get('session_pk', None)
    #     if session_pk is not None:
    #         return Speaker.objects.filter(session__pk=session_pk)
    #     return []


class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    model = User
    serializer_class = UserSerializer


# class RatingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Rating
#         fields = ('id', 'score', 'feedback', 'session')



# class TagSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Tag
#         fields = ('id', 'description')

# class TagList(generics.ListCreateAPIView):
#     model = Tag
#     serializer_class = serializers.TagSerializer

#     def get_queryset(self):
#         session_pk = self.kwargs.get('session_pk', None)
#         if session_pk is not None:
#             return Tag.objects.filter(session__pk=session_pk)
#         return []

# class TagDetail(generics.RetrieveUpdateDestroyAPIView):
#     model = Tag
#     serializer_class = serializers.TagSerializer

# class RatingList(generics.ListCreateAPIView):
#     model = Rating
#     serializer_class = serializers.RatingSerializer

#     def get_queryset(self):
#         session_pk = self.kwargs.get('session_pk', None)
#         if session_pk is not None:
#             return Rating.objects.filter(session__pk=session_pk)
#         return []

# class RatingDetail(generics.RetrieveUpdateDestroyAPIView):
#     model = Rating
#     serializer_class = serializers.RatingSerializer
