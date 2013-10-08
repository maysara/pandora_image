# -*- coding: utf-8 -*-
# vi:si:et:sw=4:sts=4:ts=4
from __future__ import division, with_statement

import logging
import sys


class ErrorHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)        

    """An exception log handler that log entries into log database.

    If the request is passed as the first argument to the log record,
    request data will be provided in the
    """
    def emit(self, record):
        import traceback
        from django.views.debug import ExceptionReporter
        from django.conf import settings
        import models
        user = None
        line = 0
        text = ''
        url = ''
        try:
            if sys.version_info < (2,5):
                # A nasty workaround required because Python 2.4's logging
                # module doesn't support passing in extra context.
                # For this handler, the only extra data we need is the
                # request, and that's in the top stack frame.
                request = record.exc_info[2].tb_frame.f_locals['request']
            else:
                request = record.request

            request_repr = repr(request)
            if request.user.is_authenticated():
                user = request.user
            url = request.META.get('PATH_INFO', '')
        except:
            request = None
            request_repr = "%s %s\n\nRequest repr() unavailable" % (record.levelname, record.msg)

        if record.exc_info:
            stack_trace = '\n'.join(traceback.format_exception(*record.exc_info))
            stack_info = traceback.extract_tb(record.exc_info[2])
            if stack_info:
                url = stack_info[-1][0]
                line = stack_info[-1][1]
        else:
            stack_trace = 'No stack trace available'

        text = "%s\n\n%s" % (stack_trace, request_repr)
        if text:
            l = models.Log(
                text=text,
                line=line,
                url=url
            )
            if user:
                l.user = user
            l.save()
