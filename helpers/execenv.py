import config


def evaluate(veryunsafe, **kwargs):
  if (config.alloweval and veryunsafe != ""):
    return eval(veryunsafe, globals(), kwargs)
  return True


def execute(veryunsafe, **kwargs):
  if (config.allowexec):
    exec(veryunsafe, globals(), kwargs)


def clear():
  if (config.allowexec):
    # Some tomfoolery to clear global variables
    for _ in list(globals().keys()):
      if _ not in ["__name__", "__doc__", "__package__", "__loader__", "__spec__",
                   "__annotations__", "__builtins__", "__cached__", "evaluate", "execute", "clear", "config"]:
        del globals()[_]
