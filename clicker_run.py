from helpers.game_interaction import GameInteraction
from helpers.state_tracker import StateTracker

import pickle
import sys
import time
from functools import cmp_to_key


stateTracker = None
gameInteraction = None

if len(sys.argv) != 2:
  print(f"Usage: {sys.argv[0]} [.autacha FILE PATH]")
  print(f"Ensure that there is exactly one state named 'Start', and name terminating states with 'End'")

with open(sys.argv[1], "rb") as f:
  stateTracker = pickle.load(f)[1]


# Order in which edges will be checked
# First edge to be checked will be the highest priority number and then highest in graph editor
def sort_edges_compare(a, b):
  global stateTracker

  aedge = stateTracker.get_edge(a)
  bedge = stateTracker.get_edge(b)
  if aedge.priority == bedge.priority:
    astate = stateTracker.get_state(aedge.targetStateId)
    bstate = stateTracker.get_state(bedge.targetStateId)
    if astate.y == bstate.y:
      return -1
    return astate.y - bstate.y
  return bedge.priority - aedge.priority


curr = None
for id, state in stateTracker.states.items():
  if state.name == "Start":
    if curr == None:
      curr = state
    else:
      print(
          "More than one [Start] state detected. Ensure that only one state is named 'Start'.")
      exit(0)

  state.outgoingEdges.sort(key=cmp_to_key(sort_edges_compare))
  print(state.outgoingEdges)

if curr == None:
  print("[Start] state not found. Ensure that exactly one state is named 'Start'.")
  exit(0)

gameInteraction = GameInteraction()

frame_number = -1
curr.simulate(gameInteraction)
while True:
  time.sleep(0.01)
  frame = None
  if gameInteraction.get_frame_number() != frame_number:
    frame = gameInteraction.get_last_frame().frame_buffer

  changed = False
  match curr.type:
    case "State":
      for edgeID in curr.outgoingEdges:
        edge = stateTracker.get_edge(edgeID)
        if not edge.mask.valid():
          curr = edge
          changed = True
          break
        elif frame is None:
          pass
        elif edge.check_condition(frame):
          curr = edge
          changed = True
          break

    case "Edge":
      state = stateTracker.get_state(curr.targetStateId)
      if not state.mask.valid():
        curr = state
        changed = True
      elif frame is None:
        pass
      elif state.check_condition(frame):
        curr = state
        changed = True
      else:
        curr = stateTracker.get_state(curr.sourceStateId)
        print(f"Failed state assertion, returning to {curr.name}")

  if changed:
    print(f"Transitioned to {curr.type} {curr.name}")
    curr.simulate(gameInteraction)

  if curr.name == "End":
    break

print("Autacha Complete")
