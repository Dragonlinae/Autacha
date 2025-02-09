var splitter1 = document.getElementById('splitter1');
var splitter2 = document.getElementById('splitter2');

splitter1.addEventListener('mousedown', e => {
  e.preventDefault();
  document.addEventListener('mousemove', resize1);
  document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize1));
});

splitter2.addEventListener('mousedown', e => {
  e.preventDefault();
  document.addEventListener('mousemove', resize2);
  document.addEventListener('mouseup', () => document.removeEventListener('mousemove', resize2));
});

function resize1(e) {
  if (e.clientX > splitter2.getBoundingClientRect().left) {
    return;
  }
  document.documentElement.style.setProperty('--splitter1-pos', (e.clientX / window.innerWidth) * 100 + '%');
  console.log(e.clientX);
}

function resize2(e) {
  if (e.clientX < splitter1.getBoundingClientRect().right) {
    return;
  }
  document.documentElement.style.setProperty('--splitter2-pos', (e.clientX / window.innerWidth) * 100 + '%');
}

var socket = io.connect('http://' + document.domain + ':' + location.port);