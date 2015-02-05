import tangelo
from twisted.internet import reactor, threads


def teardown(config, store):
    if reactor.running:
        tangelo.log_info("VTKWEB", "Shutting down Twisted reactor")
        threads.blockingCallFromThread(reactor, reactor.stop)

    if "processes" in store:
        tangelo.log_info("VTKWEB", "Terminating VTKWeb processes")
        for p in store["processes"].values():
            p["process"].terminate()
            p["process"].wait()
