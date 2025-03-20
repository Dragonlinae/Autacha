from enum import Enum
from helpers.mask_class import Mask
import helpers.game_interaction as GameInteraction
import json


class Element:
  id_counter = 0
  passable_data = ["id", "type", "x", "y", "name", "actions", "image"]

  def __init__(self, data):
    self.id = Element.id_counter
    self.type = "Element"
    self.x = data.get("x", 0)
    self.y = data.get("y", 0)
    self.name = data.get("name", "Element " + str(self.id))
    self.actions = data.get("actions", [])
    self.mask = Mask()
    self.frame = data.get("frame", None)
    self.image = data.get("image", None)
    Element.id_counter += 1

  def update(self, data):
    for key, value in self.__dict__.items():
      if key in data:
        setattr(self, key, data[key])

  def safe_update(self, data):
    print(data)
    self.x = data.get("x", self.x)
    self.y = data.get("y", self.y)
    self.name = data.get("name", self.name)
    self.actions = data.get("actions", self.actions)

  def setImage(self, frame):
    self.frame = frame
    self.image = "/elementimg?id=" + str(self.id)

  def get_data(self):
    data = {key: getattr(self, key)
            for key in Element.passable_data if hasattr(self, key)}
    if self.mask:
      with self.mask.read:
        data["mask"] = self.mask.get_data()
    return data

  def simulate(self, win, offset):
    print(self.actions)
    for action in self.actions:
      GameInteraction.input_action(win, action, offset)
    return {"status": "success"}


class State(Element):
  passable_data = ["width", "height", "borderThickness"]

  def __init__(self, data):
    super().__init__(data)
    self.type = "State"
    self.width = data.get("width", 100)
    self.height = data.get("height", 50)
    self.borderThickness = data.get("borderThickness", 10)
    self.outgoingEdges = data.get("outgoingEdges", [])
    self.incomingEdges = data.get("incomingEdges", [])
    self.name = data.get("name", "State " + str(self.id))

  def update(self, data):
    super().update(data)

  def safe_update(self, data):
    super().safe_update(data)
    self.width = data.get("width", self.width)
    self.height = data.get("height", self.height)

  def add_outgoing_edge(self, edge_id):
    self.outgoingEdges.append(edge_id)

  def add_incoming_edge(self, edge_id):
    self.incomingEdges.append(edge_id)

  def remove_outgoing_edge(self, edge_id):
    self.outgoingEdges.remove(edge_id)

  def remove_incoming_edge(self, edge_id):
    self.incomingEdges.remove(edge_id)

  def remove_edge(self, edge_id):
    if edge_id in self.outgoingEdges:
      self.outgoingEdges.remove(edge_id)
    elif edge_id in self.incomingEdges:
      self.incomingEdges.remove(edge_id)

  def get_data(self):
    data = super().get_data()
    data.update({key: getattr(self, key)
                for key in State.passable_data if hasattr(self, key)})
    return data


class Edge(Element):
  passable_data = ["sourceStateId",
                   "targetStateId", "lineThickness", "repeats"]

  def __init__(self, data):
    super().__init__(data)
    self.type = "Edge"
    self.sourceStateId = data.get("sourceStateId", None)
    self.targetStateId = data.get("targetStateId", None)
    self.lineThickness = data.get("lineThickness", 2)
    self.name = data.get("name", "Edge " + str(self.id))
    self.repeats = data.get("repeats", -1)

  def update(self, data):
    super().update(data)

  def safe_update(self, data):
    super().safe_update(data)

  def get_data(self):
    data = super().get_data()
    data.update({key: getattr(self, key)
                for key in Edge.passable_data if hasattr(self, key)})
    return data
