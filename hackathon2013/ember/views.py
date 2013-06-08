from django.views.generic import TemplateView
from rest_framework import generics, serializers
from hackathon2013.ember.models import Tag, User, Room


class HomeView(TemplateView):
    template_name = 'index.html'


class RoomSerializer(serializers.ModelSerializer):
    users = serializers.ManyPrimaryKeyRelatedField()

    class Meta:
        model = Room
        fields = ('id', 'name', 'users')


class RoomList(generics.ListCreateAPIView):
    model = Room
    serializer_class = RoomSerializer


class RoomDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Room
    serializer_class = RoomSerializer


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
