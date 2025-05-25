from helpers.game_interaction import GameInteraction
from helpers.state_tracker import StateTracker

import pickle
import sys
import time
from functools import cmp_to_key
import argparse
import helpers.execenv as execenv

parser = argparse.ArgumentParser(
    description="Run autacha automation files",
    formatter_class=argparse.RawDescriptionHelpFormatter,
    epilog="""EXAMPLES:
python %(prog)s ./myfile.autacha
python %(prog)s ./myfile.autacha -s Start -e End -xf Setup -xt Base -f base recruit battle"""
)
parser.add_argument("path", help="path to autacha file")
parser.add_argument(
    "-s", "--start", help="start state (where automation starts)", default="Start")
parser.add_argument(
    "-e", "--end", help="end states (stops automation)", default="End")
parser.add_argument(
    "-xf", "--skipfrom", help="skip from this state", default="Setup")
parser.add_argument(
    "-xt", "--skipto", help="skip to this state")
parser.add_argument(
    "-f", "--flags", nargs="*", help="initialized eval variables, will be set to None, can set multiple")
args = parser.parse_args()

stateTracker = None
gameInteraction = None
aftersetup = None

with open(args.path, "rb") as f:
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
  if state.name == args.start:
    if curr == None:
      curr = state
    else:
      print(
          f"More than one [{args.start}] state detected. Ensure that only one state is named '{args.start}'.")
      exit(0)

  state.outgoingEdges.sort(key=cmp_to_key(sort_edges_compare))
  print(state.outgoingEdges)

if curr == None:
  print(f"[{args.start}] state not found. Ensure that exactly one state is named '{args.start}'.")
  exit(0)

gameInteraction = GameInteraction()

if args.flags is not None:
  for flag in args.flags:
    execenv.execute(f"global {flag}\n{flag} = None")
  pass

frame_number = -1
curr.simulate(gameInteraction)
while True:
  time.sleep(0.01)
  frame = None
  if gameInteraction.get_frame_number() != frame_number:
    frame = gameInteraction.get_last_frame().frame_buffer
    frame_number = gameInteraction.get_frame_number()

  changed = False
  match curr.type:
    case "State":
      for edgeID in curr.outgoingEdges:
        edge = stateTracker.get_edge(edgeID)
        if edge.check_condition(frame):
          curr = edge
          changed = True
          break

    case "Edge":
      state = stateTracker.get_state(curr.targetStateId)
      if state.check_condition(frame):
        curr = state
        changed = True
      else:
        curr = stateTracker.get_state(curr.sourceStateId)
        print(f"Failed state assertion, returning to {curr.name}")

  if changed:
    print(f"Transitioned to {curr.type} {curr.name}")
    curr.simulate(gameInteraction)

  if curr.name == args.end:
    break
  elif args.skipto is not None and curr.name == args.skipfrom:
    for id, state in stateTracker.states.items():
      if state.name == args.skipto:
        print("Skipping to", args.skipto)
        curr = state
        curr.simulate(gameInteraction)
        break

print("Autacha Complete")
