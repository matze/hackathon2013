from django.db import models
from django.utils import timezone


class Tag(models.Model):
    label = models.CharField(max_length=200)


class Room(models.Model):
    name = models.CharField(max_length=150)


class User(models.Model):
    name = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag)
    room = models.ForeignKey(Room)


class Event(models.Model):
    user = models.ForeignKey(User, related_name='ratings')
    tag = models.ForeignKey(Tag, related_name='ratings')
    timestamp = models.DateTimeField(default=timezone.now)


def create_event(room, user_name, tag_label, timestamp=None):
    user, _created = User.objects.get_or_create(name=user_name, room=room)
    tag, _created = Tag.objects.get_or_create(label=tag_label)
    user.tags.add(tag)
    evt = Event.objects.create(
        user=user, tag=tag, timestamp=timestamp
    )
    return evt
