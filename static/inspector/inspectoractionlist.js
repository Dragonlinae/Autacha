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

  addActionButton.addEventListener("click", function () {
    var action = {
      type: "test " + Math.floor(Math.random() * 100),
      params: "test"
    };
    var element = createActionElement(action)
    actionList.appendChild(element);
    element = actionList.lastElementChild;
    console.log(element);
  });

  function createActionElement(action) {
    var element = elementTemplate.content.cloneNode(true).children[0];
    element.querySelector(".action-type").textContent = action.type;
    element.querySelector(".action-params").textContent = action.params;
    element.querySelector(".delete-action").addEventListener("click", function () {
      element.remove();
    });
    element.querySelector(".dragger").addEventListener("mousedown", function (e) {
      actionListReorder(e, element);
    }
    );
    console.log(element);
    return element;
  }

  function updateActionList() {
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
          }, 1);
        } else if (afterElement && e.clientY > afterElement.getBoundingClientRect().top + afterElement.getBoundingClientRect().height / 2) {
          var prevposition = afterElement.getBoundingClientRect().top;
          actionList.insertBefore(afterElement, placeholder);
          var diff = prevposition - afterElement.getBoundingClientRect().top;
          afterElement.style.transition = "";
          afterElement.style.translate = "0px " + diff + "px";
          setTimeout(() => {
            afterElement.style.transition = "translate 0.2s";
            afterElement.style.translate = "0px 0px";
          }, 1);
        }
      }
    });
    document.addEventListener("mouseup", function (e) {
      isDragging = false;
      element.style.translate = "0px 0px";
      element.style.top = "auto";
      element.style.left = "auto";
      element.style.position = "static";
      placeholder.remove();
    });
  }


})();