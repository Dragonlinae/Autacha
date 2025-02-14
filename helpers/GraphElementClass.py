from enum import Enum
import json


class elementTypes(Enum):
  ELEMENT = "Element"
  STATE = "State"
  EDGE = "Edge"

  def to_json(self):
    return self.value


class Element:
  id_counter = 0

  def __init__(self, data):
    self.id = Element.id_counter
    self.type = "Element"
    self.x = data.get("x", 0)
    self.y = data.get("y", 0)
    self.name = data.get("name", "Element " + str(self.id))
    Element.id_counter += 1

  def update(self, data):
    for key, value in self.__dict__.items():
      if key in data:
        setattr(self, key, data[key])

  def get_data(self):
    data = {key: value for key, value in self.__dict__.items()}
    return data


class State(Element):
  def __init__(self, data):
    super().__init__(data)
    self.type = "State"
    self.width = data.get("width", 100)
    self.height = data.get("height", 50)
    self.image = data.get("image", None)
    self.borderThickness = data.get("borderThickness", 10)
    self.outgoingEdges = data.get("outgoingEdges", [])
    self.incomingEdges = data.get("incomingEdges", [])
    self.name = data.get("name", "State " + str(self.id))

  def update(self, data):
    super().update(data)

  # def get_data(self):
  #   return {
  #       "id": self.id,
  #       "type": self.type.to_json(),
  #       "x": self.x,
  #       "y": self.y,
  #       "width": self.width,
  #       "height": self.height,
  #       "image": self.image,
  #       "borderThickness": self.borderThickness,
  #       "outgoingEdges": self.outgoingEdges,
  #       "incomingEdges": self.incomingEdges,
  #       "name": self.name
  #   }


class Edge(Element):
  def __init__(self, data):
    super().__init__(data)
    self.type = "Edge"
    self.sourceStateId = data.get("sourceStateId", None)
    self.targetStateId = data.get("targetStateId", None)
    self.lineThickness = data.get("lineThickness", 2)
    self.name = data.get("name", "Edge " + str(self.id))

  def update(self, data):
    super().update(data)

  # def get_data(self):
  #   return {
  #       "id": self.id,
  #       "type": self.type.to_json(),
  #       "x": self.x,
  #       "y": self.y,
  #       "sourceState": self.sourceState,
  #       "targetState": self.targetState,
  #       "lineThickness": self.lineThickness,
  #       "name": self.name
  #   }
