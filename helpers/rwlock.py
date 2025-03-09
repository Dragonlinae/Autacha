from threading import Condition, Lock


class RWLock:
  def __init__(self):
    self.readers = 0
    self.writers = 0
    self.lock = Condition(Lock())

  def acquire_read(self):
    self.lock.acquire()
    try:
      while self.writers > 0:
        self.lock.wait()
      self.readers += 1
    finally:
      self.lock.release()

  def release_read(self):
    self.lock.acquire()
    try:
      self.readers -= 1
      if self.readers == 0:
        self.lock.notify_all()
    finally:
      self.lock.release()

  def acquire_write(self):
    self.lock.acquire()
    self.writers += 1
    while self.readers > 0:
      self.lock.wait()

  def release_write(self):
    self.writers -= 1
    self.lock.notify_all()
    self.lock.release()

  class ReadContext:
    def __init__(self, rwlock):
      self.rwlock = rwlock

    def __enter__(self):
      self.rwlock.acquire_read()
      return self

    def __exit__(self, exc_type, exc_val, exc_tb):
      self.rwlock.release_read()

  class WriteContext:
    def __init__(self, rwlock):
      self.rwlock = rwlock

    def __enter__(self):
      self.rwlock.acquire_write()
      return self

    def __exit__(self, exc_type, exc_val, exc_tb):
      self.rwlock.release_write()

  @property
  def read(self):
    return self.ReadContext(self)

  @property
  def write(self):
    return self.WriteContext(self)
