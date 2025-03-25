import config


def evaluate(veryunsafe, **kwargs):
  if (config.alloweval and veryunsafe != ""):
    return eval(veryunsafe, globals(), kwargs)
  return True


def execute(veryunsafe, **kwargs):
  if (config.allowexec):
    exec(veryunsafe, globals(), kwargs)
