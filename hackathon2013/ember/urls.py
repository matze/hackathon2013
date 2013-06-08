from hackathon2013.ember.views import RoomList, RoomDetail, UserList, UserDetail
# RatingList, RatingDetail, TagList, TagDetail
from django.views.decorators.csrf import csrf_exempt
from django.conf.urls.defaults import patterns, url, include

urlpatterns = patterns('',
    # url(r'^/tags/(?P<pk>\d+)/$', csrf_exempt(TagDetail.as_view())),
    # url(r'^/ratings/(?P<pk>\d+)/$', csrf_exempt(RatingDetail.as_view())),
    # url(r'^/speakers/(?P<pk>\d+)/$', csrf_exempt(SpeakerDetail.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/tags/$', csrf_exempt(TagList.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/ratings/$', csrf_exempt(RatingList.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/speakers/$', csrf_exempt(SpeakerList.as_view())),

    url(r'^/users/$', csrf_exempt(UserList.as_view())),
    url(r'^/rooms/(?P<session_pk>\d+)/users/$', csrf_exempt(UserList.as_view())),
    url(r'^/rooms/(?P<pk>\d+)/$', csrf_exempt(RoomDetail.as_view())),
    url(r'^/rooms/$', csrf_exempt(RoomList.as_view())),
)
