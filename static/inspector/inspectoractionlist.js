import { selectedElement } from "../managers/selectedelementManager.js";
import record from "../managers/recordManager.js";
import socket from "../managers/socketManager.js";

(function () {
  var insActionList = document.getElementById("inspector-action-list")
  var actionList = document.getElementById("action-list");
  var elementTemplate = document.getElementById("action-template");
  var addActionSelector = document.getElementById("add-action-selector")
  var addActionButton = document.getElementById("add-action");
  var saveActionButton = document.getElementById("save-actions");
  var testActionsButton = document.getElementById("test-all-actions");

  var friendlynaminator9000 = {
    "click": "Click",
    "dragVertices": "Continuous Drag",
    "key": "Key",
    "clickDetect": "Click Detected Region",
    "wait": "Wait",
    "exec": "Execute",
    "launch": "Launch Program",
    "close": "Close Program",
    "hookInputs": "Hook Inputs",
    "hookVideo": "Hook Video",
    "setWindowDim": "Set Window Dimensions",
  }

  var paramTemplates = {
    "click": document.getElementById("action-click-params-template"),
    // "Drag": document.getElementById("action-drag-params-template"),
    "dragVertices": document.getElementById("action-cont-drag-params-template"),
    "key": document.getElementById("action-key-params-template"),
    "clickDetect": document.getElementById("action-click-detect-params-template"),
    "wait": document.getElementById("action-wait-params-template"),
    "exec": document.getElementById("action-exec-params-template"),
    "launch": document.getElementById("action-launch-params-template"),
    "close": document.getElementById("action-close-params-template"),
    "hookInputs": document.getElementById("action-input-hook-params-template"),
    "hookVideo": document.getElementById("action-video-hook-params-template"),
    "setWindowDim": document.getElementById("action-set-window-dimensions-template"),
  };

  for (const key of Object.keys(paramTemplates)) {
    var actionSelectorItem = document.createElement("option");
    actionSelectorItem.value = key;
    actionSelectorItem.innerText = friendlynaminator9000[key];
    console.log(actionSelectorItem);
    addActionSelector.appendChild(actionSelectorItem);
  }

  addActionButton.addEventListener("click", function () {
    var action = addActionSelector.value
    var element = createActionElement(action)
    actionList.appendChild(element);
  });

  saveActionButton.addEventListener("click", function () {
    var actions = [];
    var actionElements = actionList.children;
    for (let i = 0; i < actionElements.length; i++) {
      actions.push(actionElements[i].toActionSave());
    }
    socket.emit("action_list_event", {
      id: selectedElement.getSelectedElement().getId(), action: "set", actionlist: actions
    });
    console.log(actions);
  });

  testActionsButton.addEventListener("click", function () {
    var actions = [];
    var actionElements = actionList.children;
    for (let i = 0; i < actionElements.length; i++) {
      actions.push(actionElements[i].toActionSave());
    }
    socket.emit("action_list_event", {
      id: selectedElement.getSelectedElement().getId(), action: "set", actionlist: actions
    }, function (confirmation) {
      testActionsButton.classList.add("active");
      socket.emit("simulate_event", {
        id: selectedElement.getSelectedElement().getId()
      }, function (confirmation2) {
        console.log(confirmation2);
        testActionsButton.classList.remove("active");
      });
    });
  });

  insActionList.update = function () {
    actionList.innerHTML = '';
    if (selectedElement.getSelectedElement() && selectedElement.getSelectedElement().actions) {
      for (const action of selectedElement.getSelectedElement().actions) {
        console.log(action);
        var element = createActionElement(action.type);

        var labels = element.querySelector(".action-params").querySelectorAll("label");
        for (let i = 0; i < labels.length; i++) {
          console.log(labels[i]);
          var input = labels[i].querySelector("input") || labels[i].querySelector("select") || labels[i].querySelector("textarea");
          console.log(input);
          if (input.name in action) {
            if (input.name == "vertices") {
              input.value = JSON.stringify(action[input.name]);
            } else {
              input.value = action[input.name];
            }
          }
        }
        actionList.appendChild(element);
      }
    }
  }

  function createActionElement(action) {
    var element = elementTemplate.content.cloneNode(true).children[0];
    element.actionType = action;
    element.querySelector(".action-type").textContent = friendlynaminator9000[action];
    element.querySelector(".action-params").append(paramTemplates[action].content.cloneNode(true));
    element.querySelector(".delete-action").addEventListener("click", function () {
      element.remove();
    });
    element.querySelector(".dragger").addEventListener("mousedown", function (e) {
      actionListReorder(e, element);
    }
    );
    element.toActionSave = function () {
      var actionSave = { type: element.actionType };
      var labels = element.querySelector(".action-params").querySelectorAll("label");
      for (let i = 0; i < labels.length; i++) {
        console.log(labels[i]);
        var input = labels[i].querySelector("input") || labels[i].querySelector("select") || labels[i].querySelector("textarea");
        console.log(input);
        if (input.name == "vertices") {
          actionSave[input.name] = JSON.parse(input.value);
        } else {
          actionSave[input.name] = input.value;
        }
      }
      return actionSave;
    }
    console.log(element);
    return element;
  }

  function actionListReorder(e, element) {
    e.preventDefault();
    var prevY = e.clientY;
    var prevX = e.clientX;
    var isDragging = true;
    var placeholder = document.createElement("li");
    placeholder.style.height = element.getBoundingClientRect().height + "px";
    placeholder.style.width = element.getBoundingClientRect().width + "px";
    placeholder.style.backgroundColor = "lightgrey";
    placeholder.style.opacity = "0.5";

    element.style.top = element.getBoundingClientRect().top + "px";
    element.style.left = element.getBoundingClientRect().left + "px";
    element.style.position = "absolute";
    element.style.transition = "";
    element.style.pointerEvents = "none";
    actionList.insertBefore(placeholder, element);
    document.addEventListener("mousemove", function (e) {
      if (isDragging) {
        var deltaY = e.clientY - prevY;
        var deltaX = e.clientX - prevX;
        element.style.translate = deltaX + "px " + deltaY + "px";

        var beforeElement = placeholder.previousElementSibling;
        var afterElement = element.nextElementSibling;
        if (beforeElement && e.clientY < beforeElement.getBoundingClientRect().top + beforeElement.getBoundingClientRect().height / 2) {
          var prevposition = beforeElement.getBoundingClientRect().top;
          actionList.insertBefore(beforeElement, element.nextElementSibling);
          var diff = prevposition - beforeElement.getBoundingClientRect().top;
          beforeElement.style.transition = "";
          beforeElement.style.translate = "0px " + diff + "px";
          setTimeout(() => {
            beforeElement.style.transition = "translate 0.2s";
            beforeElement.style.translate = "0px 0px";
          }, 10);
        } else if (afterElement && e.clientY > afterElement.getBoundingClientRect().top + afterElement.getBoundingClientRect().height / 2) {
          var prevposition = afterElement.getBoundingClientRect().top;
          actionList.insertBefore(afterElement, placeholder);
          var diff = prevposition - afterElement.getBoundingClientRect().top;
          afterElement.style.transition = "";
          afterElement.style.translate = "0px " + diff + "px";
          setTimeout(() => {
            afterElement.style.transition = "translate 0.2s";
            afterElement.style.translate = "0px 0px";
          }, 10);
        }
      }
    });
    document.addEventListener("mouseup", function (e) {
      isDragging = false;
      element.style.translate = "0px 0px";
      element.style.top = "auto";
      element.style.left = "auto";
      element.style.position = "static";
      element.style.pointerEvents = "auto";
      placeholder.remove();
    });
  }


  // Record and Simulate Handlers

  var actionListFuncs = {};

  function recordCancel() {
    if (record.active) {
      record.callback();
      record.active = false;
    }
  }

  function recordClick(div) {
    if (div.querySelector('button[name="record-click"]').classList.contains("active")) {
      recordCancel();
      return;
    }
    recordCancel();

    record.targets = new Set(["dragEnd"]);
    div.querySelector('button[name="record-click"]').classList.add("active");
    record.callback = function (data) {
      if (data && "type" in data) {
        if (data["type"] == "dragEnd") {
          div.querySelector('input[name="xpos"]').value = data["xpos"];
          div.querySelector('input[name="ypos"]').value = data["ypos"];
          div.querySelector('button[name="record-click"]').classList.remove("active");
          record.active = false;
        }
      } else {
        div.querySelector('button[name="record-click"]').classList.remove("active");
        record.active = false;
      }
    }
    record.active = true;
  }

  function simulateClick(div) {
    var xpos = div.querySelector('input[name="xpos"]').value;
    var ypos = div.querySelector('input[name="ypos"]').value;
    var pressType = div.querySelector('select[name="presstype"]').value
    socket.emit('input_event', { "type": "click", "xpos": xpos, "ypos": ypos, "presstype": pressType, "callback": true });
  }

  function recordContDrag(div) {
    if (div.querySelector('button[name="record-cont-drag"]').classList.contains("active")) {
      recordCancel();
      return;
    }
    recordCancel();

    record.targets = new Set(["dragStart", "dragMove", "dragEnd"]);
    div.querySelector('button[name="record-cont-drag"]').classList.add("active");
    var dragPoints = []
    record.callback = function (data) {
      if (data && "type" in data) {
        if (["dragStart", "dragMove"].includes(data["type"])) {
          dragPoints.push([data["xpos"], data["ypos"], data["time"], 0]);
        }
        if (data["type"] == "dragEnd") {
          dragPoints.push([data["xpos"], data["ypos"], data["time"], 1]);
          div.querySelector('input[name="vertices"]').value = JSON.stringify(dragPoints)
          div.querySelector('button[name="record-cont-drag"]').classList.remove("active");
          record.active = false;
        }
      } else {
        div.querySelector('button[name="record-cont-drag"]').classList.remove("active");
        record.active = false;
      }
    }
    record.active = true;
  }

  function simulateContDrag(div) {
    var dragPoints = JSON.parse(div.querySelector('input[name="vertices"]').value);
    socket.emit('input_event', {
      "type": "dragVertices",
      "vertices": dragPoints
      , "callback": true
    });
  }

  function simulateKey(div) {
    var keycode = div.querySelector('input[name="keycode"]').value;
    socket.emit('input_event', {
      "type": "key", "keycode": keycode
      , "callback": true
    });
  }

  function recordClickDetect(div) {
    if (div.querySelector('button[name="record-click-detect"]').classList.contains("active")) {
      recordCancel();
      return;
    }
    recordCancel();

    record.targets = new Set(["dragEnd"]);
    div.querySelector('button[name="record-click-detect"]').classList.add("active");
    record.callback = function (data) {
      if (data && "type" in data) {
        if (data["type"] == "dragEnd") {
          div.querySelector('button[name="record-click-detect"]').classList.remove("active");
          record.active = false;

          socket.emit("get_detect_loc", {
            id: selectedElement.getSelectedElement().getId()
          }, function (xoffset, yoffset) {
            console.log(xoffset, yoffset);
            div.querySelector('input[name="xoffset"]').value = data["xpos"] - xoffset;
            div.querySelector('input[name="yoffset"]').value = data["ypos"] - yoffset;
          });
        }
      } else {
        div.querySelector('button[name="record-click-detect"]').classList.remove("active");
        record.active = false;
      }
    }
    record.active = true;
  }

  function simulateClickDetect(div) {
    var xoffset = div.querySelector('input[name="xoffset"]').value;
    var yoffset = div.querySelector('input[name="yoffset"]').value;
    socket.emit('input_event', {
      "id": selectedElement.getSelectedElement().getId(), "type": "clickDetect", "xoffset": xoffset, "yoffset": yoffset
      , "callback": true
    });
  }

  function wait(div) {
    var waitTime = div.querySelector('input[name="time"]').value;
    socket.emit('input_event', {
      "type": "wait", "time": waitTime
      , "callback": true
    });
  }

  function exec(div) {
    var command = div.querySelector('textarea[name="cmd"]').value;
    socket.emit('input_event', {
      "id": selectedElement.getSelectedElement().getId(), "type": "exec", "cmd": command
      , "callback": true
    })
  }

  function launch(div) {
    var path = div.querySelector('input[name="path"]').value;
    socket.emit('input_event', { "type": "launch", "path": path, "callback": true })
  }

  function close(div) {
    socket.emit('input_event', { "type": "close", "callback": true })
  }

  function inputHook(div) {
    var title = div.querySelector('input[name="title"]').value;
    var confidence = div.querySelector('input[name="confidence"]').value;
    var timeout = div.querySelector('input[name="timeout"]').value;
    socket.emit('input_event', { "type": "hookInputs", "title": title, "confidence": confidence, "timeout": timeout, "callback": true })
  }

  function videoHook(div) {
    var title = div.querySelector('input[name="title"]').value;
    var confidence = div.querySelector('input[name="confidence"]').value;
    socket.emit('input_event', { "type": "hookVideo", "confidence": confidence, "title": title, "callback": true })
  }

  function getWindowDimHook(div) {
    var x = div.querySelector('input[name="xpos"]')
    var y = div.querySelector('input[name="ypos"]')
    var w = div.querySelector('input[name="width"]')
    var h = div.querySelector('input[name="height"]')
    socket.emit('get_win_dim', {}, function (xx, yy, ww, hh) {
      x.value = xx;
      y.value = yy;
      w.value = ww;
      h.value = hh;
    })
  }

  function setWindowDimHook(div) {
    var x = div.querySelector('input[name="xpos"]').value
    var y = div.querySelector('input[name="ypos"]').value
    var w = div.querySelector('input[name="width"]').value
    var h = div.querySelector('input[name="height"]').value
    socket.emit('input_event', { "type": "setWindowDim", "xpos": x, "ypos": y, "width": w, "height": h, "callback": true })
  }

  actionListFuncs.recordClick = recordClick;
  actionListFuncs.simulateClick = simulateClick;
  actionListFuncs.recordContDrag = recordContDrag;
  actionListFuncs.simulateContDrag = simulateContDrag;
  actionListFuncs.simulateKey = simulateKey;
  actionListFuncs.recordClickDetect = recordClickDetect;
  actionListFuncs.simulateClickDetect = simulateClickDetect;
  actionListFuncs.wait = wait;
  actionListFuncs.exec = exec;
  actionListFuncs.launch = launch;
  actionListFuncs.close = close;
  actionListFuncs.inputHook = inputHook;
  actionListFuncs.videoHook = videoHook;
  actionListFuncs.getWindowDimHook = getWindowDimHook;
  actionListFuncs.setWindowDimHook = setWindowDimHook;

  window.actionListFuncs = actionListFuncs;


})();