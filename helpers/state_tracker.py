from helpers.GraphElementClass import State, Edge


class StateTracker:
  def __init__(self):
    self.states = {}
    self.edges = {}

  def get_state(self, id):
    return self.states.get(id, None)

  def add_state(self, data):
    state = State(data)
    self.states[state.id] = state
    return state

  def update_state(self, data):
    state = self.get_state(data["id"])
    if state is None:
      state = self.add_state(data)
    else:
      state.update(data)
    return state

  def get_edge(self, id):
    return self.edges.get(id, None)

  def add_edge(self, data):
    edge = Edge(data)
    self.edges[edge.id] = edge
    return edge

  def update_edge(self, data):
    edge = self.get_edge(data["id"])
    if edge is None:
      edge = self.add_edge(data)
    else:
      edge.update(data)
    return edge

  def update(self, data):
    res = None
    if "id" not in data:
      data["id"] = -1
    if data["type"] == "State":
      res = self.update_state(data)
    elif data["type"] == "Edge":
      res = self.update_edge(data)
    return res

  def get_all_states(self):
    return {
        "states": [state.get_data() for state in self.states.values()],
        "edges": [edge.get_data() for edge in self.edges.values()]
    }

  def setThumbnail(self, id, thumbnail):
    state = self.get_state(id)
    if state is not None:
      state.image = thumbnail
      return True
    return False
