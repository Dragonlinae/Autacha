from helpers.element_class import State, Edge


class StateTracker:
  def __init__(self):
    self.states = {}
    self.edges = {}
    self.testing_id = -1

  def get_state(self, id):
    return self.states.get(id, None)

  def add_state(self, data):
    state = State(data)
    self.states[state.id] = state
    return state

  def remove_state(self, id):
    state = self.states.pop(id)
    if self.testing_id == id:
      self.testing_id = -1
    for edge_id in state.incomingEdges:
      removed_edge = self.edges.pop(edge_id)
      self.get_state(removed_edge.sourceStateId).remove_outgoing_edge(edge_id)
    for edge_id in state.outgoingEdges:
      removed_edge = self.edges.pop(edge_id)
      self.get_state(removed_edge.targetStateId).remove_incoming_edge(edge_id)
    return state

  def update_state(self, data):
    if "id" not in data:
      state = self.add_state(data)
      return state
    else:
      state = self.get_state(data["id"])
      if state is not None:
        state.safe_update(data)
        return state
      else:
        data["type"] = "Delete"
        return data

  def get_edge(self, id):
    return self.edges.get(id, None)

  def add_edge(self, data):
    edge = Edge(data)
    self.edges[edge.id] = edge
    self.get_state(data["sourceStateId"]).add_outgoing_edge(edge.id)
    self.get_state(data["targetStateId"]).add_incoming_edge(edge.id)
    return edge

  def remove_edge(self, id):
    edge = self.edges.pop(id)
    if self.testing_id == id:
      self.testing_id = -1
    self.get_state(edge.sourceStateId).remove_outgoing_edge(id)
    self.get_state(edge.targetStateId).remove_incoming_edge(id)
    return edge

  def update_edge(self, data):
    edge = None
    if self.get_state(data["sourceStateId"]) is None or self.get_state(data["targetStateId"]) is None or data["sourceStateId"] == data["targetStateId"]:
      data["type"] = "Delete"
      return data
    if "id" not in data:
      edge = self.add_edge(data)
    else:
      edge = self.get_edge(data["id"])
      if edge is None:
        data["type"] = "Delete"
        return data
      self.get_state(data["sourceStateId"]).remove_outgoing_edge(edge.id)
      self.get_state(data["targetStateId"]).remove_incoming_edge(edge.id)
      edge.safe_update(data)
      self.get_state(data["sourceStateId"]).add_outgoing_edge(edge.id)
      self.get_state(data["targetStateId"]).add_incoming_edge(edge.id)
    for other_edge in self.edges.values():
      if other_edge.id != edge.id and other_edge.sourceStateId == edge.sourceStateId and other_edge.targetStateId == edge.targetStateId:
        self.remove_edge(edge.id)
        edge.type = "Delete"
    return edge

  def update(self, data):
    res = None
    if data["type"] == "State":
      res = self.update_state(data)
    elif data["type"] == "Edge":
      res = self.update_edge(data)
    elif data["type"] == "Delete":
      if data["id"] in self.states:
        res = self.remove_state(data["id"])
        res.type = "Delete"
      elif data["id"] in self.edges:
        res = self.remove_edge(data["id"])
        res.type = "Delete"
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

  def apply_mask(self, id, mask):
    state = self.get_state(id)
    if state is not None:
      state.mask = mask
      self.testing_id = id
      return True
    return False

  def get_testing_mask(self):
    if self.testing_id == -1:
      return None
    return self.get_state(self.testing_id).mask

  def set_testing_id(self, id):
    if id in self.states or id in self.edges:
      self.testing_id = id
      return True
    else:
      self.testing_id = -1
      return False
