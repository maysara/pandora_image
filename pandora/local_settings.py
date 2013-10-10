DATABASES = {
						'default': {
	          	'NAME': 'pandora',
	          	'ENGINE': 'django.db.backends.postgresql_psycopg2',
	          	'USER': 'pandora',
	          	'PASSWORD': '',
						}
}
BROKER_PORT = 5672
BROKER_USER = "pandora"
BROKER_PASSWORD = "pandora"
BROKER_VHOST = "/pandora"

SITE_CONFIG = '/srv/pandora/pandora/pandora_image.jsonc'

#DATA_SERVICE = 'https://data.0xdb.org/api/'
DATA_SERVICE = 'http://localhost/api/'
#VIDEO_PREFIX = "//video{uid}.pad.ma"
#VIDEO_PREFIX = "//localhost"
VIDEO_PREFIX = "//localhost"
#VIDEO_PREFIX = "//video{uid}.127.0.0.1"
#Commented the following line cuz admin user is not allowed to access anything even when he is logged in
#SESSION_COOKIE_DOMAIN = ".pad.ma"
#SESSION_COOKIE_DOMAIN = ".127.0.0.1"
#SESSION_COOKIE_DOMAIN = ".localhost"

DEBUG = False
TEMPLATE_DEBUG = True
	
#with apache x-sendfile or lighttpd set this to True
#XSENDFILE = True
	
#with nginx X-Accel-Redirect set this to True
#XACCELREDIRECT = False
XACCELREDIRECT = True
