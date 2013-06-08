from django.views.generic import TemplateView
from rest_framework import generics, serializers
from hackathon2013.ember.models import Tag, User, Room
from django.http import HttpResponse
from functools import wraps
import json


class HomeView(TemplateView):
    template_name = 'index.html'


def get_json_response(response_content, status=200):
    content_type = 'application/json'
    return HttpResponse(json.dumps(response_content, separators=(',', ':')), content_type, status)


def ret_json_resp(func):
    @wraps(func)
    def inner(request, *args, **kwargs):
        func_result = func(
            request=request,
            *args, **kwargs
        )
        return get_json_response(func_result)
    return inner


@ret_json_resp
def room_list_view(request):
    return {
        'rooms': [
            {
                'id': room.id,
                'name': room.name
            }
            for room in Room.objects.all()
        ]
    }


@ret_json_resp
def room_detail_view(request, pk):
    room = Room.objects.get(pk=pk)
    users = [
        {
            'id': user.id,
            'name': user.name,
            'tags': [t.label for t in user.tags.all()]
        }
        for user in room.user_set.all()
    ]
    return {
        'room': {
            'id': room.id,
            'name': room.name
        },
        'users': users
    }


# def room_user_list_view(request, room_id):
#     return


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
