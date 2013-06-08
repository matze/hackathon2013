from django.conf.urls import patterns, include, url
from hackathon2013.ember.views import HomeView
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    # url(r'^admin/', include(admin.site.urls)),
    url(r'^api', include('hackathon2013.ember.urls', namespace='hackathon')),
    url(r'^$', HomeView.as_view()),
    url(r'^.*$', HomeView.as_view())
)
