from django.views.decorators.csrf import csrf_exempt
from django.conf.urls.defaults import patterns, url, include
from gravity.views import (
    room_create_event_view,
    room_detail_view,
    event_list_view,
    room_list_view,
    user_detail_view,
    user_add_tag_view,
    user_move_view,
    login_view,
    HomeView
)


api_urls = patterns(
    '',
    # url(r'^/tags/(?P<pk>\d+)/$', csrf_exempt(TagDetail.as_view())),
    # url(r'^/ratings/(?P<pk>\d+)/$', csrf_exempt(RatingDetail.as_view())),
    # url(r'^/speakers/(?P<pk>\d+)/$', csrf_exempt(SpeakerDetail.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/tags/$', csrf_exempt(TagList.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/ratings/$', csrf_exempt(RatingList.as_view())),
    # url(r'^/sessions/(?P<session_pk>\d+)/speakers/$', csrf_exempt(SpeakerList.as_view())),

    url(r'^/room/(?P<room_id>\d+)/login/$', csrf_exempt(login_view)),
    url(r'^/room/(?P<room_id>\d+)/user/(?P<user_id>\d+)/tag/$', csrf_exempt(user_add_tag_view)),
    url(r'^/room/(?P<room_id>\d+)/user/(?P<user_id>\d+)/move/$', csrf_exempt(user_move_view)),
    url(r'^/room/(?P<room_id>\d+)/user/(?P<user_id>\d+)/$', csrf_exempt(user_detail_view)),
    url(r'^/room/(?P<room_id>\d+)/$', csrf_exempt(room_detail_view)),
    url(r'^/room/$', csrf_exempt(room_list_view)),
    url(r'^/room/(?P<room_id>\d+)/events/(?P<last_known_event>\d+)/$', csrf_exempt(event_list_view))
)

urlpatterns = patterns(
    '',
    url(r'^api', include(api_urls)),
    url(r'^$', HomeView.as_view()),
    url(r'^room/.*$', HomeView.as_view())
)

# from django.conf import settings
# from django.conf.urls.static import static
# urlpatterns = urlpatterns + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

