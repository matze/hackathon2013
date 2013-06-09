from django.conf.urls import patterns, include, url
from django.conf import settings
#from django.conf.urls.static import static
from hackathon2013.gravity.views import HomeView

urlpatterns = patterns(
    '',
    url(r'^api', include('hackathon2013.gravity.urls')),
    url(r'^$', HomeView.as_view()),
    url(r'^room/.*$', HomeView.as_view())
)
# + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
