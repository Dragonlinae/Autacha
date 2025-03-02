{/* <template id="action-template">
<li class="action-item">
  <span class="dragger">☰</span>
  <span class="action-type">{{ action_type }}</span>
  <span class="action-params">{{ action_params }}</span>
  <button class="delete-action">Delete</button>
</li>
</template> */}


(function () {
  var actionList = document.getElementById("action-list");
  var elementTemplate = document.getElementById("action-template");
  var addActionButton = document.getElementById("add-action");
  var saveActionButton = document.getElementById("save-action");

  var paramTemplates = {
    "click": document.getElementById("action-click-params-template"),
    "drag": document.getElementById("action-drag-params-template"),
    "cont-drag": document.getElementById("action-cont-drag-params-template"),
    "key": document.getElementById("action-key-params-template"),
    "wait": document.getElementById("action-wait-params-template"),
  };

  addActionButton.addEventListener("click", function () {
    var action = {
      type: Object.keys(paramTemplates)[Math.floor(Math.random() * Object.keys(paramTemplates).length)]
    };
    var element = createActionElement(action)
    actionList.appendChild(element);
    element = actionList.lastElementChild;
    console.log(element);
  });

  saveActionButton.addEventListener("click", function () {
    var actions = [];
    var actionElements = actionList.children;
    for (var i = 0; i < actionElements.length; i++) {
      actions.push(actionElements[i].toActionSave());
    }
    console.log(actions);
  });

  function createActionElement(action) {
    var element = elementTemplate.content.cloneNode(true).children[0];
    element.actionType = action.type;
    element.querySelector(".action-type").textContent = action.type;
    element.querySelector(".action-params").append(paramTemplates[action.type].content.cloneNode(true));
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
      for (var i = 0; i < labels.length; i++) {
        console.log(labels[i]);
        var input = labels[i].querySelector("input") || labels[i].querySelector("select");
        console.log(input);
        actionSave[input.name] = input.value;
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


})();