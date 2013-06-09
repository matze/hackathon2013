from django.conf.urls import patterns, include, url
from django.conf import settings
from django.conf.urls.static import static
from hackathon2013.gravity.views import HomeView
from django.contrib import admin

admin.autodiscover()

urlpatterns = static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + patterns('',
    # url(r'^admin/', include(admin.site.urls)),
    url(r'^api', include('hackathon2013.gravity.urls', namespace='hackathon')),
    url(r'^$', HomeView.as_view()),
    url(r'^.*$', HomeView.as_view())
)
