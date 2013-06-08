# from django.db import models
# from django.utils import timezone


# class Tag(models.Model):
#     description = models.CharField(max_length=200)


# class User(models.Model):
#     name = models.CharField(max_length=200)
#     tags = models.ManyToManyField(Tag)


# class Room(models.Model):
#     name = models.CharField(max_length=150)
#     users = models.ManyToManyField(User)


# class Event(models.Model):
#     user = models.ForeignKey(User, related_name='ratings')
#     tag = models.ForeignKey(Tag, related_name='ratings')
#     timestamp = models.DateTimeField(default=timezone.now)
