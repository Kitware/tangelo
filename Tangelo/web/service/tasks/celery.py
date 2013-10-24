import tangelo
import cherrypy
import sys
import json
#
# RESTful service used to create, monitor and terminate celery
# tasks.
#

# Remove current directory from search path so we don't hide the really
# celery module.
sys.path = sys.path[1:]

from celery import Celery
from celery import task, current_task
from celery.result import AsyncResult
from celery import states

celery = Celery()
config = tangelo.config()
celery.conf.update(**config)

@tangelo.restful
def get(job_id, operation, **kwargs):
    job = AsyncResult(job_id, backend=celery.backend)
    if operation == 'status':
        response = {'status': job.state}
        if job.state == states.FAILURE:
            response['message'] = str(job.result)
        elif job.state == 'PROGRESS':
            response['meta'] = str(job.result)

        return response
    elif operation == 'result':
        response  = {'result': job.result}
        return response
    else:
        return tangelo.HTTPStatusCode(400, "Invalid request")

@tangelo.restful
def post(*pargs, **kwargs):
    input = cherrypy.request.body.read()

    if not pargs:
        return tangelo.HTTPStatusCode(400, "No task module specified")

    pargs = filter(None, pargs)
    task_module = '.'.join(pargs)
    async_result  = celery.send_task('%s.run' % task_module, [input])

    return { 'id': async_result.task_id }

@tangelo.restful
def delete(job_id, **kwargs):
    task = AsyncResult(job_id, backend=celery.backend)
    task.revoke(celery.broker_connection(), terminate=True)
