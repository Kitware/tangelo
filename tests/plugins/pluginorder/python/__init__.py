import tangelo

modtest = tangelo.plugin.moduletest.server.TestConstant
tangelo.log('Plugin can reference tangelo.plugin.moduletest %s' % str(modtest))
